class AddRegionCodeToMunicipalities < ActiveRecord::Migration[7.1]
  def change
    add_column :municipalities, :region_code, :integer
  end
end
