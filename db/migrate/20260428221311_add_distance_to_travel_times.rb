class AddDistanceToTravelTimes < ActiveRecord::Migration[7.1]
  def change
    add_column :travel_times, :distance, :float
  end
end
