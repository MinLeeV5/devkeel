import { useEffect } from 'react'

import { MARKETING_FONT_STYLESHEET, MarketingNav } from '../components/MarketingNav'
import { PageFrame } from '../components/PageFrame'
import { ArticleNavigation } from './home/ArticleNavigation'
import { CaseStudiesSection } from './home/CaseStudiesSection'
import { CommunitySection } from './home/CommunitySection'
import { ComparisonSection } from './home/ComparisonSection'
import { ExistingProjectSection } from './home/ExistingProjectSection'
import { HomeHero } from './home/HomeHero'
import { HowItWorksSection } from './home/HowItWorksSection'
import { MarketingFooter } from './home/MarketingFooter'
import { ProgressivePathSection } from './home/ProgressivePathSection'
import { QuickStartSection } from './home/QuickStartSection'
import { scrollToSectionAfterLayout } from './home/sectionNavigation'
import './home/home.css'

const externalStyles = [MARKETING_FONT_STYLESHEET]

export function HomePage(): React.JSX.Element {
  useEffect(() => {
    const sectionId = window.location.hash.slice(1)
    if (!sectionId) return
    return scrollToSectionAfterLayout(sectionId)
  }, [])

  return (
    <PageFrame
      pageId="home"
      title="DevKeel V2 — 让现有项目成为 Agent-ready 工程环境"
      description="DevKeel V2 将项目知识、专业能力与反馈回路沉淀进仓库，并让每个任务走最短但足够可靠的交付路径。"
      externalStyles={externalStyles}
    >
      <div className="home-page">
        <MarketingNav activePage="home" />
        <HomeHero />
        <div className="home-article-shell">
          <ArticleNavigation />
          <article className="home-article" aria-label="DevKeel V2 介绍">
            <QuickStartSection />
            <ComparisonSection />
            <ProgressivePathSection />
            <ExistingProjectSection />
            <HowItWorksSection />
            <CaseStudiesSection />
          </article>
        </div>
        <CommunitySection />
        <MarketingFooter />
      </div>
    </PageFrame>
  )
}
