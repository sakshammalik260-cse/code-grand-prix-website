import { useCallback,useEffect,useRef,useState } from 'react'
import { Lightbulb,LockKeyhole,UnlockKeyhole,LoaderCircle,RefreshCw } from 'lucide-react'
import { hintService } from '../../services/assist'
import { parseHintState,parseHintUnlock } from '../../services/assist/contracts'
import { RaceDialog } from './RaceDialog'
import type { HintState,LockedHint } from '../../types/assist'
interface Props {problemId:string;sessionId:string;allowed:boolean;onPenalty:()=>void}
export function RaceAssist({problemId,sessionId,allowed,onPenalty}:Props){
 const [state,setState]=useState<HintState|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0),[target,setTarget]=useState<{hint:LockedHint;operationId:string;revision:number}|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 const gate=useRef(false),alive=useRef(false),controller=useRef<AbortController|null>(null)
 const close=useCallback(()=>setTarget(null),[])
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;controller.current?.abort()}},[])
 useEffect(()=>{
  const abort=new AbortController();hintService.get(problemId,abort.signal).then(value=>{if(!abort.signal.aborted){setState(parseHintState(value,problemId));setError('')}}).catch(reason=>{if(!abort.signal.aborted)setError(reason instanceof Error?reason.message:'Unable to load hints.')}).finally(()=>{if(!abort.signal.aborted)setLoading(false)})
  return()=>abort.abort()
 },[problemId,attempt])
 async function unlock(){
  if(!target||!state||!allowed||gate.current)return
  gate.current=true;setBusy(true);setError('');setMessage('');controller.current=new AbortController()
  try{
   const result=parseHintUnlock(await hintService.unlock(problemId,target.hint.id,{operationId:target.operationId,sessionId,configurationRevision:target.revision,expectedDeductionPoints:target.hint.deductionPoints},controller.current.signal),problemId,target.hint.id)
   if(!alive.current)return
   setState(result);setTarget(null);setMessage(result.replayed?'Previously unlocked hint restored. No additional deduction.':`Hint unlocked. ${result.deductionApplied} points deducted from this problem\u2019s potential score.`);onPenalty()
  }catch(reason){if(alive.current)setError(reason instanceof Error?reason.message:'Unlock failed. Refresh hint status before retrying.')}
  finally{gate.current=false;if(alive.current)setBusy(false)}
 }
 const unlocked=state?.hints.filter(h=>h.status==='UNLOCKED').length||0
 return <details className="race-assist"><summary><Lightbulb size={17}/><span>RACE ASSIST <i>/</i> HINTS</span><small>{state?`${unlocked}/${state.hints.length}`:'...'}</small></summary><div className="race-assist-body">
 {loading&&<p role="status">Loading race assistance...</p>}{state&&<><div className="hint-score-grid"><span>Problem value<strong>{state.maximumPoints}<small>PTS</small></strong></span><span>Hint penalties<strong className="hint-penalty">{state.totalHintPenalty}<small>PTS</small></strong></span><span>Potential score<strong className="hint-potential">{state.remainingPotentialScore}<small>PTS</small></strong></span></div><p className="assist-muted">{state.hints.length} available / {unlocked} unlocked. Potential points are not earned points; judging determines your score.</p><div className="hint-list">{state.hints.map(h=>h.status==='UNLOCKED'?<details className="hint-unlocked" key={h.id} open><summary><UnlockKeyhole size={14}/>Hint {String(h.order).padStart(2,'0')}<span>UNLOCKED / {h.deductionPoints} PTS</span></summary><p>{h.content}</p></details>:<button key={h.id} className="hint-locked" disabled={!allowed||busy||loading} onClick={()=>{setError('');setMessage('');setTarget({hint:h,operationId:crypto.randomUUID(),revision:state.configurationRevision})}}><LockKeyhole size={14}/><strong>Hint {String(h.order).padStart(2,'0')}</strong><span>{h.deductionPoints} PTS</span></button>)}</div>{!state.hints.length&&<p className="assist-empty">No hints configured for this question.</p>}</>}
 {!allowed&&<p className="assist-muted">Unlocking requires a live race and an authorized monitoring session.</p>}{error&&<p className="assist-error" role="alert">{error}</p>}{message&&<p className="assist-success" role="status">{message}</p>}<button className="assist-text-button" disabled={busy} onClick={()=>{setLoading(true);setTarget(null);setAttempt(v=>v+1)}}><RefreshCw size={12}/>Refresh hint status</button>
 </div>{target&&allowed&&<RaceDialog titleId="hint-request-title" onClose={close} busy={busy}><span className="assist-eyebrow">RACE CONTROL / HINT REQUEST</span><Lightbulb className="assist-dialog-icon" size={32}/><h2 id="hint-request-title">Unlock Hint {String(target.hint.order).padStart(2,'0')}?</h2><p>This will deduct <strong>{target.hint.deductionPoints} points</strong> from the maximum available score for this problem.</p><dl className="hint-confirm-score"><div><dt>Current potential score</dt><dd>{state?.remainingPotentialScore}</dd></div><div><dt>After unlocking</dt><dd>{Math.max(0,(state?.remainingPotentialScore||0)-target.hint.deductionPoints)}</dd></div></dl><p className="assist-muted">Unlocks are permanent for this contest. No points are earned by revealing a hint.</p>{error&&<p className="assist-error" role="alert">{error}</p>}<div className="assist-dialog-actions"><button className="assist-secondary" onClick={close} disabled={busy}>CANCEL</button><button className="assist-primary" disabled={busy||!allowed} onClick={()=>void unlock()}>{busy?<><LoaderCircle size={15} className="spin"/>UNLOCKING...</>:'UNLOCK HINT'}</button></div></RaceDialog>}
 </details>
}
