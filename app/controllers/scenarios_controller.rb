class ScenariosController < ApplicationController
  before_action :authenticate_user!
  before_action :check_municipality_access!, only: [:names, :create]

  SYSTEM_EMAIL = "system@simpli.cl".freeze

  def names
    mun_code = params.require(:municipality_code).to_i

    system_user = User.find_by(email: SYSTEM_EMAIL)
    base = Scenario.find_by(user_id: system_user&.id, municipality_code: mun_code)

    user_scenarios = Scenario
      .where(user_id: current_user.id, municipality_code: mun_code)
      .where.not(id: base&.id)
      .select(:id, :name, :status)
      .order(created_at: :desc)

    payload = []

    if base
      payload << {
        id: base.id,
        name: base.name.presence || "Escenario base",
        is_base: true,
        status: base.status
      }
    end

    payload += user_scenarios.map do |s|
      {
        id: s.id,
        name: s.name.presence || "Escenario #{s.id}",
        is_base: false,
        status: s.status
      }
    end

    render json: payload
  end

  def create
    mun_code = params.require(:municipality_code).to_i
    name = params.require(:name).to_s.strip
    base_scenario_id = params[:base_scenario_id].presence&.to_i

    if name.blank?
      return render json: { error: "Debes indicar un nombre para el escenario." }, status: :unprocessable_entity
    end

    scenario = Scenario.create!(
      user_id: current_user.id,
      municipality_code: mun_code,
      name: name,
      status: "draft",
      parent_id: base_scenario_id
    )

    render json: { ok: true, scenario_id: scenario.id }, status: :created
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def recalculate
    scenario = current_user.scenarios.find(params[:id])

    if scenario.status == "base"
      return render json: { error: "No puedes modificar el escenario base." }, status: :unprocessable_entity
    end

    ::Scenarios::Recalculate.call!(scenario:)

    render json: { ok: true, scenario_id: scenario.id }
  rescue ::Scenarios::Recalculate::Error => e
    render json: { error: e.message }, status: :unprocessable_entity
  rescue ActiveRecord::RecordNotFound
    render json: { error: "No autorizado." }, status: :forbidden
  end

  def projects_lists
    scenario =
      current_user.scenarios.find_by(id: params[:id]) ||
      begin
        system_user = User.find_by(email: SYSTEM_EMAIL)
        Scenario.find_by(id: params[:id], user_id: system_user&.id)
      end

    return render json: { error: "No autorizado." }, status: :forbidden unless scenario

    viewing_id = scenario.id
    is_base = (scenario.status == "base")

    # Cadena de ancestros (excluyendo el propio escenario)
    parent_chain_ids =
      if is_base || scenario.parent_id.nil?
        []
      else
        conn = ActiveRecord::Base.connection.raw_connection
        chain_sql = <<~SQL
          WITH RECURSIVE chain AS (
            SELECT s.id, s.parent_id, 0 AS depth
            FROM scenarios s
            WHERE s.id = $1
            UNION ALL
            SELECT p.id, p.parent_id, c.depth + 1
            FROM scenarios p
            JOIN chain c ON p.id = c.parent_id
            WHERE c.depth < 30
          )
          SELECT id FROM chain;
        SQL
        conn.exec_params(chain_sql, [scenario.parent_id]).map { |r| r["id"].to_i }
      end

    # Proyectos de ancestros (siempre localizados)
    previous_projects = is_base ? [] : Project
      .where(scenario_id: parent_chain_ids)
      .select(:id, :name, :scenario_id, :created_at, :recalculated)
      .order(created_at: :desc)

    # Proyectos propios: separar por recalculated
    own_recalculated = is_base ? [] : Project
      .where(scenario_id: viewing_id, recalculated: true)
      .select(:id, :name, :scenario_id, :created_at, :recalculated)
      .order(created_at: :desc)

    own_pending = is_base ? [] : Project
      .where(scenario_id: viewing_id, recalculated: false)
      .select(:id, :name, :scenario_id, :created_at, :recalculated)
      .order(created_at: :desc)

    # PROYECTOS LOCALIZADOS = ancestros + propios ya recalculados
    previous_projects = previous_projects.to_a + own_recalculated.to_a
    draft_projects = own_pending

    render json: {
      viewing_scenario: { id: scenario.id, name: scenario.name, status: scenario.status },
      previous_projects: previous_projects.as_json(only: [:id, :name, :scenario_id]),
      draft_scenario: is_base ? nil : { id: scenario.id, status: scenario.status, parent_id: scenario.parent_id },
      draft_projects: draft_projects.as_json(only: [:id, :name, :scenario_id])
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "No autorizado." }, status: :forbidden
  end

  def destroy
    scenario = current_user.scenarios.find(params[:id])

    if scenario.status == "base"
      return render json: { error: "No puedes eliminar el escenario base." }, status: :unprocessable_entity
    end

    Scenarios::DestroyCascade.call!(scenario: scenario, user: current_user)

    render json: { ok: true }
  rescue ActiveRecord::RecordNotFound
    render json: { error: "No autorizado." }, status: :forbidden
  end

  private

  def check_municipality_access!
    municipality_code = params[:municipality_code].to_i
    require_municipality_access!(municipality_code)
  end

end
