class CreateMunicipalities < ActiveRecord::Migration[7.1]
  def change
    create_table :municipalities, id: false do |t|
      t.integer :municipality_code, null: false, primary_key: true
      t.string :name
      t.integer :region_code, null: false
      t.integer :zoom

      t.geometry :centroid, srid: 4326
      t.geometry :geometry, srid: 4326

      t.timestamps
    end

    add_index :municipalities, :region_code
    add_index :municipalities, :centroid, using: :gist
    add_index :municipalities, :geometry, using: :gist

    add_foreign_key :municipalities, :regions, column: :region_code, primary_key: :region_code
  end
end
