class ApplicationController < ActionController::Base
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
end
