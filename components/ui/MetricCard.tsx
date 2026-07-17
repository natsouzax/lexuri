interface Props {
  label: string
  value: number | string
}

export default function MetricCard({ label, value }: Props) {
  return (
    <div className="metric-card">
      <div className="metric-value">{value}</div>
      <div className="metric-label">{label}</div>
    </div>
  )
}
