class RenameBaseScenarioIdInScenarioCells < ActiveRecord::Migration[7.1]
  def change
    rename_column :scenario_cells, :base_scenario_id, :scenario_id

    # Renombrar el índice existente
    if index_name_exists?(:scenario_cells, "index_scenario_cells_on_base_scenario_id")
      rename_index :scenario_cells,
                   "index_scenario_cells_on_base_scenario_id",
                   "index_scenario_cells_on_scenario_id"
    end

    # Asegurar index por columna (por si no existía o rename_index no aplica)
    add_index :scenario_cells, :scenario_id unless index_exists?(:scenario_cells, :scenario_id)

    # Foreign key
    add_foreign_key :scenario_cells, :scenarios, column: :scenario_id unless foreign_key_exists?(:scenario_cells, :scenarios, column: :scenario_id)
  end
end
