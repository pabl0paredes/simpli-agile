class ApplicationController < ActionController::Base
  include Pundit::Authorization

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  layout :layout_by_resource

  private

  def layout_by_resource
    if devise_controller? && turbo_frame_request?
      false
    else
      "application"
    end
  end

  def after_sign_in_path_for(resource)
    root_path
  end

  # Raises 403 if the current user doesn't have an availability record
  # for the given municipality_code. Also requires authentication.
  def require_municipality_access!(municipality_code)
    raise Pundit::NotAuthorizedError unless user_signed_in?
    raise Pundit::NotAuthorizedError unless current_user.availabilities.exists?(municipality_code: municipality_code.to_i)
  end

  def user_not_authorized
    render json: { error: "No autorizado." }, status: :forbidden
  end
end
