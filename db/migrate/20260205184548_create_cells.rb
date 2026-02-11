class CreateCells < ActiveRecord::Migration[7.1]
  def change
    create_table :cells, id: false do |t|
      t.string :h3, null: false, primary_key: true

      t.geometry :geometry, srid: 4326

      t.timestamps
    end

    add_index :cells, :geometry, using: :gist
  end
end
