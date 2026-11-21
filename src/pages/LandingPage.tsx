import { lazy, Suspense, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, ShieldCheck } from 'lucide-react'
import { Countdown } from '../components/Countdown'
import { CheckeredFlag, RaceWordmark } from '../components/RacingIdentity'
import { StatusIndicator } from '../components/Ui'
import { event } from '../data/event'
import heroArtwork from '../assets/artwork/night-race-hero.webp'
import heroMotionWebm from '../assets/artwork/night-race-hero-motion.webm'
import heroMotionMp4 from '../assets/artwork/night-race-hero-motion.mp4'
import styles from './LandingPage.module.css'
import { useLandingRaceMotion } from '../hooks/useLandingRaceMotion'

const LandingContent = lazy(() => import('./LandingContent').then(module => ({ default: module.LandingContent })))
const ambientParticles = Array.from({ length: 14 }, (_, index) => index)
const grandstandLights = Array.from({ length: 12 }, (_, index) => index)

export function LandingPage() {
  const heroRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  useLandingRaceMotion(heroRef)
  useEffect(() => {
    const video = videoRef.current; if (!video) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
    let visible = true
    const update = () => { if (!visible || document.hidden || reduced.matches || connection?.saveData) video.pause(); else void video.play().catch(() => { }) }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update() }, { rootMargin: '120px 0px' })
    observer.observe(video)
    video.addEventListener('canplay', update); document.addEventListener('visibilitychange', update); reduced.addEventListener('change', update); update()
    return () => { observer.disconnect(); video.removeEventListener('canplay', update); document.removeEventListener('visibilitychange', update); reduced.removeEventListener('change', update); video.pause() }
  }, [])
  return <>
    <section ref={heroRef} id="home" className={styles.hero} aria-labelledby="hero-title">
      <video ref={videoRef} className={styles.heroArtwork} data-hero-layer="artwork" muted loop playsInline preload="metadata" poster={heroArtwork} width="1280" height="720" disablePictureInPicture aria-hidden="true" tabIndex={-1}><source src={heroMotionWebm} type="video/webm" /><source src={heroMotionMp4} type="video/mp4" /><img src={heroArtwork} alt="" width="1672" height="941" /></video>
      <div className={styles.heroShade} data-hero-layer="shade" aria-hidden="true" />
      <div className={styles.heroGrid} data-hero-layer="grid" aria-hidden="true" />
      <div className={styles.ambientGlow} data-hero-layer="ambient" aria-hidden="true" />
      <div className={styles.grandstandLights} data-hero-layer="grandstand" aria-hidden="true">{grandstandLights.map(light => <i key={light} />)}</div>
      <div className={styles.heroParticles} data-hero-layer="particles" aria-hidden="true">{ambientParticles.map(particle => <i key={particle} />)}</div>
      <div className={styles.velocityField} data-hero-layer="velocity" aria-hidden="true"><i /><i /><i /><i /><i /><i /></div>
      <div className={styles.trackEnergy} data-hero-layer="track" aria-hidden="true"><span /><span /><span /></div>
      <CheckeredFlag className={styles.heroFlag} />
      <div className={styles.heroFrame}>
        <div className={styles.heroIdentity} data-hero-layer="identity">
          <p className={styles.sessionTag}><span /> CHAMPIONSHIP 2026 <i /> ROUND 01</p>
          <h1 id="hero-title"><RaceWordmark className={styles.wordmark} /><span className="sr-only">2026</span></h1>
          <p className={styles.heroTagline}>The ultimate coding circuit</p>
          <p className={styles.mantra}><span>Code</span><i>//</i><span>Compile</span><i>//</i><span>Conquer</span></p>
        </div>

        <aside className={styles.eventControl} data-hero-layer="control" aria-labelledby="event-day-title">
          <div className={styles.eventControlHeader}>
            <span>RACE CONTROL / ROUND 01</span>
            <StatusIndicator tone="caution">Start TBA</StatusIndicator>
          </div>
          <p className={styles.eventDate}>{event.dateLabel.toUpperCase()}</p>
          <p className={styles.eventOrganizer}>CPC / COMPETITIVE PROGRAMMING CLUB</p>
          <div className={styles.countdownPanel}>
            <h2 id="event-day-title">Event day in</h2>
            <Countdown />
            <p>Counts down to the published event date. Official race timing will be announced separately.</p>
          </div>
          <div className={styles.heroActions}>
            <Link className={`${styles.primaryAction} race-action`} to="/login">ENTER THE GRID <ArrowRight size={19} /></Link>
            <Link className={`${styles.secondaryAction} race-action`} to="/#schedule">VIEW RACE FORMAT <ArrowDown size={16} /></Link>
          </div>
          <p className={styles.accessNote}><ShieldCheck size={14} /> Assigned Driver ID required</p>
        </aside>
      </div>

      <dl className={styles.heroTelemetry} data-hero-layer="telemetry">
        <div><dt>Promoter</dt><dd>CPC Club</dd></div>
        <div><dt>Host institution</dt><dd>{event.university}</dd></div>
        <div><dt>Round</dt><dd>01 / 2026</dd></div>
        <div><dt>Race start</dt><dd>To be announced</dd></div>
      </dl>
    </section>

    <Suspense fallback={<section className={styles.contentLoading} role="status" aria-live="polite"><span>Loading championship details</span></section>}>
      <LandingContent />
    </Suspense>
  </>
}
