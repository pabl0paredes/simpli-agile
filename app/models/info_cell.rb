class InfoCell < ApplicationRecord
  belongs_to :municipality, foreign_key: "municipality_code", primary_key: "municipality_code"
  belongs_to :cell, foreign_key: "h3", primary_key: "h3"
  belongs_to :opportunity, foreign_key: "opportunity_code", primary_key: "opportunity_code"
end
