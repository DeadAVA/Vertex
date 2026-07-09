'use client'

interface Props {
  used: number
  limit: number
  plan: 'FREE' | 'PREMIUM'
}

export function UsageBar({ used, limit, plan }: Props) {
  const pct = Math.min(100, Math.round((used / limit) * 100))
  const remaining = Math.max(0, limit - used)

  const barColor =
    pct >= 90 ? 'bg-danger'
    : pct >= 70 ? 'bg-warning'
    : plan === 'PREMIUM' ? 'bg-primary'
    : 'bg-success'

  return (
    <div className="space-y-2.5">
      {/* Numbers */}
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold text-tx">{used}</span>
          <span className="text-tx-muted text-sm ml-1">/ {limit} consultas</span>
        </div>
        <div className="text-right">
          <div className={`text-sm font-semibold ${remaining === 0 ? 'text-danger' : 'text-success'}`}>
            {remaining === 0 ? 'Sin consultas' : `${remaining} disponibles`}
          </div>
          <div className="text-xs text-tx-subtle">{pct}% usado</div>
        </div>
      </div>

      {/* Bar */}
      <div className="w-full h-3 bg-bg-elevated border border-bg-border rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Segments */}
      <div className="flex justify-between text-xs text-tx-subtle">
        <span>0</span>
        <span>{Math.round(limit * 0.25)}</span>
        <span>{Math.round(limit * 0.5)}</span>
        <span>{Math.round(limit * 0.75)}</span>
        <span>{limit}</span>
      </div>

      {/* Status message */}
      {pct >= 90 && remaining > 0 && (
        <div className="text-xs text-warning bg-warning/5 border border-warning/20 rounded-lg px-3 py-2">
          Casi sin consultas. Restablece a medianoche UTC.
        </div>
      )}
      {remaining === 0 && (
        <div className="text-xs text-danger bg-danger/5 border border-danger/20 rounded-lg px-3 py-2">
          Límite diario alcanzado. Vuelve mañana o actualiza tu plan.
        </div>
      )}
    </div>
  )
}
