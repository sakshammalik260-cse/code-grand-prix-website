import { SlidersHorizontal } from 'lucide-react'
import { Link } from 'react-router-dom'

const sections = [
  ['home', 'Home'],
  ['about', 'About'],
  ['rules', 'Rules'],
  ['schedule', 'Schedule'],
  ['contact', 'Contact'],
] as const

export function HomeNavLinks({ active }: { active: string }) {
  return <>
    {sections.map(([id, label], index) => (
      <Link key={id} to={'/#' + id} aria-current={active === id ? 'location' : undefined}>
        <span className="home-nav-number" aria-hidden="true" data-number={`0${index + 1}`} />{label}
      </Link>
    ))}
    <Link to="/results"><span className="home-nav-number" aria-hidden="true" data-number="06" />Results</Link>
  </>
}

export function HomeMotionPreference({ reduced, onChange }: { reduced: boolean; onChange: (value: boolean) => void }) {
  return <details className="home-motion-preference" onKeyDown={event => {
    if (event.key !== 'Escape' || !event.currentTarget.open) return
    event.currentTarget.open = false
    event.currentTarget.querySelector('summary')?.focus()
  }}>
    <summary aria-label="Homepage preferences" title="Homepage preferences"><SlidersHorizontal size={16} aria-hidden="true" /></summary>
    <div className="home-motion-options">
      <label>
        <input type="checkbox" checked={reduced} onChange={event => onChange(event.target.checked)} />
        Reduce animation
      </label>
    </div>
  </details>
}

