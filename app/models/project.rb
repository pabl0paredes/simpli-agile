class Project < ApplicationRecord
  belongs_to :scenario
  belongs_to :cell, foreign_key: "h3", primary_key: "h3"
  belongs_to :opportunity, foreign_key: "opportunity_code", primary_key: "opportunity_code"

  validates :h3, presence: true
  validates :opportunity_code, presence: true
  validates :total_agents, numericality: { greater_than: 0 }
  validates :surface_per_agent, numericality: { greater_than_or_equal_to: 0 }
end
