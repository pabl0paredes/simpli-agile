# db/migrate/XXXXXXXXXXXXXX_create_bins.rb
class CreateBins < ActiveRecord::Migration[7.1]
  def change
    create_table :bins do |t|
      t.references :visual_mode, null: false, foreign_key: true
      t.float :bin_0, null: false
      t.float :bin_1, null: false
      t.float :bin_2, null: false
      t.float :bin_3, null: false
      t.float :bin_4, null: false
      t.float :bin_5, null: false
      t.timestamps
    end
  end
end
