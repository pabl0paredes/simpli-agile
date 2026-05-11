module Scenarios
  class CopyParentAccessibilities
    def self.call!(scenario:)
      new(scenario:).call!
    end

    def initialize(scenario:)
      @scenario = scenario
    end

    def call!
      return unless @scenario.parent_id

      conn = ActiveRecord::Base.connection.raw_connection

      # Find the closest ancestor that has accessibility records and copy them.
      # Uses a recursive CTE to walk up the parent chain and pick the nearest
      # ancestor that actually has records for each (h3, travel_mode_id,
      # opportunity_code, accessibility_type) combination.
      sql = <<~SQL
        INSERT INTO accessibilities (h3, travel_mode_id, opportunity_code, scenario_id, accessibility_type, value)
        WITH RECURSIVE chain AS (
          SELECT s.id, s.parent_id, 1 AS depth
          FROM scenarios s
          WHERE s.id = $1
          UNION ALL
          SELECT s.id, s.parent_id, c.depth + 1
          FROM scenarios s
          JOIN chain c ON s.id = c.parent_id
          WHERE c.depth < 30
        ),
        ranked AS (
          SELECT
            a.h3,
            a.travel_mode_id,
            a.opportunity_code,
            a.accessibility_type,
            a.value,
            c.depth,
            ROW_NUMBER() OVER (
              PARTITION BY a.h3, a.travel_mode_id, a.opportunity_code, a.accessibility_type
              ORDER BY c.depth ASC
            ) AS rn
          FROM accessibilities a
          JOIN chain c ON c.id = a.scenario_id
        )
        SELECT h3, travel_mode_id, opportunity_code, $2, accessibility_type, value
        FROM ranked
        WHERE rn = 1
        ON CONFLICT (h3, travel_mode_id, opportunity_code, scenario_id, accessibility_type) DO NOTHING;
      SQL

      conn.exec_params(sql, [@scenario.parent_id, @scenario.id])
    end
  end
end
