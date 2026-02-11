class CreateInfoCells < ActiveRecord::Migration[7.1]
  def change
    create_table :info_cells do |t|
      t.string :h3, null: false
      t.integer :municipality_code, null: false
      t.integer :show_id
      t.string :opportunity_code
      t.integer :units
      t.integer :surface

      t.timestamps
    end

    add_index :info_cells, :municipality_code
    add_index :info_cells, :h3
    add_index :info_cells, :opportunity_code

    add_foreign_key :info_cells, :municipalities, column: :municipality_code, primary_key: :municipality_code
    add_foreign_key :info_cells, :cells, column: :h3, primary_key: :h3
    add_foreign_key :info_cells, :opportunities, column: :opportunity_code, primary_key: :opportunity_code
  end
end
