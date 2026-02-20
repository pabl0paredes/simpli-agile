class AddPerformanceIndexes < ActiveRecord::Migration[7.1]
  disable_ddl_transaction!

  def change
    # travel_times: usado intensivamente en recálculo de accesibilidad
    add_index :travel_times, [:travel_mode_id, :h3_origin],
              algorithm: :concurrently,
              name: "idx_travel_times_mode_origin"

    # accessibilities: usado para leer/borrar por scenario+modo+opp+type
    add_index :accessibilities, [:scenario_id, :travel_mode_id, :opportunity_code, :accessibility_type],
              algorithm: :concurrently,
              name: "idx_accessibilities_query"

    # scenario_cells: acelerar lookup por scenario+opp (cuando pintas thematic por opp)
    add_index :scenario_cells, [:scenario_id, :opportunity_code],
              algorithm: :concurrently,
              name: "idx_scenario_cells_scenario_opp"

    # projects: acelerar agregaciones y filtros por scenario+opp
    add_index :projects, [:scenario_id, :opportunity_code],
              algorithm: :concurrently,
              name: "idx_projects_scenario_opp"
  end
end
