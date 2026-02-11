class Municipality < ApplicationRecord
  self.primary_key = "municipality_code"

  belongs_to :region,
    foreign_key: "region_code",
    primary_key: "region_code"

  has_many :cells, foreign_key: :municipality_code, primary_key: :municipality_code

  def to_geojson
  {
    type: "Feature",
    geometry: RGeo::GeoJSON.encode(self.geometry),
    properties: {
      municipality_code: self.municipality_code,
      region_code: self.region_code,
      name: self.name
    }
  }
end

end
