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
  return <section id="about" className={`cpc-about ${styles.section}`} data-scroll-section aria-labelledby="cpc-about-heading">
    <span className={styles.watermark} data-parallax="18" aria-hidden="true">CPC</span>
    <div className={styles.frame}>
      <div className={`cpc-about-heading ${styles.heading}`} data-reveal="heading">
        <span className={styles.label}><span aria-hidden="true" />BEYOND THE CIRCUIT / CPC</span>
        <h2 id="cpc-about-heading">BEYOND THE GRID</h2>
        <p>MEET CPC — COMPETITIVE PROGRAMMING CLUB</p>
      </div>
      <div className={styles.layout}>
        <figure className={styles.identity} data-reveal="card" data-parallax="-7" data-tilt>
          <span className={styles.identityLabel}>OUR COMMUNITY</span>
          <ClubLogo className="cpc-about-logo" />
          <figcaption>{event.university}</figcaption>
          <span className={styles.identityFooter} aria-hidden="true"><span />BUILD / SOLVE / IMPROVE</span>
        </figure>
        <div className={`cpc-about-description ${styles.description}`} data-reveal="copy" data-parallax="5">
          {cpcDescription.slice(0, 3).map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <blockquote className={`cpc-philosophy ${styles.philosophy}`}><span>OUR PHILOSOPHY</span><p>{cpcDescription[3]}</p></blockquote>
        </div>
      </div>
      <ul className={styles.pillars} data-stagger role="list" aria-label="CPC principles">
        {pillars.map(({ title, icon: Icon, description }, index) => <li key={title} data-stagger-item><article className={`cpc-pillar ${styles.pillar}`} data-tilt>
          <div className={styles.pillarTop}><Icon size={24} aria-hidden="true" /><span>0{index + 1} / CPC</span></div>
          <h3>{title}</h3><p>{description}</p><span className={styles.pillarLine} aria-hidden="true" />
        </article></li>)}
      </ul>
    </div>
  </section>
}
