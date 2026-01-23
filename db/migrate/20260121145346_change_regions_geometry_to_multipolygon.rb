class ChangeRegionsGeometryToMultipolygon < ActiveRecord::Migration[7.1]
  def up
    execute <<~SQL
      ALTER TABLE regions
        ALTER COLUMN geometry TYPE geometry(MultiPolygon, 4326)
        USING ST_Multi(geometry);
    SQL
  end

  def down
    execute <<~SQL
      ALTER TABLE regions
        ALTER COLUMN geometry TYPE geometry(Polygon, 4326)
        USING ST_GeometryN(geometry, 1);
    SQL
  end
end
