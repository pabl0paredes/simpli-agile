class Region < ApplicationRecord
  has_many :municipalities, primary_key: :region_code, foreign_key: :region_code

  def to_geojson
    {
      type: "Feature",
      geometry: RGeo::GeoJSON.encode(self.geometry),
      properties: {
        id: self.id,
        region_code: self.region_code,
        name: self.name
      }
    }
  end
end
