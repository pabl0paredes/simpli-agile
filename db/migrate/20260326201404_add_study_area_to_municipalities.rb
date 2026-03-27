class AddStudyAreaToMunicipalities < ActiveRecord::Migration[7.1]
  def change
    add_column :municipalities, :study_area, :geometry, spatial_type: :line_string, srid: 4326, null: true
    add_index :municipalities, :study_area, using: :gist
  end
end
