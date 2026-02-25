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

  def ensure_draft
    mun_code = params.require(:municipality_code).to_i

    base_id = params[:base_scenario_id].presence&.to_i

    if base_id
      base = Scenario.find_by(id: base_id)
      # 🔒 Si te pasan un draft, usa su padre como base real
      if base&.status == "draft"
        base_id = base.parent_id
      end
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

    if scenario.status == "draft"
      # cadena ancestros desde el draft (incluye self)
      chain_ids = conn.exec_params(chain_sql, [viewing_id]).map { |r| r["id"].to_i }

      # ✅ anteriores: ancestros EXCLUYENDO el mismo draft
      previous_projects = Project
        .where(scenario_id: chain_ids - [scenario.id])
        .select(:id, :name, :scenario_id, :created_at)
        .order(created_at: :desc)

      # ✅ borrador: projects del mismo draft
      draft_projects = Project
        .where(scenario_id: scenario.id)
        .select(:id, :name, :scenario_id, :created_at)
        .order(created_at: :desc)

      return render json: {
        viewing_scenario: { id: scenario.id, name: scenario.name, status: scenario.status },
        chain_ids: chain_ids,
        previous_projects: previous_projects.as_json(only: [:id, :name, :scenario_id]),
        draft_scenario: { id: scenario.id, status: scenario.status, parent_id: scenario.parent_id },
        draft_projects: draft_projects.as_json(only: [:id, :name, :scenario_id])
      }
    end



    if scenario.status == "draft"
      # 🔥 Si estoy en draft:
      # - historial = parent + sus padres
      parent_id = scenario.parent_id

      chain_ids =
        if parent_id
          conn.exec_params(chain_sql, [parent_id]).map { |r| r["id"].to_i }
        else
          []
        end
    else
      # comportamiento normal
      chain_ids =
        is_base ? [scenario.id] :
          conn.exec_params(chain_sql, [viewing_id]).map { |r| r["id"].to_i }
    end

    # 2) Proyectos "anteriores": todos los projects de la cadena
    previous_projects = is_base ? [] : Project
      .where(scenario_id: chain_ids)
      .select(:id, :name, :scenario_id, :created_at)
      .order(created_at: :desc)

    # 3) Draft hijo (si existe) del escenario seleccionado
    if scenario.status == "draft"
      draft = scenario
    else
      draft = Scenario.find_by(
        user_id: current_user.id,
        municipality_code: scenario.municipality_code,
        status: "draft",
        parent_id: viewing_id
      )
    end

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
