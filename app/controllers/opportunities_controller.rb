class OpportunitiesController < ApplicationController
  def index
    opps = Opportunity.select(:name, :opportunity_code, :category).all
    render json: opps.order(:name)
  end

end
