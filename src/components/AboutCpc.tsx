import { motion, useReducedMotion } from 'motion/react'
import { Braces, Route, TrendingUp } from 'lucide-react'
import { ClubLogo } from './RacingIdentity'
import { cpcDescription } from '../data/cpc'
import { event } from '../data/event'
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
    transition: { duration: reducedMotion ? 0 : 0.45 },
  } as const
  return <section id="about" className="cpc-about" aria-labelledby="cpc-about-heading">
    <div className="container">
      <motion.div className="cpc-about-heading" {...reveal}>
        <span className="cpc-section-label"><span aria-hidden="true" />BEYOND THE CIRCUIT / CPC</span>
        <h2 id="cpc-about-heading">BEYOND THE GRID</h2>
        <p>MEET CPC — COMPETITIVE PROGRAMMING CLUB</p>
      </motion.div>
      <div className="cpc-about-layout">
        <motion.figure className="cpc-about-identity" {...reveal}>
          <span className="cpc-identity-label">OUR COMMUNITY</span>
          <ClubLogo className="cpc-about-logo" />
          <figcaption>{event.university}</figcaption>
          <span className="cpc-identity-footer" aria-hidden="true"><span />BUILD / SOLVE / IMPROVE</span>
        </motion.figure>
        <motion.div className="cpc-about-description" {...reveal}>
          {cpcDescription.slice(0, 3).map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <blockquote className="cpc-philosophy"><span>OUR PHILOSOPHY</span><p>{cpcDescription[3]}</p></blockquote>
        </motion.div>
      </div>
      <div className="cpc-pillars" aria-label="Build, solve and improve">
        {pillars.map(({ title, icon: Icon, description }, index) => <motion.article className="cpc-pillar" key={title} {...reveal} transition={{ duration: reducedMotion ? 0 : 0.4, delay: reducedMotion ? 0 : index * 0.06 }}>
          <div className="cpc-pillar-top"><Icon size={25} aria-hidden="true" /><span>0{index + 1} / CPC</span></div>
          <h3>{title}</h3><p>{description}</p><span className="cpc-pillar-line" aria-hidden="true" />
        </motion.article>)}
      </div>
    </div>
  </section>
}
