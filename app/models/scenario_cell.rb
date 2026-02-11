class ScenarioCell < ApplicationRecord
  belongs_to :scenario, foreign_key: "base_scenario_id", primary_key: "id"
  belongs_to :cell, foreign_key: "h3", primary_key: "h3"
  belongs_to :opportunity, foreign_key: "opportunity_code", primary_key: "opportunity_code"
end
