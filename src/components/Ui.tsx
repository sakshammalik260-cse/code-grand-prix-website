import type { ReactNode } from 'react'
import { Check, ChevronRight } from 'lucide-react'
export function Badge({ children, tone = 'red' }: { children: ReactNode; tone?: 'red' | 'green' | 'yellow' | 'neutral' }) {
  return <span className={`badge badge-${tone}`}><span className="status-dot" />{children}</span>
}
export function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="page-heading"><div className="eyebrow"><span />{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>
}
export function Steps({ current }: { current: number }) {
  return <ol className="steps" aria-label="Entry progress">{['Driver login', 'Pre-race check', 'Race lobby'].map((name, index) => <li key={name} className={current === index + 1 ? 'current' : current > index + 1 ? 'done' : ''} aria-current={current === index + 1 ? 'step' : undefined}><span>{current > index + 1 ? <Check size={13} /> : `0${index + 1}`}</span>{name}{index < 2 && <ChevronRight size={14} />}</li>)}</ol>
}
