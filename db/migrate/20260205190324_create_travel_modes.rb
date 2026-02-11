class CreateTravelModes < ActiveRecord::Migration[7.1]
  def change
    create_table :travel_modes do |t|
      t.integer :municipality_code, null: false
      t.string :mode
      t.string :function
      t.float :param_1
      t.float :param_2
      t.float :param_3

      t.timestamps
    end

    add_index :travel_modes, :municipality_code
    add_foreign_key :travel_modes, :municipalities, column: :municipality_code, primary_key: :municipality_code
  end
end
