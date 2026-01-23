class RegionsController < ApplicationController
  def index
    regions = Region.select(:id, :name, :region_code, :geometry).all

    # Iterar sobre las regiones y convertirlas a GeoJSON
    features = regions.map { |region| region.to_geojson }

    # Convertirlo en un FeatureCollection
    geojson = {
      type: "FeatureCollection",
      features: features
    }

    render json: geojson
  end

  def names
    regions = Region.select(:id, :name).all
    render json: regions
  end
end
