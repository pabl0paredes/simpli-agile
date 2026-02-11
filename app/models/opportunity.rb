class Opportunity < ApplicationRecord
  self.primary_key = "opportunity_code"

  belongs_to :municipality,
    foreign_key: "municipality_code",
    primary_key: "municipality_code"

  has_many :info_cells, foreign_key: "opportunity_code", primary_key: "opportunity_code"
end
