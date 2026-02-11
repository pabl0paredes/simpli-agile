class CreateAvailabilities < ActiveRecord::Migration[7.1]
  def change
    create_table :availabilities do |t|
      t.references :user, null: false, foreign_key: true
      t.integer :municipality_code, null: false

      t.timestamps
    end

    add_index :availabilities, :municipality_code
    add_foreign_key :availabilities, :municipalities, column: :municipality_code, primary_key: :municipality_code
  end
end
