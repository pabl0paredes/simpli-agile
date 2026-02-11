class CreateTravelTimes < ActiveRecord::Migration[7.1]
  def change
    create_table :travel_times do |t|
      t.string :h3_origin, null: false
      t.string :h3_destiny, null: false
      t.float :travel_time
      t.references :travel_mode, null: false, foreign_key: true

      t.timestamps
    end

    add_index :travel_times, :h3_origin
    add_index :travel_times, :h3_destiny

    add_foreign_key :travel_times, :cells, column: :h3_origin, primary_key: :h3
    add_foreign_key :travel_times, :cells, column: :h3_destiny, primary_key: :h3
  end
end
