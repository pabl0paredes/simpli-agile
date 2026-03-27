class CellsController < ApplicationController

  def locator_status
    mun_code    = params.require(:municipality_code).to_i
    scenario_id = params.require(:scenario_id).to_i

    conn = ActiveRecord::Base.connection.raw_connection

    # Recorre la cadena de ancestros del escenario actual.
    # recalculated = true  → rojo  (accesibilidades ya calculadas).
    # recalculated = false → hatch (pendientes de recalcular).
    sql = <<~SQL
      WITH RECURSIVE chain AS (
        SELECT s.id, s.parent_id, 0 AS depth
        FROM scenarios s
        WHERE s.id = $1
        UNION ALL
        SELECT p.id, p.parent_id, c.depth + 1
        FROM scenarios p
        JOIN chain c ON p.id = c.parent_id
        WHERE c.depth < 30
      ),
      red_projects AS (
        SELECT DISTINCT pr.h3
        FROM projects pr
        JOIN chain c ON c.id = pr.scenario_id
        WHERE pr.recalculated = true
      ),
      hatch_projects AS (
        SELECT DISTINCT pr.h3
        FROM projects pr
        JOIN chain c ON c.id = pr.scenario_id
        WHERE pr.recalculated = false
      )
      SELECT
        c.h3,
        c.show_id,
        ST_AsGeoJSON(c.geometry) AS geom_json,
        (rp.h3 IS NOT NULL) AS has_parent_projects,
        (hp.h3 IS NOT NULL) AS has_draft_projects
      FROM cells c
      LEFT JOIN red_projects rp ON rp.h3 = c.h3
      LEFT JOIN hatch_projects hp ON hp.h3 = c.h3
      WHERE c.municipality_code = $2;
    SQL

    result = conn.exec_params(sql, [scenario_id, mun_code])

    # Fetch chain scenario IDs to look up project names
    chain_sql = <<~SQL
      WITH RECURSIVE chain AS (
        SELECT s.id, s.parent_id, 0 AS depth FROM scenarios s WHERE s.id = $1
        UNION ALL
        SELECT p.id, p.parent_id, c.depth + 1 FROM scenarios p JOIN chain c ON p.id = c.parent_id WHERE c.depth < 30
      )
      SELECT id FROM chain;
    SQL
    chain_ids = conn.exec_params(chain_sql, [scenario_id]).map { |r| r["id"].to_i }

    parent_by_h3 = {}
    draft_by_h3  = {}
    Project.where(scenario_id: chain_ids).select(:h3, :name, :recalculated).each do |p|
      if p.recalculated
        parent_by_h3[p.h3] ||= []
        parent_by_h3[p.h3] << p.name
      else
        draft_by_h3[p.h3] ||= []
        draft_by_h3[p.h3] << p.name
      end
    end

    bool = ActiveModel::Type::Boolean.new

    features = result.map do |r|
      h3 = r["h3"]
      {
        type: "Feature",
        geometry: JSON.parse(r["geom_json"]),
        properties: {
          h3: h3,
          show_id: r["show_id"],
          has_parent_projects: bool.cast(r["has_parent_projects"]),
          has_draft_projects: bool.cast(r["has_draft_projects"]),
          parent_project_names: parent_by_h3[h3] || [],
          draft_project_names:  draft_by_h3[h3]  || []
        }
      }
    end

    render json: { nonce: SecureRandom.hex(4), type: "FeatureCollection", features: features }
  end

  def accessibility_delta
    mun_code        = params.require(:municipality_code).to_i
    scenario_a_id   = params.require(:scenario_a_id).to_i
    scenario_b_id   = params.require(:scenario_b_id).to_i
    opportunity     = params.require(:opportunity_code).to_s
    mode            = params.require(:mode).to_s

    travel_mode = TravelMode.find_by!(municipality_code: mun_code, mode: mode)
    travel_mode_id = travel_mode.id

    conn = ActiveRecord::Base.connection.raw_connection

    sql = <<~SQL
      WITH RECURSIVE
      chain_a AS (
        SELECT s.id, s.parent_id, 0 AS depth
        FROM scenarios s WHERE s.id = $1
        UNION ALL
        SELECT p.id, p.parent_id, c.depth + 1
        FROM scenarios p
        JOIN chain_a c ON p.id = c.parent_id
        WHERE c.depth < 20
      ),
      chain_b AS (
        SELECT s.id, s.parent_id, 0 AS depth
        FROM scenarios s WHERE s.id = $2
        UNION ALL
        SELECT p.id, p.parent_id, c.depth + 1
        FROM scenarios p
        JOIN chain_b c ON p.id = c.parent_id
        WHERE c.depth < 20
      ),

      effective_a AS (
        SELECT c.id AS scenario_id
        FROM chain_a c
        WHERE EXISTS (
          SELECT 1
          FROM accessibilities a
          WHERE a.scenario_id = c.id
            AND a.travel_mode_id = $4
            AND a.opportunity_code = $5
          LIMIT 1
        )
        ORDER BY c.depth ASC
        LIMIT 1
      ),
      effective_b AS (
        SELECT c.id AS scenario_id
        FROM chain_b c
        WHERE EXISTS (
          SELECT 1
          FROM accessibilities a
          WHERE a.scenario_id = c.id
            AND a.travel_mode_id = $4
            AND a.opportunity_code = $5
          LIMIT 1
        )
        ORDER BY c.depth ASC
        LIMIT 1
      ),

      a_vals AS (
        SELECT a.h3, a.value
        FROM accessibilities a
        JOIN effective_a ea ON ea.scenario_id = a.scenario_id
        WHERE a.travel_mode_id = $4
          AND a.opportunity_code = $5
      ),
      b_vals AS (
        SELECT a.h3, a.value
        FROM accessibilities a
        JOIN effective_b eb ON eb.scenario_id = a.scenario_id
        WHERE a.travel_mode_id = $4
          AND a.opportunity_code = $5
      )

      SELECT
        c.h3,
        c.show_id,
        ST_AsGeoJSON(c.geometry) AS geom_json,
        COALESCE(b_vals.value, 0) - COALESCE(a_vals.value, 0) AS delta_value,
        (SELECT scenario_id FROM effective_a) AS effective_a_id,
        (SELECT scenario_id FROM effective_b) AS effective_b_id
      FROM cells c
      LEFT JOIN a_vals ON a_vals.h3 = c.h3
      LEFT JOIN b_vals ON b_vals.h3 = c.h3
      WHERE c.municipality_code = $3;
    SQL

    result = conn.exec_params(sql, [scenario_a_id, scenario_b_id, mun_code, travel_mode_id, opportunity])

    rows = []
    deltas = []
    eff_a = nil
    eff_b = nil

    result.each do |r|
      eff_a ||= r["effective_a_id"]&.to_i
      eff_b ||= r["effective_b_id"]&.to_i
      v = r["delta_value"].to_f
      rows << r
      deltas << v unless v == 0
    end

    uniq_count = deltas.uniq.length

    breaks =
      if uniq_count == 0
        [0.0, 0.0]
      elsif uniq_count == 1
        v = deltas.first.to_f
        v > 0 ? [0.0, v] : [v, 0.0]
      else
        k = [5, uniq_count].min
        jenks_breaks(deltas, k)
      end

    proj_by_h3 = projects_by_h3_for_scenarios(scenario_a_id, scenario_b_id, opportunity_code: opportunity)

    features = rows.map do |r|
      v = r["delta_value"].to_f
      klass =
        if v == 0
          0
        elsif uniq_count == 1
          1
        else
          jenks_class(v, breaks)
        end

      h3 = r["h3"]
      names = proj_by_h3[h3] || []

      {
        type: "Feature",
        geometry: JSON.parse(r["geom_json"]),
        properties: {
          h3: h3,
          show_id: r["show_id"],
          value: v,
          class: klass,
          municipality_code: mun_code,
          opportunity_code: opportunity,
          mode: mode,
          travel_mode_id: travel_mode_id,
          scenario_a_id: scenario_a_id,
          scenario_b_id: scenario_b_id,
          effective_a_id: eff_a,
          effective_b_id: eff_b,
          has_projects: names.any?,
          project_names: names
        }
      }
    end

    render json: {
      type: "FeatureCollection",
      features: features,
      breaks: breaks,
      effective_a_id: eff_a,
      effective_b_id: eff_b
    }
  end

  def delta
    mun_code     = params.require(:municipality_code).to_i
    scenario_a   = params.require(:scenario_a_id).to_i
    scenario_b   = params.require(:scenario_b_id).to_i
    opp_code     = params.require(:opportunity_code).to_s
    metric       = params.require(:metric).to_s

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
      WITH RECURSIVE
      chain_a AS (
        SELECT s.id, s.parent_id, 0 AS depth
        FROM scenarios s
        WHERE s.id = $1
        UNION ALL
        SELECT p.id, p.parent_id, c.depth + 1
        FROM scenarios p
        JOIN chain_a c ON p.id = c.parent_id
        WHERE c.depth < 20
      ),
      best_a AS (
        SELECT DISTINCT ON (sc.h3)
          sc.h3,
          sc.#{metric_col} AS value
        FROM chain_a c
        JOIN scenario_cells sc
          ON sc.scenario_id = c.id
        AND sc.opportunity_code = $3
        ORDER BY sc.h3, c.depth ASC
      ),
      chain_b AS (
        SELECT s.id, s.parent_id, 0 AS depth
        FROM scenarios s
        WHERE s.id = $2
        UNION ALL
        SELECT p.id, p.parent_id, c.depth + 1
        FROM scenarios p
        JOIN chain_b c ON p.id = c.parent_id
        WHERE c.depth < 20
      ),
      best_b AS (
        SELECT DISTINCT ON (sc.h3)
          sc.h3,
          sc.#{metric_col} AS value
        FROM chain_b c
        JOIN scenario_cells sc
          ON sc.scenario_id = c.id
        AND sc.opportunity_code = $3
        ORDER BY sc.h3, c.depth ASC
      )
      SELECT
        cells.h3,
        cells.show_id,
        ST_AsGeoJSON(cells.geometry) AS geom_json,
        (COALESCE(best_b.value, ic.#{info_col}, 0) - COALESCE(best_a.value, ic.#{info_col}, 0)) AS delta_value
      FROM cells
      LEFT JOIN best_a ON best_a.h3 = cells.h3
      LEFT JOIN best_b ON best_b.h3 = cells.h3
      LEFT JOIN info_cells ic
        ON ic.h3 = cells.h3
      AND ic.opportunity_code = $3
      WHERE cells.municipality_code = $4;
    SQL

    result = conn.exec_params(sql, [scenario_a, scenario_b, opp_code, mun_code])

    rows = []
    deltas = []

    result.each do |r|
      v = r["delta_value"].to_f
      rows << r
      deltas << v if v != 0
    end

    deltas_nonzero = deltas.reject { |v| v == 0 }
    uniq_count = deltas_nonzero.uniq.length
    k = [[5, uniq_count].min, 1].max

    breaks =
      if uniq_count == 0
        [0.0, 0.0]
      elsif uniq_count == 1
        v = deltas_nonzero.first.to_f
        # rango no degenerado: [0, v] si v>0; [v, 0] si v<0
        v > 0 ? [0.0, v] : [v, 0.0]
      else
        k = [5, uniq_count].min
        jenks_breaks(deltas_nonzero, k)
      end

    proj_by_h3 = projects_by_h3_for_scenarios(scenario_a, scenario_b, opportunity_code: opp_code)

    features = rows.map do |r|
      v = r["delta_value"].to_f
      klass =
        if v == 0
          0
        elsif uniq_count == 1
          1
        else
          jenks_class(v, breaks) # 1..k
        end

      h3 = r["h3"]
      names = proj_by_h3[h3] || []

      {
        type: "Feature",
        geometry: JSON.parse(r["geom_json"]),
        properties: {
          h3: h3,
          show_id: r["show_id"],
          value: v,
          class: klass,
          municipality_code: mun_code,
          opportunity_code: opp_code,
          metric: metric,
          scenario_a_id: scenario_a,
          scenario_b_id: scenario_b,
          has_projects: names.any?,
          project_names: names
        }
      }
    end

    render json: { type: "FeatureCollection", features: features, breaks: breaks }
  end

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

    visual_mode = VisualMode.find_by!(
      municipality_code: mun_code,
      opportunity_code: opp_code,
      mode_code: metric
    )

    edges = [
      visual_mode.bin&.bin_0,
      visual_mode.bin&.bin_1,
      visual_mode.bin&.bin_2,
      visual_mode.bin&.bin_3,
      visual_mode.bin&.bin_4,
      visual_mode.bin&.bin_5
    ].compact.map(&:to_f)

    puts("hola", !!edges[0])

    # fallback defensivo si no hay bins cargados
    if edges.length < 2
      edges = [0, 0, 0, 0, 0, 0]
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

    rows = []
    result.each { |r| rows << r }

    breaks = edges.dup

    # If scenario modifications pushed values beyond the pre-calculated last bin,
    # extend the last break to cover the actual data maximum so the legend stays accurate.
    if rows.any?
      actual_max = rows.map { |r| r["value"].to_f }.max
      breaks[-1] = actual_max if actual_max > breaks.last
    end

    proj_by_h3 = projects_by_h3_for_scenarios(scenario_id, opportunity_code: opp_code)

    features = rows.map do |r|
      v = r["value"].to_f
      klass =
        if v <= 0
          0
        elsif breaks.uniq.length <= 1
          1
        else
          bin_class(v, breaks)
        end

      h3 = r["h3"]
      names = proj_by_h3[h3] || []

      {
        type: "Feature",
        geometry: JSON.parse(r["geom_json"]),
        properties: {
          h3: h3,
          show_id: r["show_id"],
          value: v,
          class: klass,
          municipality_code: mun_code,
          opportunity_code: opp_code,
          scenario_id: scenario_id,
          metric: metric,
          has_projects: names.any?,
          project_names: names
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

    mode_code = "acc_#{mode}"  # ajusta si tu convención es otra

    visual_mode = VisualMode.find_by!(
      municipality_code: mun_code,
      opportunity_code: opp_code,
      mode_code: mode_code
    )

    edges = [
      visual_mode.bin&.bin_0,
      visual_mode.bin&.bin_1,
      visual_mode.bin&.bin_2,
      visual_mode.bin&.bin_3,
      visual_mode.bin&.bin_4,
      visual_mode.bin&.bin_5
    ].compact.map(&:to_f)

    # fallback defensivo si no hay bins cargados
    if edges.length < 2
      edges = [0, 0, 0, 0, 0, 0]
    end

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

    breaks = edges
    proj_by_h3 = projects_by_h3_for_scenarios(scenario_id, opportunity_code: opp_code)

    features = rows.map do |r|
      v = r.attributes["value"].to_f
      klass = bin_class(v, breaks)
      names = proj_by_h3[r.h3] || []

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
          accessibility_type: acc_type,
          has_projects: names.any?,
          project_names: names
        }
      }
    end

    render json: { type: "FeatureCollection", features: features, breaks: breaks }
  end




  private

  # Returns hash { h3 => [project_name, ...] } for the given scenario ids, filtered by opportunity_code
  def projects_by_h3_for_scenarios(*scenario_ids, opportunity_code:)
    ids = Array(scenario_ids).flatten.compact.map(&:to_i).reject(&:zero?)
    return {} if ids.empty?

    result = {}
    Project.where(scenario_id: ids, opportunity_code: opportunity_code).select(:h3, :name).each do |p|
      result[p.h3] ||= []
      result[p.h3] << p.name
    end
    result
  end

  def bin_class(value, edges)
    return 1 if edges.blank? || edges.length < 2
    v = value.to_f

    # Accesibilidad: v=0 debe ir a la clase 1
    return 1 if v <= 0

    # edges: [b0, b1, b2, ... bN]
    # clases: 1..N
    n = edges.length - 1

    (1..n).each do |k|
      lo = edges[k - 1]
      hi = edges[k]
      # intervalo [lo, hi] salvo que quieras semiabierto
      return k if v <= hi
    end

    n
  end

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
