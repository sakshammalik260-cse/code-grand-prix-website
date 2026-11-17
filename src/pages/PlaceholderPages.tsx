import { Link } from 'react-router-dom'
import { ArrowLeft, Flag, Trophy } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge, PageHeading } from '../components/Ui'

interface PlaceholderProps { title: string; eyebrow: string; description: string; icon: LucideIcon; items: string[]; back?: string }
function Placeholder({ title, eyebrow, description, icon: Icon, items, back = '/' }: PlaceholderProps) {
  return <div className="container flow-page"><PageHeading eyebrow={eyebrow} title={title} description={description} /><section className="panel placeholder-panel"><div className="placeholder-icon"><Icon size={38} /></div><Badge tone="yellow">PHASE 1 PREVIEW</Badge><h2>This part of the circuit is taking shape.</h2><p className="muted">The route is ready. These features are planned for a later phase.</p><div className="planned-grid">{items.map((item, i) => <div key={item}><span>0{i + 1}</span><strong>{item}</strong><div className="skeleton-line" /><div className="skeleton-line short" /></div>)}</div><Link to={back} className="button button-secondary"><ArrowLeft size={16} />{back === '/lobby' ? 'Back to race lobby' : 'Back to overview'}</Link></section></div>
}
export function ResultsPage() { return <Placeholder title="The final classification." eyebrow="THE CHEQUERED FLAG" description="Official results will be available after the competition and organizer review." icon={Trophy} items={['Final standings', 'Driver performance', 'Race highlights']} /> }
export function NotFoundPage() { return <div className="container flow-page"><section className="panel placeholder-panel"><Flag size={40} /><PageHeading eyebrow="404 / OFF THE CIRCUIT" title="A wrong turn." description="This page isn’t on the race map. Let’s get you back to the starting grid." /><Link className="button button-primary" to="/">BACK TO THE GRID <ArrowLeft size={17} /></Link></section></div> }
