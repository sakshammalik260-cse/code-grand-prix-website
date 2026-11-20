import { useEffect,useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
export function RaceDialog({titleId,children,onClose,busy=false,className=''}:{titleId:string;children:ReactNode;onClose:()=>void;busy?:boolean;className?:string}){
 const ref=useRef<HTMLDivElement>(null)
 const previous=useRef<HTMLElement|null>(null)
 useEffect(()=>{previous.current=document.activeElement as HTMLElement|null;ref.current?.focus();return()=>{const target=previous.current;if(target?.isConnected&&!target.closest('[inert]'))target.focus()}},[])
 useEffect(()=>{
   const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape'){if(!busy)onClose();return}
   if(event.key!=='Tab')return
   const targets=[...(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled),select:not(:disabled),input:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')||[])].filter(el=>el.getClientRects().length)
   const first=targets[0],last=targets.at(-1)
   if(!first){event.preventDefault();return}
   if(event.shiftKey&&(document.activeElement===first||document.activeElement===ref.current)){event.preventDefault();last?.focus()}
   else if(!event.shiftKey&&(document.activeElement===last||document.activeElement===ref.current)){event.preventDefault();first.focus()}
   }
   document.addEventListener('keydown',key)
   return()=>document.removeEventListener('keydown',key)
 },[onClose,busy])
 return <div className="assist-dialog-backdrop"><div className={'assist-dialog '+className} ref={ref} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}><button className="assist-close" aria-label="Close dialog" disabled={busy} onClick={onClose}><X size={18}/></button>{children}</div></div>
}
