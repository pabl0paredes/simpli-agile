class Municipality < ApplicationRecord
  belongs_to :region, primary_key: :region_code, foreign_key: :region_code
end
