class TravelMode < ApplicationRecord
  belongs_to :municipality, foreign_key: "municipality_code", primary_key: "municipality_code"
  has_many :accessibilities
end
