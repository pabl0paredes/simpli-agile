class AddUniqueIndexToAccessibilities < ActiveRecord::Migration[7.1]
  def change
    add_index :accessibilities,
              [:h3, :travel_mode_id, :opportunity_code, :scenario_id, :accessibility_type],
              unique: true,
              name: 'uq_accessibilities'
  end
end
