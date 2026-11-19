import { useEffect, useRef, useState } from 'react'
import { Check, Clock3, Copy, FileText, Gauge, LoaderCircle, RotateCw, Trophy } from 'lucide-react'
import type { Problem } from '../../types/arena'

interface Props { problem: Problem | null; error: string; onRetry: () => void }

export function ProblemStatement({ problem, error, onRetry }: Props) {
  const [copied, setCopied] = useState('')
  const copyTimer = useRef(0)

  useEffect(() => () => window.clearTimeout(copyTimer.current), [])

  async function copySample(id: string, kind: 'input' | 'output', value: string) {
    const key = `${id}:${kind}`
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      window.clearTimeout(copyTimer.current)
      copyTimer.current = window.setTimeout(() => setCopied(''), 1800)
    } catch {
      setCopied('error')
    }
  }

  if (error) return <div className="arena-inline-error"><FileText size={30} /><h2>Unable to load this problem</h2><p>{error}</p><button className="arena-quiet-button" onClick={onRetry}><RotateCw size={12} />Retry problem</button></div>
  if (!problem) return <div className="arena-pane-loading"><LoaderCircle size={23} className="spin" /><p>Loading problem briefing…</p></div>
  return <>
    <div className="arena-statement-tab"><FileText size={12} />PROBLEM BRIEFING <span className="arena-statement-public">PUBLIC STATEMENT</span></div>
    <article className="arena-statement-body">
      <div className="arena-problem-title"><div><span>PROBLEM {String(problem.number).padStart(2, '0')}</span><h2>{problem.title}</h2></div><span className={`arena-difficulty difficulty-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span></div>
      <div className="arena-problem-meta"><span><Trophy size={11} />{problem.points} PTS</span><span><Clock3 size={11} />{problem.timeLimitMs / 1000}s</span><span><Gauge size={11} />{problem.memoryLimitMb} MB</span></div>
      <section className="arena-problem-copy" aria-labelledby="problem-description-heading"><h3 id="problem-description-heading">Problem description</h3>{problem.statement.map((paragraph,index)=><p key={index}>{paragraph}</p>)}</section>
      <section><h3>Input format</h3>{problem.inputFormat.map((line,index)=><p key={index}>{line}</p>)}</section>
      <section><h3>Output format</h3><p>{problem.outputFormat}</p></section>
      <section><h3>Constraints</h3><ul className="arena-constraints">{problem.constraints.map((line,index)=><li key={index}>{line}</li>)}</ul></section>
      {(problem.expectedTimeComplexity || problem.expectedSpaceComplexity) && <section className="arena-complexity"><h3>Complexity targets</h3>{problem.expectedTimeComplexity && <p><span>Time</span><code>{problem.expectedTimeComplexity}</code></p>}{problem.expectedSpaceComplexity && <p><span>Space</span><code>{problem.expectedSpaceComplexity}</code></p>}</section>}
      {problem.samples.map((sample,index)=><section className="arena-statement-example" key={sample.id}>
        <h3>Sample {index + 1}</h3>
        <div className="arena-example-columns">
          <div><div className="arena-example-heading"><h4>Input</h4><button onClick={() => { void copySample(sample.id, 'input', sample.input) }} aria-label={`Copy sample ${index + 1} input`}>{copied === `${sample.id}:input` ? <Check size={11} /> : <Copy size={11} />}{copied === `${sample.id}:input` ? 'Copied' : 'Copy'}</button></div><pre>{sample.input}</pre></div>
          <div><div className="arena-example-heading"><h4>Output</h4><button onClick={() => { void copySample(sample.id, 'output', sample.output) }} aria-label={`Copy sample ${index + 1} output`}>{copied === `${sample.id}:output` ? <Check size={11} /> : <Copy size={11} />}{copied === `${sample.id}:output` ? 'Copied' : 'Copy'}</button></div><pre>{sample.output}</pre></div>
        </div>
        <h4>Explanation</h4><p>{sample.explanation}</p>
      </section>)}
      {copied === 'error' && <p className="arena-copy-error" role="alert">Clipboard access is unavailable. Select the sample text to copy it manually.</p>}
      <p className="arena-problem-disclaimer">Organizer-supplied briefing. Only public examples are shown.</p>
    </article>
  </>
}
