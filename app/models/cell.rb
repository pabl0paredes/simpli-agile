class Cell < ApplicationRecord
  self.primary_key = "h3"
  belongs_to :municipality, foreign_key: :municipality_code, primary_key: :municipality_code
  has_many :info_cells, foreign_key: "h3", primary_key: "h3", dependent: :delete_all

  def to_geojson(properties = {})
    {
      type: "Feature",
      geometry: RGeo::GeoJSON.encode(geometry),
      properties: properties
    }
  end
end
