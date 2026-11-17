import { useEffect,useState } from 'react'
export function useRemoteResource<T>(load:(signal:AbortSignal)=>Promise<T>) {
  const [data,setData]=useState<T|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[attempt,setAttempt]=useState(0)
  useEffect(()=>{const controller=new AbortController();load(controller.signal).then(value=>{if(!controller.signal.aborted){setData(value);setError('')}}).catch(reason=>{if(!controller.signal.aborted)setError(reason instanceof Error?reason.message:'Unable to load data.')}).finally(()=>{if(!controller.signal.aborted)setLoading(false)});return()=>controller.abort()},[load,attempt])
  return {data,error,loading,reload:()=>{setLoading(true);setAttempt(value=>value+1)}}
}
