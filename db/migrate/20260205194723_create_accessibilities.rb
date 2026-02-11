class CreateAccessibilities < ActiveRecord::Migration[7.1]
  def change
    create_table :accessibilities do |t|
      t.string :h3, null: false
      t.references :travel_mode, null: false, foreign_key: true
      t.string :accessibility_type
      t.string :opportunity_code, null: false
      t.references :scenario, null: false, foreign_key: true
      t.float :value

      t.timestamps
    end

    add_index :accessibilities, :opportunity_code
    add_index :accessibilities, :h3

    add_foreign_key :accessibilities, :opportunities, column: :opportunity_code, primary_key: :opportunity_code
    add_foreign_key :accessibilities, :cells, column: :h3, primary_key: :h3
  end
end
