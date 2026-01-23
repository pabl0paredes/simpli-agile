class CreateUses < ActiveRecord::Migration[7.1]
  def change
    create_table :uses do |t|
      t.string :name

      t.timestamps
    end
  end
end
