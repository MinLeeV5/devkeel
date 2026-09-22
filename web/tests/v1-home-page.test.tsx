// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { V1HomePage } from '../src/pages/v1-home'

afterEach(cleanup)

describe('V1 templates 1.3.1 home page', () => {
  it('renders the frozen templates 1.3.1 project-knowledge homepage', () => {
    const { container } = render(<V1HomePage />)

    expect(container.querySelector('[data-template-version="1.3.1"]')).toBeTruthy()
    expect(screen.getByRole('heading', { level: 1 }).textContent).toContain('编排 · 规范 · 沉淀')
    expect(screen.getByText(/项目知识框架 = \.harness\/ \+ AGENTS\.md \+ openspec\//)).toBeTruthy()
    expect(container.textContent).not.toContain('devkeel v0.1')
  })

  it('keeps the templates 1.3.1 content navigation inside /v1', () => {
    const { container } = render(<V1HomePage />)

    expect(screen.getByRole('link', { name: 'DevKeel 首页' }).getAttribute('href')).toBe('./index.html')
    expect(screen.getByRole('link', { name: /技术分享/ }).getAttribute('href')).toBe('./sharing.html')
    expect(screen.getAllByRole('link', { name: '工作流' })[0]?.getAttribute('href')).toBe('./workflow.html')
    expect(screen.getAllByRole('link', { name: '架构设计' })[0]?.getAttribute('href')).toBe('./architecture.html')
    expect(screen.getAllByRole('link', { name: '最佳实践' })[0]?.getAttribute('href')).toBe('./best-practices.html')
    expect(screen.getByRole('link', { name: '升级到 V2' }).getAttribute('href')).toBe('../index.html')
    expect(screen.getByRole('link', { name: '交流与反馈' }).getAttribute('href')).toBe('https://github.com/MinLeeV5/devkeel/issues')
  })
})
