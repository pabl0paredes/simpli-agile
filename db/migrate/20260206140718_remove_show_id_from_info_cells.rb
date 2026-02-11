class RemoveShowIdFromInfoCells < ActiveRecord::Migration[7.1]
  def change
    remove_column :info_cells, :show_id, :integer
  end
end
