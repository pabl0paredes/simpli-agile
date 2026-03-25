class CreateAnalyticsEvents < ActiveRecord::Migration[7.1]
  def change
    create_table :analytics_events do |t|
      t.references :user, null: true, foreign_key: true
      t.string  :session_id, null: false
      t.string  :event_name, null: false
      t.jsonb   :metadata,   null: false, default: {}

      t.datetime :created_at, null: false, default: -> { "NOW()" }
    end

    add_index :analytics_events, :event_name
    add_index :analytics_events, :session_id
    add_index :analytics_events, :created_at
  end
end
