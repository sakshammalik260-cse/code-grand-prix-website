import { event } from '../data/event'
import { useCountdown } from '../hooks/useCountdown'

interface CountdownProps { compact?: boolean; hoursOnly?: boolean; target?: string }
export function Countdown({ compact = false, hoursOnly = false, target }: CountdownProps) {
  const { days, hours, minutes, seconds, reached } = useCountdown(target||event.date)
  const units = hoursOnly ? { hours: days * 24 + hours, minutes, seconds } : { days, hours, minutes, seconds }
  return <div><div className={`countdown ${compact ? 'compact' : ''}`} role="timer" aria-label="Countdown to event date in India Standard Time">
    {Object.entries(units).map(([label, value]) => <div className="time-unit" key={label}><strong key={value} className="countdown-digit">{String(value).padStart(2, '0')}</strong><span>{label}</span></div>)}
  </div>{reached && <p className="small muted mt-3">Event date reached. Race status is announced separately.</p>}</div>
}
