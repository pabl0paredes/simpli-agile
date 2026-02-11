class AddDefaultToTimestampsForAllTables < ActiveRecord::Migration[7.1]
  def change
    tables = %w[
      users regions municipalities scenarios cells opportunities scenario_cells travel_times accessibilities projects
      info_cells travel_modes availabilities
    ]

    tables.each do |table|
      change_column_default table, :created_at, -> { 'CURRENT_TIMESTAMP' }
      change_column_default table, :updated_at, -> { 'CURRENT_TIMESTAMP' }
    end
  end
end
