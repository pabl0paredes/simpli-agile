class CreateScenarioCells < ActiveRecord::Migration[7.1]
  def change
    create_table :scenario_cells do |t|
      t.references :cell, null: false, foreign_key: true
      t.references :base_scenario, null: false, foreign_key: { to_table: :scenarios }
      t.integer :n_C_delta
      t.integer :n_I_delta
      t.integer :n_O_delta
      t.integer :n_S_delta
      t.integer :n_E_delta
      t.integer :n_HG_delta
      t.integer :n_HM_delta
      t.integer :n_HP_delta
      t.integer :n_HD_delta
      t.integer :m_C_delta
      t.integer :m_I_delta
      t.integer :m_O_delta
      t.integer :m_S_delta
      t.integer :m_E_delta
      t.integer :m_HG_delta
      t.integer :m_HM_delta
      t.integer :m_HP_delta
      t.integer :m_HD_delta
      t.float :acc_C_delta
      t.float :acc_I_delta
      t.float :acc_O_delta
      t.float :acc_S_delta
      t.float :acc_E_delta
      t.float :acc_HG_delta
      t.float :acc_HM_delta
      t.float :acc_HP_delta
      t.float :acc_HD_delta

      t.timestamps
    end
  end
end
