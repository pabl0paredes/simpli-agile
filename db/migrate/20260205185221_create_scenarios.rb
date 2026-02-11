class CreateScenarios < ActiveRecord::Migration[7.1]
  def change
    create_table :scenarios do |t|
      t.string :name
      t.references :user, null: false, foreign_key: true
      t.integer :municipality_code, null: false

      t.timestamps
    end

    add_index :scenarios, :municipality_code

    add_foreign_key :scenarios, :municipalities, column: :municipality_code, primary_key: :municipality_code
  end
end
