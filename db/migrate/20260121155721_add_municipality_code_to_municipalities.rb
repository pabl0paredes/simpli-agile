class AddMunicipalityCodeToMunicipalities < ActiveRecord::Migration[7.1]
  def change
    add_column :municipalities, :municipality_code, :integer
  end
end
