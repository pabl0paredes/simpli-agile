class CellsController < ApplicationController
  # GET /cells/thematic?municipality_code=13101&opportunity_code=C&metric=surface
  def thematic
    mun_code = params.require(:municipality_code).to_i
    opp_code = params.require(:opportunity_code).to_s
    metric   = params.require(:metric).to_s

    unless %w[surface units].include?(metric)
      return render json: { error: "metric debe ser 'surface' o 'units'" }, status: :unprocessable_entity
    end

    # Traer celdas + valor (solo las que tienen info para esa oportunidad)
    rows = Cell
      .where(municipality_code: mun_code)
      .joins(<<~SQL)
        LEFT JOIN info_cells
          ON info_cells.h3 = cells.h3
        AND info_cells.opportunity_code = #{ActiveRecord::Base.connection.quote(opp_code)}
      SQL
      .select(
        "cells.h3, cells.geometry, COALESCE(info_cells.#{metric}, 0) AS value"
      )

    values = rows.map { |r| r.attributes["value"].to_i }.reject { |v| v.nil? }

    if values.empty?
      return render json: { type: "FeatureCollection", features: [], breaks: [] }
    end

    values_for_breaks = rows.map { |r| r.attributes["value"].to_i }.select { |v| v > 0 }

    breaks =
      if values_for_breaks.empty?
        [0, 0, 0, 0, 0, 0] # o [] si prefieres
      else
        jenks_breaks(values_for_breaks, 5)
      end


    features = rows.map do |r|
      v = r.attributes["value"].to_i
      klass =
        if v <= 0 || breaks.uniq.length <= 1
          0
        else
          jenks_class(v, breaks) # 1..5
        end

      {
        type: "Feature",
        geometry: RGeo::GeoJSON.encode(r.geometry),
        properties: {
          h3: r.h3,
          value: v,
          class: klass,
          municipality_code: mun_code,
          opportunity_code: opp_code
        }
      }
    end


    render json: {
      type: "FeatureCollection",
      features: features,
      breaks: breaks
    }
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
