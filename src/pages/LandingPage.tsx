import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  Flag,
  Gauge,
  MapPin,
  Radio,
  ShieldCheck,
  Terminal,
  Trophy,
} from 'lucide-react'
import { AboutCpc } from '../components/AboutCpc'
import { Countdown } from '../components/Countdown'
import { Badge } from '../components/Ui'
import { event, rules } from '../data/event'
import { CheckeredFlag, RaceWordmark } from '../components/RacingIdentity'

const weekendStages = [
  {
    icon: ShieldCheck,
    code: 'SCRUTINEERING',
    title: 'Pre-race inspection',
    text: 'Confirm driver identity, camera, fullscreen and the competition rulebook before entering the lobby.',
  },
  {
    icon: Radio,
    code: 'GRID HOLD',
    title: 'Await race control',
    text: 'Checked-in drivers remain in the lobby until the organizer-controlled contest state turns live.',
  },
  {
    icon: Gauge,
    code: 'ROUND 01',
    title: 'Code at race pace',
    text: 'Solve released problems, run public tests and submit to the judging service before the chequered flag.',
  },
]

export function LandingPage() {
  return <>
    <section id="home" className="cinematic-hero" aria-label="Code Grand Prix 2026 starting grid">
      <CheckeredFlag className="hero-flag" />
      <div className="hero-track-glow" aria-hidden="true" />
      <div className="hero-content container">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <p className="hero-session-tag"><span /> CHAMPIONSHIP 2026 <i /> ROUND 01</p>
          <h1><RaceWordmark className="hero-wordmark" /><span className="sr-only">2026</span></h1>
          <p className="circuit-tagline">THE ULTIMATE CODING CIRCUIT</p>
          <p className="race-mantra"><span>CODE</span><i>//</i><span>COMPILE</span><i>//</i><span>CONQUER</span></p>
        </motion.div>
        <motion.div className="hero-grid-entry" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.55, delay: 0.14 }}>
          <p className="hero-event-label"><strong>23 NOVEMBER 2026</strong><span>CPC / COMPETITIVE PROGRAMMING CLUB</span></p>
          <div className="race-countdown-panel"><h2>EVENT WEEKEND IN</h2><Countdown /><p className="countdown-caption">Countdown to event date · Race start time TBA</p></div>
          <Link className="button button-primary racing-button" to="/login"><span>ENTER THE GRID <ArrowRight size={20} /></span></Link>
          <p className="hero-university"><span>ASSIGNED DRIVER ID REQUIRED</span>{event.university}</p>
        </motion.div>
      </div>
      <div className="hero-bottom-line"><span>CODE GRAND PRIX <strong>2026</strong></span><span>YOUR LOGIC. YOUR SPEED. YOUR RACE.</span></div>
    </section>

    <AboutCpc />

    <section className="race-strip"><div className="container race-strip-inner"><div className="race-date"><CalendarDays size={23} /><div><span>MARK YOUR CALENDAR</span><strong>{event.dateLabel.toUpperCase()}</strong><small>Monday <i /> India Standard Time</small></div></div><div className="countdown-wrap"><div><span className="eyebrow-sm">EVENT DATE IN</span><small>Countdown to event date • Start time TBA</small></div><Countdown compact /></div><span className="strip-number">LIGHTS OUT.<br /><strong>LOGIC ON.</strong></span></div></section>

    <motion.section id="schedule" className="race-weekend" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .5 }}>
      <div className="container">
        <div className="race-weekend-heading">
          <div><div className="eyebrow"><span /> RACE WEEKEND</div><h2>From check-in<br /><em>to chequered flag.</em></h2></div>
          <p>One controlled competition flow. Every state shown here maps to the actual driver experience.</p>
        </div>
        <div className="weekend-control-grid">
          <aside className="weekend-briefing" aria-label="Race weekend briefing">
            <span className="weekend-live-label"><i /> EVENT BRIEFING</span>
            <dl>
              <div><dt>Date</dt><dd>23 NOV 2026</dd></div>
              <div><dt>Round</dt><dd>ROUND 01</dd></div>
              <div><dt>Timezone</dt><dd>IST</dd></div>
              <div><dt>Race start</dt><dd>TO BE ANNOUNCED</dd></div>
            </dl>
            <p><Radio size={14} /> Official timing, problem releases and results visibility remain under CPC Race Control.</p>
          </aside>
          <ol className="weekend-timeline">
            {weekendStages.map(({ icon: Icon, code, title, text }, index) => <li key={title}>
              <span className="weekend-stage-number">0{index + 1}</span>
              <span className="weekend-stage-icon"><Icon size={18} /></span>
              <div><small>{code}</small><h3>{title}</h3><p>{text}</p></div>
            </li>)}
          </ol>
        </div>
      </div>
    </motion.section>

    <section className="journey-section"><div className="container journey-inner"><div><div className="eyebrow"><span /> YOUR ROUTE TO THE GRID</div><h2>Three steps.<br /><em>One starting line.</em></h2><Link className="text-link" to="/login">Get race-ready <ArrowRight size={16} /></Link></div><ol className="journey-list">{[{ icon: Terminal, title: 'Claim your driver seat', text: 'Sign in with your assigned Driver ID.' }, { icon: Check, title: 'Complete your pre-race checks', text: 'Camera, fullscreen and a quick rulebook review.' }, { icon: Flag, title: 'Wait for the green light', text: 'Join the lobby. Stay ready. Your race is next.' }].map(({ icon: Icon, title, text }, i) => <li key={title}><span className="journey-number">0{i + 1}</span><Icon size={20} /><div><h3>{title}</h3><p>{text}</p></div></li>)}</ol></div></section>

    <section id="rules" className="container content-section rules-section"><div><div className="eyebrow"><span /> THE RULEBOOK</div><h2>Fair play.<br /><em>Full throttle.</em></h2><p className="muted">Great races start with a level playing field.</p><Badge tone="yellow">PREVIEW GUIDELINES</Badge><p className="small muted mt-3">Final rules are subject to CPC Club confirmation.</p></div><div className="rules-list">{rules.map((rule, i) => <article key={rule.title}><span>0{i + 1}</span><div><h3>{rule.title}</h3><p>{rule.description}</p></div></article>)}</div></section>

    <motion.section className="container championship-gateway" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .3 }} transition={{ duration: .45 }}>
      <div className="championship-gateway-mark"><Trophy size={25} /><span>OFFICIAL CLASSIFICATION</span></div>
      <div><span className="eyebrow-sm">CHAMPIONSHIP STANDINGS</span><h2>The timing screen,<br /><em>when Race Control releases it.</em></h2><p>No preview rankings are presented as official results. Authenticated drivers can view judged standings only when visibility is enabled.</p></div>
      <Link className="button button-secondary" to="/results">VIEW DRIVER STANDINGS <ArrowUpRight size={17} /></Link>
    </motion.section>

    <section className="container final-cta"><div className="checkered-block" aria-hidden="true" /><div><span className="eyebrow-sm">YOUR STARTING LINE IS WAITING.</span><h2>Ready to make your move?</h2></div><Link className="button button-primary" to="/login">ENTER THE GRID <ArrowUpRight size={18} /></Link></section>
    <div className="container venue-note"><MapPin size={14} /> {event.university}<span>POWERED BY CURIOSITY. DRIVEN BY CODE.</span></div>
  </>
}
