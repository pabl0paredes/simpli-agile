export const PALETTES = {
  blue: {
    0: "#e5e7eb",
    1: "#A8DBFC",
    2: "#7CB6DA",
    3: "#5A93B3",
    4: "#3E748F",
    5: "#233141"
  },
  verde: {
    0: "#e5e7eb",
    1: "#B2EDD4",
    2: "#7DCAAA",
    3: "#4EA880",
    4: "#2E7D5E",
    5: "#1A5040"
  }
}

export function fillColorExpr(palette) {
  const p = PALETTES[palette] || PALETTES.blue
  return [
    "match",
    ["get", "class"],
    1, p[1],
    2, p[2],
    3, p[3],
    4, p[4],
    5, p[5],
    "#f3f4f6"
  ]
}
