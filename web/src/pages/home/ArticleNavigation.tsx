import { useEffect, useState } from 'react'

const sections = [
  { id: 'quickstart', label: '快速开始' },
  { id: 'comparison', label: '痛点、现状与解决方案' },
  { id: 'progressive-path', label: '渐进式任务路径' },
  { id: 'existing-projects', label: '改造现有项目' },
  { id: 'how-it-works', label: '工作原理' },
  { id: 'real-world-cases', label: '真实项目案例' },
] as const

export function ArticleNavigation(): React.JSX.Element {
  const [activeId, setActiveId] = useState<string>(sections[0].id)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top)[0]
      if (visible?.target.id) setActiveId(visible.target.id)
    }, { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.1] })

    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [])

  return (
    <nav className="home-article-index" aria-label="本文目录">
      <ol>
        {sections.map((section, index) => (
          <li key={section.id} className={activeId === section.id ? 'is-active' : undefined}>
            <a
              href={`#${section.id}`}
              aria-label={`第 ${index + 1} 章：${section.label}`}
              aria-current={activeId === section.id ? 'location' : undefined}
            >
              <i aria-hidden="true" />
              <span><b>{String(index + 1).padStart(2, '0')}</b>{section.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
