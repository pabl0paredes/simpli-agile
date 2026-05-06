class AddFeatureToAvailabilities < ActiveRecord::Migration[7.1]
  FEATURES = %w[normative locator simulator].freeze

  def up
    add_column :availabilities, :feature, :string

    # Expand existing rows (generic access) into one row per feature
    execute <<~SQL
      INSERT INTO availabilities (user_id, municipality_code, feature, created_at, updated_at)
      SELECT a.user_id, a.municipality_code, f.feature, NOW(), NOW()
      FROM availabilities a
      CROSS JOIN (VALUES ('normative'), ('locator'), ('simulator')) AS f(feature)
      WHERE a.feature IS NULL
      ON CONFLICT DO NOTHING;
    SQL

    execute "DELETE FROM availabilities WHERE feature IS NULL;"

    change_column_null :availabilities, :feature, false

    add_index :availabilities, [:user_id, :municipality_code, :feature],
              unique: true, name: "index_availabilities_on_user_municipality_feature"
  end

  def down
    remove_index :availabilities, name: "index_availabilities_on_user_municipality_feature"
    remove_column :availabilities, :feature
  end
end
