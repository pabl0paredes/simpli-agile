class AddUniqueIndexToScenarioCells < ActiveRecord::Migration[7.1]
  def change
    add_index :scenario_cells,
              [:scenario_id, :h3, :opportunity_code],
              unique: true,
              name: "idx_scenario_cells_unique"
  end
end
