class AddDefaultToTimestampsInNewTables < ActiveRecord::Migration[7.1]
  def change
    tables = %w[visual_modes bins]

    tables.each do |table|
      change_column_default table, :created_at, -> { 'CURRENT_TIMESTAMP' }
      change_column_default table, :updated_at, -> { 'CURRENT_TIMESTAMP' }
    end
  end
end
