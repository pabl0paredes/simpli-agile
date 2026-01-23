class CreateProjects < ActiveRecord::Migration[7.1]
  def change
    create_table :projects do |t|
      t.references :scenario, null: false, foreign_key: true
      t.references :cell, null: false, foreign_key: true
      t.references :use, null: false, foreign_key: true
      t.integer :total_agents
      t.integer :surface_per_agent

      t.timestamps
    end
  end
end
