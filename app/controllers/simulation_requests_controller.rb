class SimulationRequestsController < ApplicationController
  before_action :authenticate_user!

  MAX_AGENTS = 5_000

  def create
    scenario = Scenario.find(params[:scenario_id])

    unless scenario.user_id == current_user.id
      return render json: { error: "No autorizado" }, status: :forbidden
    end

    require_municipality_access!(scenario.municipality_code, feature: "simulator")

    if scenario.status == "base"
      return render json: { error: "No se puede simular en el escenario base" }, status: :unprocessable_entity
    end

    agents = Array(params[:agents]).select { |a| a[:n_agents].to_i > 0 }

    if agents.empty?
      return render json: { error: "Ingresa al menos un agente para simular." }, status: :unprocessable_entity
    end

    if agents.any? { |a| a[:n_agents].to_i > MAX_AGENTS }
      return render json: { error: "El máximo de agentes por tipo es #{MAX_AGENTS.to_s(:delimited)}." }, status: :unprocessable_entity
    end

    requests = agents.map do |agent|
      SimulationRequest.create!(
        scenario_id:     scenario.id,
        agent_type_code: agent[:agent_type_code],
        n_agents:        agent[:n_agents].to_i,
        seed:            params[:seed]
      )
    end

    requests.each { |r| SimulationJob.perform_later(r.id) }

    render json: { ok: true, simulation_request_ids: requests.map(&:id) }, status: :created
  end

  def status
    sim_request = SimulationRequest.find(params[:id])

    unless sim_request.scenario.user_id == current_user.id
      return render json: { error: "No autorizado" }, status: :forbidden
    end

    render json: { status: sim_request.status, error_message: sim_request.error_message }
  end
end
