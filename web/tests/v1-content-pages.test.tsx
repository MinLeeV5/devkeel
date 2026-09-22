// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { V1ArchitecturePage } from '../src/pages/v1-architecture'
import { V1BestPracticesPage } from '../src/pages/v1-best-practices'
import { V1WorkflowPage } from '../src/pages/v1-workflow'

afterEach(cleanup)

describe('V1 templates 1.3.1 content pages', () => {
  it('restores the complete Spec, Code, and Growth workflow', () => {
    const { container } = render(<V1WorkflowPage />)

    expect(container.querySelector('[data-template-version="1.3.1"]')).toBeTruthy()
    expect(container.textContent).toContain('从需求到交付完整闭环')
    expect(container.textContent).toContain('Spec — 想清楚再动手')
    expect(container.textContent).toContain('Code — 把人类工程实践自动化')
    expect(container.textContent).toContain('Growth — 沉淀而非遗忘')
    expect(screen.getByRole('link', { name: /技术分享/ }).getAttribute('href')).toBe('./sharing.html')
    expect(screen.getByRole('link', { name: '升级到 V2' }).getAttribute('href')).toBe('../index.html')
  })

  it('restores the architecture and CLI reference', () => {
    const { container } = render(<V1ArchitecturePage />)

    expect(container.querySelector('[data-template-version="1.3.1"]')).toBeTruthy()
    expect(container.textContent).toContain('三个目录，各司其职')
    expect(container.textContent).toContain('两层短路，精准分流')
    expect(container.textContent).toContain('devkeel doctor')
    expect(screen.getAllByRole('link', { name: '工作流' })[0]?.getAttribute('href')).toBe('./workflow.html')
    expect(screen.getByRole('link', { name: '升级到 V2' }).getAttribute('href')).toBe('../index.html')
  })

  it('restores the worktree and mobile best-practices guide', () => {
    const { container } = render(<V1BestPracticesPage />)

    expect(container.querySelector('[data-template-version="1.3.1"]')).toBeTruthy()
    expect(screen.getByRole('heading', { name: '最佳实践' })).toBeTruthy()
    expect(container.textContent).toContain('隔离环境 × 随时随地')
    expect(container.textContent).toContain('管理 Worktree')
    expect(screen.getByRole('link', { name: /技术分享/ }).getAttribute('href')).toBe('./sharing.html')
    expect(screen.getByRole('link', { name: '升级到 V2' }).getAttribute('href')).toBe('../index.html')
  })
})
