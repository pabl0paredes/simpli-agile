class CreateCells < ActiveRecord::Migration[7.1]
  def change
    create_table :cells do |t|
      t.references :municipality, null: false, foreign_key: true
      t.integer :n_C
      t.integer :n_I
      t.integer :n_O
      t.integer :n_S
      t.integer :n_E
      t.integer :n_HG
      t.integer :n_HM
      t.integer :n_HP
      t.integer :n_HD
      t.integer :m_C
      t.integer :m_I
      t.integer :m_O
      t.integer :m_S
      t.integer :m_E
      t.integer :m_HG
      t.integer :m_HM
      t.integer :m_HP
      t.integer :m_HD
      t.float :acc_C
      t.float :acc_I
      t.float :acc_O
      t.float :acc_S
      t.float :acc_E
      t.float :acc_HG
      t.float :acc_HM
      t.float :acc_HP
      t.float :acc_HD
      t.integer :show_id

      # Boundary comunal (POLYGON, geometry, SRID 4326)
      t.st_polygon :geometry, srid: 4326, null: false

      t.timestamps
    end

    add_index :cells, :geometry, using: :gist
    add_index :cells, [:municipality_id, :show_id], unique: true
  end
end
