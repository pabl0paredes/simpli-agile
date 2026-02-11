class Region < ApplicationRecord
  self.primary_key = "region_code"

  has_many :municipalities,
    foreign_key: "region_code",
    primary_key: "region_code"

  def to_geojson
    {
      type: "Feature",
      geometry: RGeo::GeoJSON.encode(self.geometry),
      properties: {
        region_code: self.region_code,
        name: self.name
      }
    }
end
end
