# app/models/visual_mode.rb
class VisualMode < ApplicationRecord
  self.inheritance_column = :_type_disabled

  belongs_to :opportunity, foreign_key: :opportunity_code, primary_key: :opportunity_code
  belongs_to :municipality, foreign_key: :municipality_code, primary_key: :municipality_code

  has_one :bin, dependent: :destroy

  validates :mode_code, presence: true
  validates :name, presence: true
  validates :mode_code, uniqueness: { scope: [:municipality_code, :opportunity_code] }
end
