class Accessibility < ApplicationRecord
  belongs_to :travel_mode
  belongs_to :scenario
  belongs_to :cell, foreign_key: "h3", primary_key: "h3"
  belongs_to :opportunity, foreign_key: "opportunity_code", primary_key: "opportunity_code"
end
