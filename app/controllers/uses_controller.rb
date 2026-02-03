class UsesController < ApplicationController
  def index
    uses = Use.select(:id, :name, :use_code).all
    render json: uses
  end

end
