class Bin < ApplicationRecord
  belongs_to :visual_mode

  validate :bins_monotonic
  validate :bins_count_valid

  def edges
    [bin_0, bin_1, bin_2, bin_3, bin_4, bin_5].compact
  end

  private

  def bins_count_valid
    n = edges.length
    if n < 2
      errors.add(:base, "Debes definir al menos 2 bins (para formar al menos 1 categoría).")
    end
  end

  def bins_monotonic
    arr = edges
    return if arr.length < 2

    unless arr.each_cons(2).all? { |a, b| a <= b }
      errors.add(:base, "Bins deben ser no-decrecientes (bin_0 <= ... <= bin_n).")
    end
  end
end
