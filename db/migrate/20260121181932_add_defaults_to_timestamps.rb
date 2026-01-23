class AddDefaultsToTimestamps < ActiveRecord::Migration[7.0]
  def up
    tables = ActiveRecord::Base.connection.tables

    tables.each do |table|
      next if table == "schema_migrations"
      next if table == "ar_internal_metadata"

      columns = ActiveRecord::Base.connection.columns(table).map(&:name)

      if columns.include?("created_at")
        execute <<~SQL
          ALTER TABLE #{table}
          ALTER COLUMN created_at SET DEFAULT NOW();
        SQL
      end

      if columns.include?("updated_at")
        execute <<~SQL
          ALTER TABLE #{table}
          ALTER COLUMN updated_at SET DEFAULT NOW();
        SQL
      end
    end
  end

  def down
    tables = ActiveRecord::Base.connection.tables

    tables.each do |table|
      next if table == "schema_migrations"
      next if table == "ar_internal_metadata"

      columns = ActiveRecord::Base.connection.columns(table).map(&:name)

      if columns.include?("created_at")
        execute <<~SQL
          ALTER TABLE #{table}
          ALTER COLUMN created_at DROP DEFAULT;
        SQL
      end

      if columns.include?("updated_at")
        execute <<~SQL
          ALTER TABLE #{table}
          ALTER COLUMN updated_at DROP DEFAULT;
        SQL
      end
    end
  end
end
