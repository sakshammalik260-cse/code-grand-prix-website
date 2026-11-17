import { lazy,Suspense } from 'react'
const DriverStandings=lazy(()=>import('../components/results/DriverStandings').then(m=>({default:m.DriverStandings})))
import { Link } from 'react-router-dom'
import { ArrowLeft, Flag } from 'lucide-react'
import { PageHeading } from '../components/Ui'

export function ResultsPage() { return <Suspense fallback={<div className="arena-load-screen" role="status">Loading driver standings...</div>}><DriverStandings/></Suspense> }
export function NotFoundPage() { return <div className="container flow-page"><section className="panel placeholder-panel"><Flag size={40} /><PageHeading eyebrow="404 / OFF THE CIRCUIT" title="A wrong turn." description="This page isn’t on the race map. Let’s get you back to the starting grid." /><Link className="button button-primary" to="/">BACK TO THE GRID <ArrowLeft size={17} /></Link></section></div> }
