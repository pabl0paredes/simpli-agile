module Scenarios
  class PublishAndRecalculate
    class NotDraftError < StandardError; end

    def self.call!(scenario:, name:)
      new(scenario:, name:).call!
    end

    def initialize(scenario:, name:)
      @scenario = scenario
      @name = name
    end

    def call!
      raise NotDraftError, "El escenario no está en draft." unless @scenario.status == "draft"

      Scenario.transaction do
        parent_id = @scenario.parent_id

        parent_map = build_parent_map(parent_id)

        deltas = build_deltas_from_projects(@scenario.id) # 👈 importante: aquí defines "deltas"

        deltas.each do |d|
          key = [d[:h3], d[:opportunity_code]]

          base_units, base_surface =
            if parent_id.present?
              parent_map.fetch(key, [0, 0])
            else
              ic = InfoCell.find_by(h3: d[:h3], opportunity_code: d[:opportunity_code])
              [ic&.units.to_i, ic&.surface.to_d]
            end

          ScenarioCell.upsert(
            {
              scenario_id: @scenario.id,
              h3: d[:h3],
              opportunity_code: d[:opportunity_code],
              units_delta: d[:units_delta],
              surface_delta: d[:surface_delta],
              units_total: base_units + d[:units_delta],
              surface_total: base_surface + d[:surface_delta]
            },
            unique_by: :idx_scenario_cells_unique
          )
        end

         # 1) publicas el escenario (ya no draft)
        @scenario.update!(name: @name, status: "published")

        # 2) recalculas SOLO las oportunidades que existen en projects de este draft
        opp_codes = Project.where(scenario_id: @scenario.id).distinct.pluck(:opportunity_code)
        opp_codes.each do |opp|
          recalc_accessibilities_surface!(scenario: @scenario, opportunity_code: opp)
        end
      end

      @scenario
    end

    private

    def build_parent_map(parent_id)
      map = {}
      return map unless parent_id.present?

      ScenarioCell.where(scenario_id: parent_id).find_each do |sc|
        map[[sc.h3, sc.opportunity_code]] = [sc.units_total, sc.surface_total]
      end
      map
    end

    # Esto lo puedes hacer con ActiveRecord (simple) o con SQL (más rápido).
    def build_deltas_from_projects(scenario_id)
      # EJEMPLO (ajusta nombres según tu schema):
      # units_delta = SUM(total_agents)
      # surface_delta = SUM(total_agents * surface_per_agent)
      Project
        .where(scenario_id:)
        .group(:h3, :opportunity_code)
        .pluck(
          :h3,
          :opportunity_code,
          Arel.sql("SUM(total_agents)"),
          Arel.sql("SUM(total_agents * surface_per_agent)")
        )
        .map do |h3, opp, units_delta, surface_delta|
          {
            h3: h3,
            opportunity_code: opp,
            units_delta: units_delta.to_i,
            surface_delta: surface_delta.to_d
          }
        end
    end


    def recalc_accessibilities_surface!(scenario:, opportunity_code:)
      conn = ActiveRecord::Base.connection

      scenario_id = scenario.id
      mun_code    = scenario.municipality_code

      # Travel modes (en tu modelo ya existen param_1, etc.)
      travel_modes = TravelMode.where(municipality_code: mun_code, mode: %w[walk car]).pluck(:id).map(&:to_i)

      travel_modes.each do |tm_id|
        # 1) limpiar lo existente para no duplicar
        Accessibility.where(
          scenario_id: scenario_id,
          travel_mode_id: tm_id,
          opportunity_code: opportunity_code,
          accessibility_type: "surface"
        ).delete_all

        # 2) insertar recalculado (binds)
        sql = <<~SQL
          INSERT INTO accessibilities (
            h3, travel_mode_id, opportunity_code, scenario_id, accessibility_type, value
          )
          SELECT
            o.h3,
            tm.id,
            $1,
            s.id,
            'surface',
            SUM(
              COALESCE(sc.surface_total, ic.surface, 0) * EXP(tm.param_1 * tt.travel_time)
            ) AS value
          FROM scenarios s
          JOIN cells o
            ON o.municipality_code = s.municipality_code
          JOIN travel_modes tm
            ON tm.municipality_code = s.municipality_code
          AND tm.id = $2
          JOIN travel_times tt
            ON tt.h3_origin = o.h3
          AND tt.travel_mode_id = tm.id
          JOIN cells d
            ON d.h3 = tt.h3_destiny
          LEFT JOIN scenario_cells sc
            ON sc.scenario_id = s.id
          AND sc.h3 = d.h3
          AND sc.opportunity_code = $1
          LEFT JOIN info_cells ic
            ON ic.h3 = d.h3
          AND ic.opportunity_code = $1
          WHERE s.id = $3
            AND s.municipality_code = $4
            AND d.municipality_code = $4
          GROUP BY o.h3, tm.id, s.id;
        SQL

        conn.raw_connection.exec_params(
          sql,
          [opportunity_code, tm_id, scenario_id, mun_code]
        )
      end
    end

  end
end
