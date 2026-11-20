import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
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
import styles from './LandingPage.module.css'

const raceStages = [
  {
    icon: ShieldCheck,
    code: 'SCRUTINEERING',
    title: 'Pre-race inspection',
    text: 'Confirm driver identity, camera, fullscreen and the competition rulebook before entering the lobby.',
  },
  {
    icon: Radio,
    code: 'GRID HOLD',
    title: 'Await Race Control',
    text: 'Checked-in drivers remain in the lobby until the organizer-controlled contest state turns live.',
  },
  {
    icon: Gauge,
    code: 'ROUND 01',
    title: 'Code at race pace',
    text: 'Solve released problems, run public tests and submit to the judging service before the chequered flag.',
  },
] as const

const gridRoute = [
  { icon: Terminal, title: 'Claim your driver seat', text: 'Sign in with the Driver ID assigned by CPC Race Control.' },
  { icon: Check, title: 'Clear pre-race inspection', text: 'Complete the camera, fullscreen and rulebook checks.' },
  { icon: Flag, title: 'Hold for the green light', text: 'Enter the lobby and wait for the official contest state.' },
] as const

export function LandingContent() {
  const reducedMotion = useReducedMotion()
  const reveal = (delay = 0) => ({
    initial: reducedMotion ? false : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: .18 },
    transition: { duration: reducedMotion ? 0 : .48, delay },
  } as const)

  return <>
    <AboutCpc />

    <motion.section className={styles.eventRail} aria-label="Event timing summary" {...reveal()}>
      <div className={styles.sectionFrame}>
        <motion.div className={styles.railDate} {...reveal()}><CalendarDays size={22} /><span><small>MARK YOUR CALENDAR</small><strong>{event.dateLabel.toUpperCase()}</strong></span></motion.div>
        <motion.div className={styles.railStatus} {...reveal(.05)}><span aria-hidden="true" /><div><small>SCHEDULE STATUS</small><strong>RACE START TBA</strong></div></motion.div>
        <motion.div className={styles.railCountdown} {...reveal(.1)}><span><small>EVENT DATE IN</small><em>Race start TBA</em></span><Countdown compact /></motion.div>
      </div>
    </motion.section>

    <motion.section id="schedule" className={styles.weekend} {...reveal()}>
      <div className={styles.sectionFrame}>
        <div className={styles.sectionHeading}>
          <div><span className={styles.telemetryLabel}>RACE FORMAT / DRIVER FLOW</span><h2>From inspection<br />to <em>chequered flag.</em></h2></div>
          <p>One controlled competition flow. Every state shown here maps to the actual participant journey.</p>
        </div>
        <div className={styles.weekendGrid}>
          <motion.aside className={styles.briefing} aria-label="Event format briefing" {...reveal(.04)}>
            <span className={styles.briefingStatus}><i /> EVENT BRIEFING</span>
            <dl>
              <div><dt>Date</dt><dd>{event.dateLabel.toUpperCase()}</dd></div>
              <div><dt>Round</dt><dd>ROUND 01</dd></div>
              <div><dt>Timezone</dt><dd>IST</dd></div>
              <div><dt>Race start</dt><dd>TO BE ANNOUNCED</dd></div>
            </dl>
            <p><Radio size={15} /> Timing, problem release and results visibility remain under CPC Race Control.</p>
          </motion.aside>
          <ol className={styles.stageList} role="list">
            {raceStages.map(({ icon: Icon, code, title, text }, index) => <motion.li key={title} {...reveal(index * .06)}>
              <span className={styles.stageNumber}>0{index + 1}</span>
              <span className={styles.stageIcon}><Icon size={19} /></span>
              <div><small>{code}</small><h3>{title}</h3><p>{text}</p></div>
            </motion.li>)}
          </ol>
        </div>
      </div>
    </motion.section>

    <section className={styles.driverRoute}>
      <div className={styles.sectionFrame}>
        <motion.div className={styles.routeIntro} {...reveal()}>
          <span className={styles.telemetryLabel}>YOUR ROUTE TO THE GRID</span>
          <h2>Three checks.<br /><em>One starting line.</em></h2>
          <p>Authentication, inspection and race state remain connected from the first login to the final submission.</p>
          <Link className="race-action" to="/login">GET RACE-READY <ArrowRight size={16} /></Link>
        </motion.div>
        <ol className={styles.routeList} role="list">
          {gridRoute.map(({ icon: Icon, title, text }, index) => <motion.li key={title} {...reveal(index * .06)}>
            <span className={styles.routeNumber}>0{index + 1}</span>
            <Icon size={21} />
            <div><h3>{title}</h3><p>{text}</p></div>
          </motion.li>)}
        </ol>
      </div>
    </section>

    <motion.section id="rules" className={styles.rules} {...reveal()}>
      <div className={styles.sectionFrame}>
        <motion.div className={styles.rulesIntro} {...reveal()}>
          <span className={styles.telemetryLabel}>SPORTING CODE / PREVIEW</span>
          <h2>Fair play.<br /><em>Full throttle.</em></h2>
          <p>Great races start with a level playing field.</p>
          <StatusIndicator tone="caution">Preview guidelines</StatusIndicator>
          <small>Final rules are subject to CPC Club confirmation.</small>
        </motion.div>
        <ol className={styles.rulesList} role="list">
          {rules.map((rule, index) => <motion.li key={rule.title} {...reveal(index * .045)}>
            <span>0{index + 1}</span>
            <div><h3>{rule.title}</h3><p>{rule.description}</p></div>
          </motion.li>)}
        </ol>
      </div>
    </motion.section>

    <section className={styles.finalGrid}>
      <div className={styles.sectionFrame}>
        <motion.div className={styles.classification} {...reveal()}>
          <span className={styles.trophy}><Trophy size={25} /></span>
          <div><span className={styles.telemetryLabel}>OFFICIAL CLASSIFICATION</span><h2>The timing screen,<br /><em>when Race Control releases it.</em></h2><p>No preview ranking is presented as an official result. Authenticated drivers can view judged standings only when visibility is enabled.</p></div>
          <Link className="race-action" to="/results">VIEW DRIVER STANDINGS <ArrowUpRight size={17} /></Link>
        </motion.div>
        <motion.div className={styles.startingLine} {...reveal(.08)}>
          <div className={styles.checks} aria-hidden="true" />
          <div><span>YOUR STARTING LINE IS WAITING</span><h2>Ready to make your move?</h2><p><MapPin size={14} /> {event.university}</p></div>
          <Link className="race-action" to="/login">ENTER THE GRID <ArrowRight size={18} /></Link>
        </motion.div>
      </div>
    </section>
  </>
}
