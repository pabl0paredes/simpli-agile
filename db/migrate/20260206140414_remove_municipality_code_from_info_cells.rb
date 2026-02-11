class RemoveMunicipalityCodeFromInfoCells < ActiveRecord::Migration[7.1]
  def change
    remove_column :info_cells, :municipality_code, :integer
  end
end
