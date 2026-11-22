import { AboutCpc } from '../components/AboutCpc'
import { LivingRaceBackground } from '../components/LivingRaceBackground'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight, CalendarDays, Check, Flag, MapPin, Terminal } from 'lucide-react'
import { Countdown } from '../components/Countdown'
import { Badge } from '../components/Ui'
import { event, rules } from '../data/event'
import { CheckeredFlag, RaceWordmark } from '../components/RacingIdentity'

export function LandingPage() {
  return <>
    <section id="home" className="cinematic-hero" aria-label="Code Grand Prix 2026 starting grid">
      <LivingRaceBackground />
      <CheckeredFlag className="hero-flag" />
      <div className="hero-content container">
        <div className="hero-copy" data-home-reveal="hero">
          <h1><RaceWordmark className="hero-wordmark" /><span className="sr-only">2026</span></h1>
          <p className="circuit-tagline">THE ULTIMATE CODING CIRCUIT</p>
          <p className="race-mantra"><span>CODE</span><i>//</i><span>COMPILE</span><i>//</i><span>CONQUER</span></p>

        </div>
        <div className="hero-grid-entry">
          <p className="hero-event-label"><strong>23 NOVEMBER 2026</strong><span>CPC / COMPETITIVE PROGRAMMING CLUB</span></p>
          <div className="race-countdown-panel"><h2>RACE STARTS IN</h2><Countdown /><p className="countdown-caption">Countdown to event date · Race start time TBA</p></div>
          <Link className="button button-primary racing-button" to="/login"><span>ENTER THE GRID <ArrowRight size={20} /></span></Link>
          <p className="hero-university">{event.university}</p>
        </div>
      </div>
      <div className="hero-bottom-line"><span>CODE GRAND PRIX <strong>2026</strong></span><span>YOUR LOGIC. YOUR SPEED. YOUR RACE.</span></div>
    </section>
    <AboutCpc />
    <section id="schedule" className="race-strip"><div className="container race-strip-inner"><div className="race-date" data-home-reveal=""><CalendarDays size={23} /><div><span>MARK YOUR CALENDAR</span><strong>23 NOVEMBER 2026</strong><small>Monday <i /> India Standard Time</small></div></div><div className="countdown-wrap"><div><span className="eyebrow-sm">THE GRID OPENS IN</span><small>Countdown to event date • Start time TBA</small></div><Countdown compact /></div><span className="strip-number">LIGHTS OUT.<br /><strong>LOGIC ON.</strong></span></div></section>
    <section className="journey-section"><div className="container journey-inner"><div><div className="eyebrow"><span /> YOUR ROUTE TO THE GRID</div><h2 data-home-reveal="">Three steps.<br /><em>One starting line.</em></h2><Link className="text-link" to="/login">Get race-ready <ArrowRight size={16} /></Link></div><ol className="journey-list" data-home-reveal="">{[{ icon: Terminal, title: 'Claim your driver seat', text: 'Sign in with your assigned Driver ID.' }, { icon: Check, title: 'Complete your pre-race checks', text: 'Camera, fullscreen and a quick rulebook review.' }, { icon: Flag, title: 'Wait for the green light', text: 'Join the lobby. Stay ready. Your race is next.' }].map(({ icon: Icon, title, text }, i) => <li key={title}><span className="journey-number">0{i + 1}</span><Icon size={20} /><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></div></section>
    <section id="rules" className="container content-section rules-section"><div><div className="eyebrow"><span /> THE RULEBOOK</div><h2 data-home-reveal="">Fair play.<br /><em>Full throttle.</em></h2><p className="muted">Great races start with a level playing field.</p><Badge tone="yellow">PREVIEW GUIDELINES</Badge><p className="small muted mt-3">Final rules are subject to CPC Club confirmation.</p></div><div className="rules-list" data-home-reveal="">{rules.map((rule, i) => <article key={rule.title}><span>0{i + 1}</span><div><h3>{rule.title}</h3><p>{rule.description}</p></div></article>)}</div></section>
    <section className="container final-cta"><div className="checkered-block" aria-hidden="true" /><div><span className="eyebrow-sm">YOUR STARTING LINE IS WAITING.</span><h2 data-home-reveal="">Ready to make your move?</h2></div><Link className="button button-primary" to="/login">ENTER THE GRID <ArrowUpRight size={18} /></Link></section>
    <div className="container venue-note"><MapPin size={14} /> {event.university}<span>POWERED BY CURIOSITY. DRIVEN BY CODE.</span></div>
  </>
}


