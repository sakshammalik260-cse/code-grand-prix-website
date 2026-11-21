import { useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Flag } from 'lucide-react'
import { useSession } from '../hooks/useSession'
import { useRemoteResource } from '../hooks/useRemoteResource'
import { candidateProblemService } from '../services/problems'
import { ResultsPage } from '../pages/PlaceholderPages'
import { LoadingState, StatePanel } from './Ui'
export function ResultsAccess(){
 const {driver}=useSession()
 const load=useCallback((signal:AbortSignal)=>driver?.role==='ADMIN'?Promise.resolve({visible:true}):candidateProblemService.resultsVisibility(signal),[driver?.role])
 const resource=useRemoteResource(load)
 useEffect(()=>{if(resource.data?.visible!==false)return;const timer=window.setInterval(resource.refresh,20000);return()=>window.clearInterval(timer)},[resource.data?.visible,resource.refresh])
 if(resource.loading)return <LoadingState label="Checking classification access" detail="Waiting for Race Control visibility." />
 if(resource.error)return <StatePanel className="access-denied" eyebrow="Race Control / Connection fault" title="Results are unavailable." description={resource.error} tone="critical" action={<button className="button button-primary" onClick={resource.reload}>RETRY</button>} />
 if(!resource.data?.visible)return <StatePanel className="access-denied" eyebrow="Race Control / Results withheld" title="The classification is under review." description="Results will appear when the organizers publish them." icon={<Flag size={30}/>} action={<Link className="button button-primary" to="/lobby">BACK TO THE LOBBY</Link>} />
 return <ResultsPage/>
}
