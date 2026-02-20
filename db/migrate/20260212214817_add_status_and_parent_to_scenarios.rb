class AddStatusAndParentToScenarios < ActiveRecord::Migration[7.1]
  def change
    add_column :scenarios, :status, :string
    add_column :scenarios, :parent_id, :bigint

    add_index :scenarios, [:user_id, :municipality_code, :status]
    add_foreign_key :scenarios, :scenarios, column: :parent_id
  end
end
