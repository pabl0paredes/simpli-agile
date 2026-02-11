class OpportunitiesController < ApplicationController
  def index
    opps = Opportunity.select(:name, :opportunity_code).all
    render json: opps
  end

end
