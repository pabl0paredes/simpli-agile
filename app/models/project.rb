class Project < ApplicationRecord
  belongs_to :scenario
  belongs_to :cell
  belongs_to :use
end
