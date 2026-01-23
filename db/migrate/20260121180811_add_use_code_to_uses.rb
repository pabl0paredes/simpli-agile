class AddUseCodeToUses < ActiveRecord::Migration[7.1]
  def change
    add_column :uses, :use_code, :string
  end
end
