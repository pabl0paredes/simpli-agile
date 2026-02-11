class TravelTime < ApplicationRecord
  belongs_to :travel_mode
  belongs_to :origin_cell, class_name: "Cell", foreign_key: "h3_origin", primary_key: "h3"
  belongs_to :destiny_cell, class_name: "Cell", foreign_key: "h3_destiny", primary_key: "h3"
end
