class UsersController < ApplicationController
  before_action :authenticate_user!

  def update_default_municipality
    raw = params[:municipality_code] || params.dig(:user, :municipality_code)
    municipality_code = raw.presence&.to_i

    if municipality_code && !Municipality.exists?(municipality_code: municipality_code)
      render json: { error: "Comuna no válida" }, status: :unprocessable_entity
      return
    end

    current_user.update!(municipality_code: municipality_code)
    render json: { municipality_code: current_user.municipality_code }
  end
end
