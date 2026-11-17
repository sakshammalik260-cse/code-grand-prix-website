import type { ContestPhase, MockScenario } from '../../types/arena'
import { mockControls } from '../../services/arena/mockState'

const scenarios: { value: MockScenario; label: string }[] = [
  { value: 'ACCEPTED', label: 'Accepted' }, { value: 'WRONG_ANSWER', label: 'Wrong Answer' },
  { value: 'COMPILATION_ERROR', label: 'Compilation Error' }, { value: 'RUNTIME_ERROR', label: 'Runtime Error' },
  { value: 'TIME_LIMIT_EXCEEDED', label: 'Time Limit Exceeded' }, { value: 'MEMORY_LIMIT_EXCEEDED', label: 'Memory Limit Exceeded' },
  { value: 'NETWORK_ERROR', label: 'Request failure' },
]
interface Props { busy: boolean; onPhase: (phase: ContestPhase) => void; onExpiry: () => void }
export function MockArenaControls({ busy, onPhase, onExpiry }: Props) {
  return <details className="arena-mock-console"><summary>Mock controls</summary><div className="arena-mock-popover"><h2>Simulation controls</h2><p>Preview fixtures only. These controls never change an official timer, judge code or award an official score.</p><label>Run fixture<select aria-label="Run fixture" defaultValue={mockControls.runScenario} disabled={busy} onChange={event => { mockControls.runScenario = event.target.value as MockScenario }}>{scenarios.filter(item => item.value !== 'MEMORY_LIMIT_EXCEEDED').map(item => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><label>Submit fixture<select aria-label="Submit fixture" defaultValue={mockControls.submissionScenario} disabled={busy} onChange={event => { mockControls.submissionScenario = event.target.value as MockScenario }}>{scenarios.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label><span className="arena-mock-field-title">Race state fixture</span><div className="arena-fixture-buttons">{(['WAITING','LIVE','PAUSED_BY_ORGANIZER','FINISHED'] as const).map(phase => <button key={phase} type="button" onClick={() => onPhase(phase)}>{phase === 'PAUSED_BY_ORGANIZER' ? 'Paused' : phase.charAt(0)+phase.slice(1).toLowerCase()}</button>)}</div><button type="button" className="arena-expiry-fixture" onClick={onExpiry}>End mock race in 5 seconds</button></div></details>
}
