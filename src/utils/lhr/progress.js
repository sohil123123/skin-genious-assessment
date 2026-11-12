export function progressChart(zone) {
  const rows = (zone?.sessions || []).filter(
    (row) => typeof row.density === 'number' && Number.isFinite(row.density),
  )
  const max = Math.max(1, ...rows.map((row) => row.density * 1.15))
  const last = Math.max(2, ...rows.map((row) => row.session_number))
  const points = rows.map((row) => ({
    ...row,
    x: 52 + ((row.session_number - 1) / (last - 1)) * 590,
    y: 210 - (row.density / max) * 180,
  }))
  return {
    points,
    path: points.map((point) => `${point.x},${point.y}`).join(' '),
    ticks: Array.from({ length: 5 }, (_, i) => ({
      y: 30 + 45 * i,
      value: Math.round(max * (1 - i / 4)),
    })),
  }
}
