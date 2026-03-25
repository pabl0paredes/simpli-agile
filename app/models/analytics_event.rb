class AnalyticsEvent < ApplicationRecord
  belongs_to :user, optional: true

  validates :event_name, presence: true
  validates :session_id, presence: true
end
