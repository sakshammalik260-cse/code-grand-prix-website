import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Flag } from 'lucide-react'
import { useSession } from '../hooks/useSession'
import { useRemoteResource } from '../hooks/useRemoteResource'
import { candidateProblemService } from '../services/problems'
import { ResultsPage } from '../pages/PlaceholderPages'
export function ResultsAccess(){
 const {driver}=useSession()
 const load=useCallback((signal:AbortSignal)=>driver?.role==='ADMIN'?Promise.resolve({visible:true}):candidateProblemService.resultsVisibility(signal),[driver?.role])
 const resource=useRemoteResource(load)
 if(resource.loading)return <div className="arena-load-screen" role="status">Checking results availability...</div>
 if(resource.error)return <div className="access-denied"><h1>Results are unavailable</h1><p role="alert">{resource.error}</p><button className="button button-primary" onClick={resource.reload}>RETRY</button></div>
 if(!resource.data?.visible)return <div className="access-denied"><Flag size={45}/><span className="admin-eyebrow">RACE CONTROL / RESULTS WITHHELD</span><h1>The classification is under review.</h1><p>Results will appear when the organizers publish them.</p><Link className="button button-primary" to="/lobby">BACK TO THE LOBBY</Link></div>
 return <ResultsPage/>
}
