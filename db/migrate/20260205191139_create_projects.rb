class CreateProjects < ActiveRecord::Migration[7.1]
  def change
    create_table :projects do |t|
      t.string :name
      t.references :scenario, null: false, foreign_key: true
      t.string :h3, null: false
      t.string :opportunity_code, null: false
      t.integer :total_agents
      t.integer :surface_per_agent

      t.timestamps
    end

    add_index :projects, :h3
    add_index :projects, :opportunity_code

    add_foreign_key :projects, :cells, column: :h3, primary_key: :h3
    add_foreign_key :projects, :opportunities, column: :opportunity_code, primary_key: :opportunity_code
  end
end
