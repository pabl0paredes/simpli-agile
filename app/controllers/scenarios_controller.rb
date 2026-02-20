class ScenariosController < ApplicationController
  before_action :authenticate_user!

  SYSTEM_EMAIL = "system@simpli.cl".freeze

  def names
    mun_code = params.require(:municipality_code).to_i

    system_user = User.find_by(email: SYSTEM_EMAIL)
    base = Scenario.find_by(user_id: system_user&.id, municipality_code: mun_code)

    user_scenarios = Scenario
      .where(user_id: current_user.id, municipality_code: mun_code)
      .where.not(id: base&.id)
      .select(:id, :name)
      .order(created_at: :desc)

    payload = []
    if base
      payload << { id: base.id, name: base.name.presence || "Escenario base", is_base: true }
    end

    payload += user_scenarios.map { |s| { id: s.id, name: s.name.presence || "Escenario #{s.id}", is_base: false } }

    render json: payload
  end

  def ensure_draft
    mun_code = params.require(:municipality_code).to_i

    base_id = params[:base_scenario_id].presence&.to_i

    # ✅ Si no viene base_id, inferirlo: "escenario base del system_user para esa comuna"
    if base_id.nil?
      base = Scenario.find_by(user_id: 1, municipality_code: mun_code, status: "base")
      return render json: { error: "No existe escenario base para municipality_code=#{mun_code}" }, status: :unprocessable_entity if base.nil?
      base_id = base.id
    end

    draft = Scenario.find_or_create_by!(
      user_id: current_user.id,
      municipality_code: mun_code,
      status: "draft",
      parent_id: base_id
    ) do |s|
      s.name = "Borrador"
    end

    if draft.parent_id != base_id
      draft.update!(parent_id: base_id)
    end

    render json: { scenario_id: draft.id, base_scenario_id: base_id }
  end

  def publish
    scenario = current_user.scenarios.find(params[:id])

    name = params[:name].to_s.strip
    if name.blank?
      return render json: { error: "Debes indicar un nombre para el escenario." }, status: :unprocessable_entity
    end

    ::Scenarios::PublishAndRecalculate.call!(scenario:, name:)

    render json: { ok: true, scenario_id: scenario.id }
  rescue ::Scenarios::PublishAndRecalculate::NotDraftError => e
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
    viewing_id = scenario.id

    conn = ActiveRecord::Base.connection.raw_connection

    is_base = (scenario.status == "base")

    # 1) Cadena de ancestros: scenario -> parent -> ... (máx 30)
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

    chain_ids = is_base ? [scenario.id] : conn.exec_params(chain_sql, [viewing_id]).map { |r| r["id"].to_i }

    # 2) Proyectos "anteriores": todos los projects de la cadena
    previous_projects = is_base ? [] : Project
      .where(scenario_id: chain_ids)
      .select(:id, :name, :scenario_id, :created_at)
      .order(created_at: :desc)

    # 3) Draft hijo (si existe) del escenario seleccionado
    draft = Scenario.find_by(
      user_id: current_user.id,
      municipality_code: scenario.municipality_code,
      status: "draft",
      parent_id: viewing_id
    )

    draft_projects =
      if draft
        Project.where(scenario_id: draft.id)
          .select(:id, :name, :scenario_id, :created_at)
          .order(created_at: :desc)
      else
        []
      end

    render json: {
      viewing_scenario: { id: scenario.id, name: scenario.name, status: scenario.status },
      chain_ids: chain_ids, # útil para debug; si quieres lo sacamos después
      previous_projects: previous_projects.as_json(only: [:id, :name, :scenario_id]),
      draft_scenario: draft ? { id: draft.id, status: draft.status, parent_id: draft.parent_id } : nil,
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



end
