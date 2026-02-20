class Scenario < ApplicationRecord
  belongs_to :user
  belongs_to :municipality, foreign_key: "municipality_code", primary_key: "municipality_code"

  has_many :projects, dependent: :destroy
end
