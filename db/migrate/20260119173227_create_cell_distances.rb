class CreateCellDistances < ActiveRecord::Migration[7.1]
  def change
    create_table :cell_distances do |t|
      t.references :cell_origin, null: false, foreign_key: { to_table: :cells }
      t.references :cell_destiny, null: false, foreign_key: { to_table: :cells }
      t.float :distance, null: false

      t.timestamps
    end
    # Evita duplicados (misma pareja)
    add_index :cell_distances,
              [:cell_origin_id, :cell_destiny_id],
              unique: true
  end
end
