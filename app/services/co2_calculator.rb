class Co2Calculator
  H_OPPS         = %w[HC HD P].freeze
  OR_PER_HOUSE   = 5
  DIST_THRESHOLD = 800.0   # metres — only car trips longer than this count
  WORKING_DAYS   = 250
  CO2_G_PER_KM   = 244
  ITERATIONS     = 10

  # Class-level cache keyed by municipality_code.
  # Stores { h3s:, n:, F:, long_is:, long_js:, long_fs:, long_ds: } after first load.
  @@dist_cache = {}

  def initialize(municipality_code:, scenario_id:)
    @mun_code    = municipality_code.to_i
    @scenario_id = scenario_id.to_i
  end

  def call
    cache = load_distance_cache(@mun_code)
    return nil unless cache

    h3s     = cache[:h3s]
    n       = cache[:n]
    f       = cache[:F]
    long_is = cache[:long_is]
    long_js = cache[:long_js]
    long_fs = cache[:long_fs]
    long_ds = cache[:long_ds]

    h3_idx = h3s.each_with_index.to_h

    o = Array.new(n, 0.0)
    d = Array.new(n, 0.0)

    fetch_cell_data.each do |row|
      idx = h3_idx[row["h3"]]
      next unless idx
      o[idx] = row["h_units"].to_f * OR_PER_HOUSE
      d[idx] = row["non_h_surface"].to_f
    end

    sum_o = o.sum
    sum_d = d.sum
    return 0.0 if sum_o == 0 || sum_d == 0

    # Scale destinations so Σ D == Σ O
    scale = sum_o / sum_d
    d.map! { |v| v * scale }

    # Furness doubly-constrained gravity model
    a = Array.new(n, 1.0)
    b = Array.new(n, 1.0)

    ITERATIONS.times do
      bd = Array.new(n) { |j| b[j] * d[j] }
      n.times do |i|
        s    = 0.0
        base = i * n
        n.times { |j| s += f[base + j] * bd[j] }
        a[i] = s > 0 ? 1.0 / s : 0.0
      end

      ao = Array.new(n) { |i| a[i] * o[i] }
      n.times do |j|
        s = 0.0
        n.times { |i| s += f[i * n + j] * ao[i] }
        b[j] = s > 0 ? 1.0 / s : 0.0
      end
    end

    total_trip_metres = 0.0
    long_is.size.times do |k|
      i = long_is[k]
      j = long_js[k]
      total_trip_metres += a[i] * o[i] * b[j] * d[j] * long_fs[k] * long_ds[k]
    end

    kms_year = (total_trip_metres / 1_000.0) * WORKING_DAYS
    co2_tons = kms_year * CO2_G_PER_KM / 1_000_000.0
    co2_tons
  end

  private

  def load_distance_cache(mun_code)
    return @@dist_cache[mun_code] if @@dist_cache.key?(mun_code)

    rows = fetch_distance_rows(mun_code)
    if rows.empty?
      Rails.logger.warn("Co2Calculator: no travel_times distances for municipality #{mun_code}")
      @@dist_cache[mun_code] = nil
      return nil
    end

    # Collect ordered h3 list from union of all origins and destinations
    h3_set = Set.new
    rows.each { |r| h3_set << r["h3_origin"] << r["h3_destiny"] }
    h3s = h3_set.sort
    n   = h3s.size
    h3_idx = h3s.each_with_index.to_h

    # Build flat distance matrix (default 0 for missing pairs)
    dist = Array.new(n * n, 0.0)
    rows.each do |r|
      i = h3_idx[r["h3_origin"]]
      j = h3_idx[r["h3_destiny"]]
      dist[i * n + j] = r["distance"].to_f if i && j
    end

    positive = dist.select { |v| v > 0 }
    if positive.empty?
      @@dist_cache[mun_code] = nil
      return nil
    end
    phi = 1.0 / (positive.sum / positive.size)

    f       = Array.new(n * n, 0.0)
    long_is = []
    long_js = []
    long_fs = []
    long_ds = []

    n.times do |i|
      n.times do |j|
        d_val = dist[i * n + j]
        f_val = Math.exp(-phi * d_val)
        f[i * n + j] = f_val
        if d_val > DIST_THRESHOLD
          long_is << i
          long_js << j
          long_fs << f_val
          long_ds << d_val
        end
      end
    end

    @@dist_cache[mun_code] = { h3s: h3s, n: n, F: f, long_is: long_is, long_js: long_js, long_fs: long_fs, long_ds: long_ds }
  end

  def fetch_distance_rows(mun_code)
    sql = <<~SQL
      SELECT tt.h3_origin, tt.h3_destiny, tt.distance
      FROM travel_times tt
      JOIN cells c ON c.h3 = tt.h3_origin
      WHERE tt.travel_mode_id = 2
        AND c.municipality_code = $1
        AND tt.distance IS NOT NULL
    SQL
    conn = ActiveRecord::Base.connection.raw_connection
    conn.exec_params(sql, [mun_code]).to_a
  end

  def fetch_cell_data
    sql = <<~SQL
      WITH RECURSIVE scenario_chain AS (
        SELECT id, parent_id FROM scenarios WHERE id = $1
        UNION ALL
        SELECT s.id, s.parent_id FROM scenarios s JOIN scenario_chain sc ON s.id = sc.parent_id
      ),
      scenario_overrides AS (
        SELECT DISTINCT ON (h3, opportunity_code)
          h3, opportunity_code, units_total, surface_total
        FROM scenario_cells
        WHERE scenario_id IN (SELECT id FROM scenario_chain)
        ORDER BY h3, opportunity_code, scenario_id DESC
      ),
      cell_data AS (
        SELECT
          ic.h3,
          ic.opportunity_code,
          COALESCE(so.units_total,   ic.units)   AS units,
          COALESCE(so.surface_total, ic.surface) AS surface
        FROM info_cells ic
        JOIN cells c ON ic.h3 = c.h3
        LEFT JOIN scenario_overrides so
          ON so.h3 = ic.h3 AND so.opportunity_code = ic.opportunity_code
        WHERE c.municipality_code = $2
      )
      SELECT
        h3,
        SUM(CASE WHEN opportunity_code IN ('HC','HD','P') THEN units   ELSE 0 END) AS h_units,
        SUM(CASE WHEN opportunity_code NOT IN ('HC','HD','P') THEN surface ELSE 0 END) AS non_h_surface
      FROM cell_data
      GROUP BY h3
    SQL
    conn = ActiveRecord::Base.connection.raw_connection
    conn.exec_params(sql, [@scenario_id, @mun_code]).to_a
  end
end
