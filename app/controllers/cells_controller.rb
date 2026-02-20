class CellsController < ApplicationController
  # GET /cells/thematic?municipality_code=13101&opportunity_code=C&metric=surface
  def thematic
    mun_code    = params.require(:municipality_code).to_i
    scenario_id = params.require(:scenario_id).to_i
    opp_code    = params.require(:opportunity_code).to_s
    metric      = params.require(:metric).to_s

    metric_col =
      case metric
      when "surface" then "surface_total"
      when "units"   then "units_total"
      else
        return render json: { error: "metric debe ser 'surface' o 'units'" }, status: :unprocessable_entity
      end

    info_col =
      case metric
      when "surface" then "surface"
      when "units"   then "units"
      end

    conn = ActiveRecord::Base.connection.raw_connection

    sql = <<~SQL
      WITH RECURSIVE chain AS (
        SELECT s.id, s.parent_id, s.status, 0 AS depth
        FROM scenarios s
        WHERE s.id = $1

        UNION ALL

        SELECT p.id, p.parent_id, p.status, c.depth + 1
        FROM scenarios p
        JOIN chain c ON p.id = c.parent_id
        WHERE c.depth < 20
      ),
      best_sc AS (
        SELECT DISTINCT ON (sc.h3)
          sc.h3,
          sc.#{metric_col} AS value
        FROM chain c
        JOIN scenario_cells sc
          ON sc.scenario_id = c.id
        AND sc.opportunity_code = $2
        ORDER BY sc.h3, c.depth ASC
      )
      SELECT
        cells.h3,
        cells.show_id,
        ST_AsGeoJSON(cells.geometry) AS geom_json,
        COALESCE(best_sc.value, ic.#{info_col}, 0) AS value
      FROM cells
      LEFT JOIN best_sc
        ON best_sc.h3 = cells.h3
      LEFT JOIN info_cells ic
        ON ic.h3 = cells.h3
      AND ic.opportunity_code = $2
      WHERE cells.municipality_code = $3;
    SQL

    result = conn.exec_params(sql, [scenario_id, opp_code, mun_code])

    values_for_breaks = []
    rows = []

    result.each do |r|
      v = r["value"].to_f
      values_for_breaks << v if v > 0
      rows << r
    end

    breaks = values_for_breaks.empty? ? [0, 0, 0, 0, 0, 0] : jenks_breaks(values_for_breaks, 5)

    features = rows.map do |r|
      v = r["value"].to_f
      klass =
        if v <= 0 || breaks.uniq.length <= 1
          0
        else
          jenks_class(v, breaks)
        end

      {
        type: "Feature",
        geometry: JSON.parse(r["geom_json"]),
        properties: {
          h3: r["h3"],
          show_id: r["show_id"],
          value: v,
          class: klass,
          municipality_code: mun_code,
          opportunity_code: opp_code,
          scenario_id: scenario_id,
          metric: metric
        }
      }
    end

    render json: { type: "FeatureCollection", features: features, breaks: breaks }
  end



  def accessibility
    mun_code     = params.require(:municipality_code).to_i
    mode         = params.require(:mode).to_s
    opp_code     = params.require(:opportunity_code).to_s
    scenario_id  = params.require(:scenario_id).to_i
    acc_type     = params[:accessibility_type].presence || "surface"

    unless %w[walk car].include?(mode)
      return render json: { error: "mode debe ser 'walk' o 'car'" }, status: :unprocessable_entity
    end

    unless %w[surface units].include?(acc_type)
      return render json: { error: "accessibility_type debe ser 'surface' o 'units'" }, status: :unprocessable_entity
    end

    travel_mode = TravelMode.find_by!(municipality_code: mun_code, mode: mode)

    conn = ActiveRecord::Base.connection.raw_connection

    pick_sql = <<~SQL
      WITH RECURSIVE chain AS (
        SELECT s.id, s.parent_id, 0 AS depth
        FROM scenarios s
        WHERE s.id = $1

        UNION ALL

        SELECT p.id, p.parent_id, c.depth + 1
        FROM scenarios p
        JOIN chain c ON p.id = c.parent_id
        WHERE c.depth < 20
      )
      SELECT c.id
      FROM chain c
      WHERE EXISTS (
        SELECT 1
        FROM accessibilities a
        WHERE a.scenario_id = c.id
          AND a.travel_mode_id = $2
          AND a.opportunity_code = $3
          AND a.accessibility_type = $4
      )
      ORDER BY c.depth ASC
      LIMIT 1;
    SQL

    picked = conn.exec_params(pick_sql, [scenario_id, travel_mode.id, opp_code, acc_type]).first
    effective_scenario_id = picked && picked["id"].to_i

    rows =
      if effective_scenario_id
        Cell
          .where(municipality_code: mun_code)
          .joins(<<~SQL)
            LEFT JOIN accessibilities
              ON accessibilities.h3 = cells.h3
            AND accessibilities.travel_mode_id = #{travel_mode.id}
            AND accessibilities.scenario_id = #{effective_scenario_id}
            AND accessibilities.opportunity_code = #{ActiveRecord::Base.connection.quote(opp_code)}
            AND accessibilities.accessibility_type = #{ActiveRecord::Base.connection.quote(acc_type)}
          SQL
          .select("cells.h3, cells.show_id, ST_AsGeoJSON(cells.geometry) AS geom_json, COALESCE(accessibilities.value, 0) AS value")
      else
        Cell
          .where(municipality_code: mun_code)
          .select("cells.h3, cells.show_id, ST_AsGeoJSON(cells.geometry) AS geom_json, 0 AS value")
      end

    values_for_breaks = rows.map { |r| r.attributes["value"].to_f }.select { |v| v > 0 }
    breaks = values_for_breaks.empty? ? [0, 0, 0, 0, 0, 0] : jenks_breaks(values_for_breaks, 5)

    features = rows.map do |r|
      v = r.attributes["value"].to_f
      klass = (v <= 0 || breaks.uniq.length <= 1) ? 0 : jenks_class(v, breaks)

      {
        type: "Feature",
        geometry: JSON.parse(r.attributes["geom_json"]),
        properties: {
          h3: r.h3,
          show_id: r.show_id,
          value: v,
          class: klass,
          municipality_code: mun_code,
          mode: mode,
          opportunity_code: opp_code,
          scenario_id: scenario_id,
          effective_scenario_id: effective_scenario_id,
          accessibility_type: acc_type
        }
      }
    end

    render json: { type: "FeatureCollection", features: features, breaks: breaks }
  end




  private

  # -------- Jenks (Natural Breaks) sin gem --------
  # Devuelve array de k+1 breaks: [min, b1, b2, ..., max]
  def jenks_breaks(data, k)
    data = data.compact.map(&:to_f).sort
    n = data.length
    k = [[k, 1].max, n].min

    # matrices
    mat1 = Array.new(n + 1) { Array.new(k + 1, 0) }
    mat2 = Array.new(n + 1) { Array.new(k + 1, 0.0) }

    (1..k).each do |j|
      mat1[0][j] = 1
      mat2[0][j] = 0.0
      (1..n).each { |i| mat2[i][j] = Float::INFINITY }
    end

    v = 0.0

    (1..n).each do |l|
      s1 = s2 = w = 0.0
      (1..l).each do |m|
        i3 = l - m + 1
        val = data[i3 - 1]
        s2 += val * val
        s1 += val
        w += 1
        v = s2 - (s1 * s1) / w
        i4 = i3 - 1
        next if i4 < 0

        (2..k).each do |j|
          if mat2[l][j] >= (v + mat2[i4][j - 1])
            mat1[l][j] = i3
            mat2[l][j] = v + mat2[i4][j - 1]
          end
        end
      end
      mat1[l][1] = 1
      mat2[l][1] = v
    end

    breaks = Array.new(k + 1, 0.0)
    breaks[k] = data[-1]
    count = k
    idx = n

    while count > 1
      id = mat1[idx][count] - 1
      breaks[count - 1] = data[id]
      idx = mat1[idx][count] - 1
      count -= 1
    end

    breaks[0] = data[0]
    breaks
  end

  # Devuelve 1..5 según breaks [min,b1,b2,b3,b4,max]
  def jenks_class(value, breaks)
    # incluye el max en la última clase
    (1...(breaks.length)).each do |i|
      return i if value <= breaks[i]
    end
    breaks.length - 1
  end
end
