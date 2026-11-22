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
  return <section id="about" className="cpc-about" aria-labelledby="cpc-about-heading">
    <div className="container">
      <div className="cpc-about-heading" data-home-reveal="">
        <span className="cpc-section-label"><span aria-hidden="true" />BEYOND THE CIRCUIT / CPC</span>
        <h2 id="cpc-about-heading">BEYOND THE GRID</h2>
        <p>MEET CPC — COMPETITIVE PROGRAMMING CLUB</p>
      </div>
      <div className="cpc-about-layout">
        <figure className="cpc-about-identity" data-home-reveal="">
          <span className="cpc-identity-label">OUR COMMUNITY</span>
          <ClubLogo className="cpc-about-logo" />
          <figcaption>{event.university}</figcaption>
          <span className="cpc-identity-footer" aria-hidden="true"><span />BUILD / SOLVE / IMPROVE</span>
        </figure>
        <div className="cpc-about-description" data-home-reveal="">
          {cpcDescription.slice(0, 3).map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          <blockquote className="cpc-philosophy"><span>OUR PHILOSOPHY</span><p>{cpcDescription[3]}</p></blockquote>
        </div>
      </div>
      <div className="cpc-pillars" aria-label="Build, solve and improve">
        {pillars.map(({ title, icon: Icon, description }, index) => <article className="cpc-pillar" key={title} data-home-reveal="">
          <div className="cpc-pillar-top"><Icon size={25} aria-hidden="true" /><span>0{index + 1} / CPC</span></div>
          <h3>{title}</h3><p>{description}</p><span className="cpc-pillar-line" aria-hidden="true" />
        </article>)}
      </div>
    </div>
  </section>
}
