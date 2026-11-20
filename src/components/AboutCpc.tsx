import { motion, useReducedMotion } from 'motion/react'
import { Braces, Route, TrendingUp } from 'lucide-react'
import { ClubLogo } from './RacingIdentity'
import { cpcDescription } from '../data/cpc'
import { event } from '../data/event'
import styles from './AboutCpc.module.css'
const pillars = [
  { title: 'BUILD', icon: Braces, description: 'Strengthen programming fundamentals and develop technical skills through hands-on learning.' },
  { title: 'SOLVE', icon: Route, description: 'Explore algorithms, take on coding challenges, and approach problems with confidence.' },
  { title: 'IMPROVE', icon: TrendingUp, description: 'Grow through consistent practice, collaboration, and learning from each challenge.' },
]
export function AboutCpc() {
  const reducedMotion = useReducedMotion()
  const reveal = {
    initial: reducedMotion ? false : { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.12 },
    transition: { duration: reducedMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] },
  } as const
  return <section id="about" className={`cpc-about ${styles.section}`} aria-labelledby="cpc-about-heading">
    <div className={styles.frame}>
      <motion.div className={`cpc-about-heading ${styles.heading}`} {...reveal}>
        <span className={styles.label}><span aria-hidden="true" />BEYOND THE CIRCUIT / CPC</span>
        <h2 id="cpc-about-heading">BEYOND THE GRID</h2>
        <p>MEET CPC — COMPETITIVE PROGRAMMING CLUB</p>
      </motion.div>
      <div className={styles.layout}>
        <motion.figure className={styles.identity} {...reveal}>
          <span className={styles.identityLabel}>OUR COMMUNITY</span>
          <ClubLogo className="cpc-about-logo" />
          <figcaption>{event.university}</figcaption>
          <span className={styles.identityFooter} aria-hidden="true"><span />BUILD / SOLVE / IMPROVE</span>
        </motion.figure>
        <motion.div className={`cpc-about-description ${styles.description}`} {...reveal}>
          {cpcDescription.slice(0, 3).map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <blockquote className={`cpc-philosophy ${styles.philosophy}`}><span>OUR PHILOSOPHY</span><p>{cpcDescription[3]}</p></blockquote>
        </motion.div>
      </div>
      <ul className={styles.pillars} role="list" aria-label="CPC principles">
        {pillars.map(({ title, icon: Icon, description }, index) => <li key={title}><motion.article className={`cpc-pillar ${styles.pillar}`} {...reveal} transition={{ duration: reducedMotion ? 0 : .42, delay: reducedMotion ? 0 : index * .07 }}>
          <div className={styles.pillarTop}><Icon size={24} aria-hidden="true" /><span>0{index + 1} / CPC</span></div>
          <h3>{title}</h3><p>{description}</p><span className={styles.pillarLine} aria-hidden="true" />
        </motion.article></li>)}
      </ul>
    </div>
  </section>
}
