import { lazy,Suspense } from 'react'
const DriverStandings=lazy(()=>import('../components/results/DriverStandings').then(m=>({default:m.DriverStandings})))
import { Link } from 'react-router-dom'
import { ArrowLeft, Flag } from 'lucide-react'
import { LoadingState, StatePanel } from '../components/Ui'

export function ResultsPage() { return <Suspense fallback={<LoadingState label="Loading driver standings" detail="Fetching the latest published classification." />}><DriverStandings/></Suspense> }
export function NotFoundPage() { return <div className="container flow-page"><StatePanel eyebrow="404 / Off the circuit" title="A wrong turn." description="This page isn’t on the race map. Let’s get you back to the starting grid." icon={<Flag size={32} />} action={<Link className="button button-primary" to="/">BACK TO THE GRID <ArrowLeft size={17} /></Link>} /></div> }
