import { developmentAccounts } from '../services/authMock'
export default function DevelopmentAccounts({ onSelect }: {onSelect:(id:string,password:string)=>void}) {
  return <details className="login-preview-access"><summary>Preview access <span>DEVELOPMENT ONLY</span></summary><div>{developmentAccounts.map(account=><p key={account.id}><strong>{account.role}</strong><br/><code>{account.id}</code> / <code>{account.password}</code><br/><button type="button" className="text-link" onClick={()=>onSelect(account.id,account.password)}>Use {account.role.toLowerCase()} account</button></p>)}</div></details>
}
