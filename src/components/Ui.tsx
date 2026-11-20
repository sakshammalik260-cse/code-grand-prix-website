import { useId, type ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

type StatusTone = 'accent' | 'live' | 'caution' | 'neutral' | 'critical'
type HeadingLevel = 'h1' | 'h2' | 'h3'

export function TelemetryLabel({ children }: { children: ReactNode }) {
  return <span className="telemetry-label">{children}</span>
}

export function StatusIndicator({ children, tone = 'accent' }: { children: ReactNode; tone?: StatusTone }) {
  return <span className="status-indicator" data-tone={tone}>{children}</span>
}

export function SectionHeading({ eyebrow, title, description, level = 'h2', align = 'start', className = '', headingId }: { eyebrow: string; title: ReactNode; description?: ReactNode; level?: HeadingLevel; align?: 'start' | 'center'; className?: string; headingId?: string }) {
  const Heading = level
  return <div className={`section-heading ${className}`.trim()} data-align={align}>
    <TelemetryLabel>{eyebrow}</TelemetryLabel>
    <Heading id={headingId}>{title}</Heading>
    {description && <p>{description}</p>}
  </div>
}

export function LoadingState({ label, detail }: { label: string; detail?: string }) {
  return <div className="arena-load-screen race-loading race-panel" role="status" aria-live="polite">
    <LoaderCircle size={28} aria-hidden="true" />
    <div><strong>{label}</strong>{detail && <span>{detail}</span>}</div>
  </div>
}

export function StatePanel({ eyebrow, title, description, icon, action, tone = 'neutral', className = '' }: { eyebrow: string; title: ReactNode; description: ReactNode; icon?: ReactNode; action?: ReactNode; tone?: 'neutral' | 'critical'; className?: string }) {
  const headingId = useId()
  return <section className={`race-state race-panel ${className}`.trim()} data-tone={tone} aria-labelledby={headingId} role={tone === 'critical' ? 'alert' : undefined}>
    {icon && <span className="race-state-icon" aria-hidden="true">{icon}</span>}
    <SectionHeading eyebrow={eyebrow} title={title} description={description} level="h1" align="center" className="race-state-heading" headingId={headingId} />
    {action && <div className="race-state-actions">{action}</div>}
  </section>
}
