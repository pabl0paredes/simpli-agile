class AddMunicipalityCodeToCells < ActiveRecord::Migration[7.1]
  def change
    add_column :cells, :municipality_code, :integer, null: false

    add_foreign_key :cells, :municipalities, column: :municipality_code, primary_key: :municipality_code
  end
end
