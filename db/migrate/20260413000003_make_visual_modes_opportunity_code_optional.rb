class MakeVisualModesOpportunityCodeOptional < ActiveRecord::Migration[7.1]
  def up
    remove_foreign_key :visual_modes, column: :opportunity_code
    change_column_null :visual_modes, :opportunity_code, true

    # Recreate unique index to handle NULLs correctly (each NULL is treated as
    # distinct in Postgres, so normative rows won't collide on opportunity_code)
    remove_index :visual_modes, name: "idx_visual_modes_unique_combo"
    add_index :visual_modes, [:municipality_code, :opportunity_code, :mode_code],
              name: "idx_visual_modes_unique_combo",
              unique: true
  end

  def down
    # Revert: restore NOT NULL and FK (assumes no NULL rows exist)
    change_column_null :visual_modes, :opportunity_code, false
    add_foreign_key :visual_modes, :opportunities, column: :opportunity_code, primary_key: :opportunity_code

    remove_index :visual_modes, name: "idx_visual_modes_unique_combo"
    add_index :visual_modes, [:municipality_code, :opportunity_code, :mode_code],
              name: "idx_visual_modes_unique_combo",
              unique: true
  end
end
