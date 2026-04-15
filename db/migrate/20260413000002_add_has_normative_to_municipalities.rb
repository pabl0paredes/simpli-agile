class AddHasNormativeToMunicipalities < ActiveRecord::Migration[7.1]
  def change
    add_column :municipalities, :has_normative, :boolean, default: false, null: false
  end
end
