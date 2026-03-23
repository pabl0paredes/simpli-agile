class HomeController < ApplicationController
  def index
    if user_signed_in? && current_user.municipality_code.present?
      mun = Municipality.select(:municipality_code, :name, :centroid, :zoom)
        .find_by(municipality_code: current_user.municipality_code)
      if mun
        @initial_center       = [mun.centroid.x, mun.centroid.y].to_json
        @initial_zoom         = mun.zoom
        @initial_municipality = mun
      end
    end
  end
end
