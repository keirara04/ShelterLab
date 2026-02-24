//Stats component to display user stats like listings count, LabCred, reviews count, and rating

const RING_RADIUS = 18
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS // ≈ 113.1

function getRingColor(score) {
  if (score >= 50) return '#a78bfa' // purple — Power User
  if (score >= 25) return '#34d399' // green — Very Trusted
  if (score >= 10) return '#60a5fa' // blue — Trusted
  return '#6b7280'                  // gray — New User
}

function LabCredRing({ score }) {
  const progress = Math.min(score / 100, 1)
  const offset = RING_CIRCUMFERENCE * (1 - progress)
  const color = getRingColor(score)
  const isMax = score >= 100

  return (
    <div className={`relative mb-3 rounded-full ${isMax ? 'avatar-glow' : ''}`} style={{ width: 52, height: 52 }}>
      {/* Background ring */}
      <svg width="52" height="52" className="absolute inset-0 -rotate-90" viewBox="0 0 52 52">
        <circle
          cx="26" cy="26" r={RING_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="3.5"
        />
        <circle
          cx="26" cy="26" r={RING_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.4s ease' }}
        />
      </svg>
      {/* Icon inside ring */}
      <div
        className="absolute inset-0 flex items-center justify-center rounded-full"
        style={{ background: 'transparent' }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
        </svg>
      </div>
    </div>
  )
}

export function Stats({ listingsCount = 0, trustScore = 0, reviewsCount = 0, rating = null, loading = false, onLabCredClick }) {
  const numericRating = rating ? parseFloat(rating) : null
  const hasHighRating = reviewsCount >= 3 && numericRating !== null && numericRating >= 4.0

  const stats = [
    {
      label: 'Listings',
      value: loading ? '—' : listingsCount,
      color: 'text-blue-400',
      bg: 'rgba(96,165,250,0.1)',
      border: 'rgba(96,165,250,0.15)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M16.5 9.4 7.55 4.24" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" y1="22" x2="12" y2="12" />
        </svg>
      ),
    },
    {
      label: 'LabCred',
      value: loading ? '—' : trustScore,
      color: 'text-purple-400',
      bg: 'rgba(192,132,252,0.1)',
      border: 'rgba(192,132,252,0.15)',
      clickable: true,
      isLabCred: true,
    },
    {
      label: 'Reviews',
      value: loading ? '—' : reviewsCount,
      color: 'text-pink-400',
      bg: 'rgba(244,114,182,0.1)',
      border: 'rgba(244,114,182,0.15)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    {
      label: 'Rating',
      value: loading ? '—' : (rating ?? '—'),
      color: 'text-yellow-400',
      bg: 'rgba(250,204,21,0.1)',
      border: 'rgba(250,204,21,0.15)',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ),
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => {
        const isClickable = stat.clickable && onLabCredClick
        const Wrapper = isClickable ? 'button' : 'div'
        return (
          <Wrapper
            key={stat.label}
            onClick={isClickable ? onLabCredClick : undefined}
            className={`flex flex-col items-center justify-center rounded-2xl p-3 text-center transition-all duration-200 hover:scale-[1.02] ${isClickable ? 'cursor-pointer hover:border-purple-500/40 w-full' : ''}`}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* Icon / Ring */}
            {stat.isLabCred ? (
              <LabCredRing score={loading ? 0 : trustScore} />
            ) : (
              <div
                className={`mb-2.5 rounded-full p-2 ${stat.color}`}
                style={{ background: stat.bg, border: `1px solid ${stat.border}` }}
              >
                {stat.icon}
              </div>
            )}

            <span className="text-xl font-black text-white leading-none">{stat.value}</span>

            <span className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1">
              {stat.label}
              {isClickable && (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3 text-purple-400/60">
                  <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
                </svg>
              )}
            </span>

            {/* High Rating badge — only on Rating card */}
            {stat.label === 'Rating' && hasHighRating && (
              <span
                className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                High Rating
              </span>
            )}
          </Wrapper>
        )
      })}
    </div>
  )
}
