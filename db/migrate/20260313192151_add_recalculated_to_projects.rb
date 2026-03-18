class AddRecalculatedToProjects < ActiveRecord::Migration[7.1]
  def change
    add_column :projects, :recalculated, :boolean, default: false, null: false
  end
end
