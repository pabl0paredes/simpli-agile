class CreateMunicipalities < ActiveRecord::Migration[7.1]
  def change
    create_table :municipalities do |t|
      t.string :name, null: false
      t.integer :zoom, null: false
      t.references :region, null: false, foreign_key: true

      # Centroide (POINT, geometry, SRID 4326)
      t.st_point :centroid, srid: 4326, null: false

      # Boundary comunal (POLYGON, geometry, SRID 4326)
      t.st_polygon :geometry, srid: 4326, null: false

      t.timestamps
    end

    # Índices
    add_index :municipalities, [:region_id, :name], unique: true
    add_index :municipalities, :centroid, using: :gist
    add_index :municipalities, :geometry, using: :gist
  end
end
