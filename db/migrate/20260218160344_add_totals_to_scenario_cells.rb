class AddTotalsToScenarioCells < ActiveRecord::Migration[7.1]
  def change
    add_column :scenario_cells, :units_total, :integer, null: false
    add_column :scenario_cells, :surface_total, :integer, null: false
  end
end
