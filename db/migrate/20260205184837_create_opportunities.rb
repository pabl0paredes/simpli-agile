class CreateOpportunities < ActiveRecord::Migration[7.1]
  def change
    create_table :opportunities, id: false do |t|
      t.string :opportunity_code, null: false, primary_key: true
      t.string :name
      t.string :category
      t.integer :municipality_code, null: false

      t.timestamps
    end

    add_index :opportunities, :municipality_code
    add_index :opportunities, :opportunity_code, unique: true

    add_foreign_key :opportunities, :municipalities, column: :municipality_code, primary_key: :municipality_code
  end
end
