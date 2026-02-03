class Municipality < ApplicationRecord
  belongs_to :region, primary_key: :region_code, foreign_key: :region_code

  def to_geojson
    {
      type: "Feature",
      geometry: RGeo::GeoJSON.encode(self.geometry),
      id: self.id,
      properties: {
        id: self.id,
        region_code: self.region_code,
        name: self.name
      }
    }
  end
end
