class AnalyticsEventsController < ApplicationController
  def create
    AnalyticsEvent.create!(
      user_id:    current_user&.id,
      session_id: session.id.to_s,
      event_name: params.require(:event_name),
      metadata:   params.fetch(:metadata, {}).permit!.to_h
    )
    head :created
  rescue ActionController::ParameterMissing
    head :unprocessable_entity
  end
end
