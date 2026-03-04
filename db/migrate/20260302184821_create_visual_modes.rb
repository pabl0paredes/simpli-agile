# db/migrate/XXXXXXXXXXXXXX_create_visual_modes.rb
class CreateVisualModes < ActiveRecord::Migration[7.1]
  def change
    create_table :visual_modes do |t|
      t.string  :mode_code, null: false
      t.string  :name, null: false
      t.string  :opportunity_code, null: false
      t.integer :municipality_code, null: false

      t.timestamps
    end

    add_foreign_key :visual_modes, :opportunities,
      column: :opportunity_code, primary_key: :opportunity_code

    add_foreign_key :visual_modes, :municipalities,
      column: :municipality_code, primary_key: :municipality_code

    add_index :visual_modes, [:municipality_code, :opportunity_code, :mode_code],
      unique: true, name: "idx_visual_modes_unique_combo"
  end
end
