class RemoveMunicipalityCodeFromOpportunities < ActiveRecord::Migration[7.1]
  def change
    remove_index :opportunities, name: "index_opportunities_on_municipality_code"
    remove_column :opportunities, :municipality_code
  end
end
