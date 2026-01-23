class CreateRegions < ActiveRecord::Migration[7.1]
  def change
    create_table :regions do |t|
      t.string :name
      t.integer :zoom

      # Centroide como geometry (POINT, SRID 4326)
      t.st_point :centroid, srid: 4326, null: false

      # Boundary como geometry (POLYGON, SRID 4326)
      t.st_polygon :geometry, srid: 4326, null: false

      t.timestamps
    end
    add_index :regions, :name, unique: true
    add_index :regions, :centroid, using: :gist
    add_index :regions, :geometry, using: :gist
  end
end
