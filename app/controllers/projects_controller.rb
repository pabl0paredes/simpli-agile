class ProjectsController < ApplicationController
  def create
    scenario = Scenario.find(params[:scenario_id])

    unless scenario.user_id == current_user.id
      return render json: { error: "No autorizado" }, status: :forbidden
    end

    # 🔒 Evitar escribir en escenario base
    if scenario.status == "base"
      return render json: { error: "No se puede modificar el escenario base" }, status: :unprocessable_entity
    end

    project = scenario.projects.build(project_params)

    if project.save
      render json: {
        id: project.id,
        h3: project.h3,
        name: project.name,
        opportunity_code: project.opportunity_code,
        total_agents: project.total_agents,
        surface_per_agent: project.surface_per_agent
      }, status: :created
    else
      render json: { errors: project.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def hover_info
    project = Project
      .joins(:opportunity)
      .select(
        "projects.id,
        projects.h3,
        projects.total_agents,
        projects.surface_per_agent,
        opportunities.name AS opportunity_name"
      )
      .find(params[:id])

    render json: {
      id: project.id,
      h3: project.h3,
      total_agents: project.total_agents,
      surface_per_agent: project.surface_per_agent,
      opportunity_name: project.opportunity_name
    }
  end

  def destroy
    project = Project.joins(:scenario).find(params[:id])
    scenario = project.scenario

    unless scenario.user_id == current_user.id
      return render json: { error: "No autorizado" }, status: :forbidden
    end

    if scenario.status == "base"
      return render json: { error: "No se puede modificar el escenario base" }, status: :unprocessable_entity
    end

    project.destroy!

    render json: {
      ok: true,
      deleted_project_id: project.id
    }
  end


  private

  def project_params
    params.require(:project).permit(
      :h3,
      :name,
      :opportunity_code,
      :total_agents,
      :surface_per_agent
    )
  end
end
