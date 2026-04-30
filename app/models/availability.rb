class Availability < ApplicationRecord
  FEATURES = %w[normative locator simulator].freeze

  belongs_to :user
  belongs_to :municipality, foreign_key: "municipality_code", primary_key: "municipality_code"

  validates :feature, inclusion: { in: FEATURES }
end
