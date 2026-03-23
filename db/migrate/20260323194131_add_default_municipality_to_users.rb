class AddDefaultMunicipalityToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :municipality_code, :integer
    add_foreign_key :users, :municipalities, column: :municipality_code, primary_key: :municipality_code
  end
end
