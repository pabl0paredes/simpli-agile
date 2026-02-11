class CreateScenarioCells < ActiveRecord::Migration[7.1]
  def change
    create_table :scenario_cells do |t|
      t.string :h3, null: false
      t.references :base_scenario, null: false, foreign_key: { to_table: :scenarios }
      t.string :opportunity_code, null: false
      t.integer :units_delta
      t.integer :surface_delta

      t.timestamps
    end

    add_index :scenario_cells, :h3
    add_index :scenario_cells, :opportunity_code

    add_foreign_key :scenario_cells, :cells, column: :h3, primary_key: :h3
    add_foreign_key :scenario_cells, :opportunities, column: :opportunity_code, primary_key: :opportunity_code
  end
end
