import { useRef } from 'react'
import { Link } from 'react-router-dom'
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
import { StatusIndicator } from '../components/Ui'
import { event, rules } from '../data/event'
import { useLandingScrollStory } from '../hooks/useLandingScrollStory'
import styles from './LandingPage.module.css'

const raceStages = [
  { icon: ShieldCheck, code: 'SCRUTINEERING', title: 'Pre-race inspection', text: 'Confirm driver identity, camera, fullscreen and the competition rulebook before entering the lobby.' },
  { icon: Radio, code: 'GRID HOLD', title: 'Await Race Control', text: 'Checked-in drivers remain in the lobby until the organizer-controlled contest state turns live.' },
  { icon: Gauge, code: 'ROUND 01', title: 'Code at race pace', text: 'Solve released problems, run public tests and submit to the judging service before the chequered flag.' },
] as const

const gridRoute = [
  { icon: Terminal, title: 'Access your assigned seat', text: 'Sign in with the Driver ID assigned by CPC Race Control.' },
  { icon: Check, title: 'Clear pre-race inspection', text: 'Complete the camera, fullscreen and rulebook checks.' },
  { icon: Flag, title: 'Hold for the green light', text: 'Enter the lobby and wait for the official contest state.' },
] as const

export function LandingContent() {
  const storyRef = useRef<HTMLDivElement>(null)
  useLandingScrollStory(storyRef)

  return <div ref={storyRef} className={styles.scrollStory}>
    <section className={styles.eventRail} data-scroll-section aria-label="Event timing summary">
      <div className={styles.sectionFrame} data-stagger>
        <div className={styles.railDate} data-stagger-item><CalendarDays size={22} aria-hidden="true" /><span><small>MARK YOUR CALENDAR</small><strong>{event.dateLabel.toUpperCase()}</strong></span></div>
        <div className={styles.railStatus} data-stagger-item><span aria-hidden="true" /><div><small>SCHEDULE STATUS</small><strong>RACE START 12:30 PM IST</strong></div></div>
        <div className={styles.railCountdown} data-stagger-item><span><small>EVENT DATE IN</small><em>12:30 PM IST</em></span><Countdown compact /></div>
      </div>
    </section>

    <AboutCpc />

    <section id="schedule" className={styles.weekend} data-scroll-section>
      <span className={styles.sectionWatermark} data-parallax="16" aria-hidden="true">RACE FLOW</span>
      <div className={styles.sectionFrame}>
        <div className={styles.sectionHeading} data-reveal="heading">
          <div><span className={styles.telemetryLabel}>RACE FORMAT / DRIVER FLOW</span><h2>From inspection<br />to <em>chequered flag.</em></h2></div>
          <p>One controlled competition flow. Every state shown here maps to the actual participant journey.</p>
        </div>
        <div className={styles.weekendGrid}>
          <aside className={styles.briefing} data-reveal="card" data-parallax="-5" data-tilt aria-label="Event format briefing">
            <span className={styles.briefingStatus}><i /> EVENT BRIEFING</span>
            <dl>
              <div><dt>Date</dt><dd>{event.dateLabel.toUpperCase()}</dd></div>
              <div><dt>Round</dt><dd>ROUND 01</dd></div>
              <div><dt>Timezone</dt><dd>IST / UTC+05:30</dd></div>
              <div><dt>Race start</dt><dd>12:30 PM IST</dd></div>
            </dl>
            <p><Radio size={15} aria-hidden="true" /> Timing, problem release and results visibility remain under CPC Race Control.</p>
          </aside>
          <div className={styles.stageTrack}>
            <span className={styles.stageProgress} data-timeline-progress aria-hidden="true" />
            <ol className={styles.stageList} data-stagger role="list">
              {raceStages.map(({ icon: Icon, code, title, text }, index) => <li key={title} data-stagger-item data-tilt>
                <span className={styles.stageNumber}>0{index + 1}</span>
                <span className={styles.stageIcon}><Icon size={19} aria-hidden="true" /></span>
                <div><small>{code}</small><h3>{title}</h3><p>{text}</p></div>
              </li>)}
            </ol>
          </div>
        </div>
      </div>
    </section>

    <section id="access" className={styles.driverRoute} data-scroll-section>
      <span className={styles.sectionWatermark} data-parallax="-13" aria-hidden="true">ACCESS</span>
      <div className={styles.sectionFrame}>
        <div className={styles.routeIntro} data-reveal="heading" data-parallax="-4">
          <span className={styles.telemetryLabel}>ASSIGNED DRIVER ACCESS</span>
          <h2>Three checks.<br /><em>One starting line.</em></h2>
          <p>Authentication, inspection and race state remain connected from the first login to the final submission.</p>
          <Link className="race-action" data-magnetic to="/login">DRIVER SIGN IN <ArrowRight size={16} aria-hidden="true" /></Link>
        </div>
        <ol className={styles.routeList} data-stagger role="list">
          {gridRoute.map(({ icon: Icon, title, text }, index) => <li key={title} data-stagger-item>
            <span className={styles.routeNumber}>0{index + 1}</span>
            <Icon size={21} aria-hidden="true" />
            <div><h3>{title}</h3><p>{text}</p></div>
          </li>)}
        </ol>
      </div>
    </section>

    <section id="rules" className={styles.rules} data-scroll-section>
      <span className={styles.sectionWatermark} data-parallax="15" aria-hidden="true">SPORTING CODE</span>
      <div className={styles.sectionFrame}>
        <div className={styles.rulesIntro} data-reveal="heading" data-parallax="-4">
          <span className={styles.telemetryLabel}>SPORTING CODE / PREVIEW</span>
          <h2>Fair play.<br /><em>Full throttle.</em></h2>
          <p>Great races start with a level playing field.</p>
          <StatusIndicator tone="caution">Preview guidelines</StatusIndicator>
          <small>Final rules are subject to CPC Club confirmation.</small>
        </div>
        <ol className={styles.rulesList} data-stagger role="list">
          {rules.map((rule, index) => <li key={rule.title} data-stagger-item>
            <span>0{index + 1}</span>
            <div><h3>{rule.title}</h3><p>{rule.description}</p></div>
          </li>)}
        </ol>
      </div>
    </section>

    <section id="classification" className={styles.finalGrid} data-scroll-section>
      <span className={styles.sectionWatermark} data-parallax="-11" aria-hidden="true">FINISH</span>
      <div className={styles.sectionFrame}>
        <div className={styles.classification} data-reveal="feature" data-tilt>
          <span className={styles.trophy}><Trophy size={25} aria-hidden="true" /></span>
          <div><span className={styles.telemetryLabel}>OFFICIAL CLASSIFICATION</span><h2>The timing screen,<br /><em>when Race Control releases it.</em></h2><p>No preview ranking is presented as an official result. Authenticated drivers can view judged standings only when visibility is enabled.</p></div>
          <Link className="race-action" data-magnetic to="/results">VIEW DRIVER STANDINGS <ArrowUpRight size={17} aria-hidden="true" /></Link>
        </div>
        <div className={styles.startingLine} data-reveal="feature">
          <div className={styles.checks} aria-hidden="true" />
          <div><span>YOUR STARTING LINE IS WAITING</span><h2>Ready to make your move?</h2><p><MapPin size={14} aria-hidden="true" /> {event.university}</p></div>
          <Link className="race-action" data-magnetic to="/login">ENTER THE GRID <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  </div>
}
