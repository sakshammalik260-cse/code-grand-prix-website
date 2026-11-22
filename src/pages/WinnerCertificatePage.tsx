import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Pencil, Printer } from 'lucide-react'
import styles from './WinnerCertificatePage.module.css'

function Editable({ children, className = '', label }: { children: ReactNode; className?: string; label: string }) {
  return <span className={`${styles.editable} ${className}`} contentEditable suppressContentEditableWarning spellCheck={false} role="textbox" aria-label={label}>{children}</span>
}

function PixelTrophy() {
  return <svg className={styles.trophy} viewBox="0 0 128 112" role="img" aria-label="Pixel-art championship trophy" shapeRendering="crispEdges">
    <g fill="#9b6815"><path d="M20 20h20v12H28v28h16v12H24L12 60V28h8zm88 0h-20v12h12v28H84v12h20l12-12V28h-8z"/><path d="M48 84h32v12H48z"/></g>
    <path fill="#E5AD2F" d="M36 12h56v44H80v20H48V56H36z"/>
    <path fill="#ffd768" d="M44 20h12v28H44zm12-8h28v8H56z"/>
    <path fill="#bd821b" d="M80 20h12v36H80zM60 56h20v20H60z"/>
    <path fill="#17171B" d="M56 76h16v12H56z"/>
    <path fill="#E5AD2F" d="M36 92h56v12H36z"/>
    <path fill="#7d5312" d="M44 104h40v8H44z"/>
  </svg>
}

function PixelPodium() {
  return <svg className={styles.podium} viewBox="0 0 220 105" role="img" aria-label="Pixel-art winners podium" shapeRendering="crispEdges">
    <path fill="#17171B" d="M8 62h62v35H8zm70-42h64v77H78zm72 50h62v27h-62z"/>
    <path fill="#E52B20" d="M8 62h62v8H8zm70-42h64v8H78zm72 50h62v8h-62z"/>
    <path fill="#E5AD2F" d="M91 34h38v38H91z"/>
    <path fill="#F5F2EC" d="M105 40h11v25h-8V49h-6v-6h3zM31 74h17v6H37v5h11v6H29V78zm139 8h18v7h-6v5h-12v-6h9v-3h-9z"/>
    <path fill="#8f8d88" d="M8 97h204v8H8z"/>
  </svg>
}

function PixelCar() {
  return <svg className={styles.car} viewBox="0 0 360 128" role="img" aria-label="Pixel-art racing car" shapeRendering="crispEdges">
    <path fill="#17171B" d="M18 81h45v-18h36l21-29h77l34 29h72v12h38v28h-44v-11H72v11H18z"/>
    <path fill="#E52B20" d="M67 67h43l22-27h60l37 31h77v18H79V78H67z"/>
    <path fill="#a51812" d="M108 67h117l20 11H91zm133 22h65v11h-65z"/>
    <path fill="#F5F2EC" d="M134 47h47l22 20h-86z"/>
    <path fill="#4d5258" d="M145 51h31l15 14h-57z"/>
    <path fill="#E5AD2F" d="M250 74h42v8h-42z"/>
    <path fill="#17171B" d="M79 91h18v22H68V99zm190 0h18l12 8v14h-38V99z"/>
    <path fill="#4a4a4f" d="M73 98h20v20H73zm193 0h25v20h-25z"/>
    <path fill="#F5F2EC" d="M79 104h8v8h-8zm194 0h10v8h-10z"/>
    <path fill="#E52B20" d="M16 74h52v9H16zm286-17h42v9h-42z"/>
    <text x="147" y="84" fill="#F5F2EC" fontFamily="monospace" fontSize="14" fontWeight="900">CGP</text>
  </svg>
}

export function WinnerCertificatePage() {
  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Winner Certificate | Code Grand Prix'
    return () => { document.title = previousTitle }
  }, [])

  return <main id="main" className={styles.page}>
    <div className={styles.toolbar} aria-label="Certificate controls">
      <div><Pencil size={17} aria-hidden="true" /><span>Click any bracketed field to edit</span></div>
      <nav><Link to="/"><ArrowLeft size={16} aria-hidden="true" />Back to website</Link><button type="button" onClick={() => window.print()}><Printer size={17} aria-hidden="true" />Print / Save PDF</button></nav>
    </div>

    <div className={styles.preview}>
      <article className={styles.certificate} aria-labelledby="certificate-title">
        <div className={styles.depthFrame} aria-hidden="true" />
        <div className={styles.innerFrame} aria-hidden="true" />
        <div className={`${styles.cornerFlag} ${styles.topLeft}`} aria-hidden="true" />
        <div className={`${styles.cornerFlag} ${styles.topRight}`} aria-hidden="true" />
        <div className={`${styles.cornerFlag} ${styles.bottomLeft}`} aria-hidden="true" />
        <div className={`${styles.cornerFlag} ${styles.bottomRight}`} aria-hidden="true" />
        <span className={`${styles.pixelDash} ${styles.dashLeft}`} aria-hidden="true" />
        <span className={`${styles.pixelDash} ${styles.dashRight}`} aria-hidden="true" />

        <header className={styles.header}>
          <PixelTrophy />
          <p className={styles.championship}>INTER-COLLEGE COMPETITIVE PROGRAMMING CHAMPIONSHIP</p>
          <div className={styles.titleFrame}><h1 id="certificate-title">CERTIFICATE OF ACHIEVEMENT</h1></div>
        </header>

        <section className={styles.recipient} aria-label="Winner details">
          <p className={styles.label}>THIS CERTIFICATE IS AWARDED TO</p>
          <Editable className={styles.teamName} label="Team name">[TEAM NAME]</Editable>
          <Editable className={styles.members} label="Team member names">[MEMBER 1] • [MEMBER 2] • [MEMBER 3]</Editable>
        </section>

        <section className={styles.achievement} aria-label="Achievement details">
          <div className={styles.placing}><span>FOR SECURING</span><Editable label="Winner position">[FIRST / SECOND / THIRD] PLACE</Editable><small>IN</small></div>
          <div className={styles.eventTitle}><span>CODE</span><strong>GRAND PRIX</strong><i aria-hidden="true" /></div>
          <p>For demonstrating exceptional problem-solving skills, algorithmic thinking, coding efficiency, and competitive spirit during the Code Grand Prix speed coding competition.</p>
        </section>

        <div className={styles.bottomArtwork} aria-hidden="true"><PixelPodium /><PixelCar /></div>

        <section className={styles.signatures} aria-label="Certificate signatories">
          <div><span className={styles.signatureLine} /><Editable label="Competitive Programming Club lead name">[NAME]</Editable><small>Lead, Competitive Programming Club</small></div>
          <div><span className={styles.signatureLine} /><Editable label="Faculty coordinator name">[NAME]</Editable><small>Faculty Coordinator, CPC</small></div>
        </section>

        <div className={styles.clubBrand}><img src="/branding/cpc-logo.webp" alt="Competitive Programming Club" width="720" height="400" /><span>BUILD • SOLVE • IMPROVE</span></div>
        <footer className={styles.organiser}><strong>ORGANISED BY THE COMPETITIVE PROGRAMMING CLUB</strong><span>JAIN UNIVERSITY GLOBAL CAMPUS • BENGALURU</span></footer>
      </article>
    </div>
  </main>
}
