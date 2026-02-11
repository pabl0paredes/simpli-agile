class CreateRegions < ActiveRecord::Migration[7.1]
  def change
    create_table :regions, id: false do |t|
      t.integer :region_code, null: false, primary_key: true
      t.string :name
      t.integer :zoom

      t.geometry :centroid, srid: 4326
      t.geometry :geometry, srid: 4326

      t.timestamps
    end

    add_index :regions, :centroid, using: :gist
    add_index :regions, :geometry, using: :gist
  end
end
