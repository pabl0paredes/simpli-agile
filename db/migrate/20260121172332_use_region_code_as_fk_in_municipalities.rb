class UseRegionCodeAsFkInMunicipalities < ActiveRecord::Migration[7.0]
  def up
    # 1) Regions: region_code obligatorio y único
    change_column_null :regions, :region_code, false
    add_index :regions, :region_code, unique: true unless index_exists?(:regions, :region_code, unique: true)

    # 2) Índice + FK + NOT NULL en municipalities.region_code
    add_index :municipalities, :region_code unless index_exists?(:municipalities, :region_code)
    change_column_null :municipalities, :region_code, false

    add_foreign_key :municipalities,
                    :regions,
                    column: :region_code,
                    primary_key: :region_code,
                    name: "fk_municipalities_region_code" unless foreign_key_exists?(:municipalities, :regions, column: :region_code)

    # 3) Drop region_id
    remove_column :municipalities, :region_id if column_exists?(:municipalities, :region_id)
  end

  def down
    # Reversión (si la necesitas)
    add_column :municipalities, :region_id, :integer unless column_exists?(:municipalities, :region_id)

    execute <<~SQL
      UPDATE municipalities m
      SET region_id = r.id
      FROM regions r
      WHERE m.region_code = r.region_code
        AND m.region_id IS NULL;
    SQL

    remove_foreign_key :municipalities, name: "fk_municipalities_region_code" rescue nil
    change_column_null :municipalities, :region_code, true
  end
end
