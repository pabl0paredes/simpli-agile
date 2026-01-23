class AddRegionCodeToRegions < ActiveRecord::Migration[7.1]
  def change
    add_column :regions, :region_code, :integer
  end
end
