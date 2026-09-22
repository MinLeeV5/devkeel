import { useState } from 'react'

import { OnboardingFlowDiagram } from './ArchitectureDiagrams'

const installPrompt = '按照 https://raw.githubusercontent.com/MinLeeV5/devkeel/HEAD/web/public/install.md 完成项目初始化'
type CopyState = 'copied' | 'failed' | 'idle'

export function QuickStartSection(): React.JSX.Element {
  const [copyState, setCopyState] = useState<CopyState>('idle')

  async function copyPrompt(): Promise<void> {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable')
      await navigator.clipboard.writeText(installPrompt)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1800)
    } catch {
      setCopyState('failed')
    }
  }

  return (
    <section id="quickstart" className="home-section quickstart-section">
      <div className="home-section-heading">
        <span>01 / 快速开始</span>
        <h2>把安装文档交给你的 Coding Agent</h2>
        <p>复制一句提示完成安装与自检；随后依次生成项目知识、补齐验证反馈，每个关键写入点都由你确认。</p>
      </div>

      <div className="agent-start-panel">
        <div className="start-panel-header">
          <span><i aria-hidden="true" /> 推荐 · Agent 执行</span>
          <button type="button" aria-live="polite" onClick={() => void copyPrompt()}>
            {copyState === 'copied' ? '已复制' : copyState === 'failed' ? '复制失败，请手动选择' : '复制提示'}
          </button>
        </div>
        <div className="start-prompt mono">
          <span aria-hidden="true">›</span>
          <p>按照 <a href="https://raw.githubusercontent.com/MinLeeV5/devkeel/HEAD/web/public/install.md" target="_blank" rel="noopener noreferrer">https://raw.githubusercontent.com/MinLeeV5/devkeel/HEAD/web/public/install.md</a> 完成项目初始化</p>
        </div>
        <div className="agent-start-facts">
          <span>自动推断项目名称与类型</span>
          <span>生成跨平台项目入口</span>
          <span>运行 doctor 检查结果</span>
          <span>写入与提交仍需明确授权</span>
        </div>
      </div>

      <details className="manual-start">
        <summary>偏好手动操作？查看 CLI 初始化步骤</summary>
        <div className="manual-start-content">
          <p>需要 Node.js ≥ 20.19.0。在项目根目录执行：</p>
          <pre><code>{`# 初始化并检查
npx devkeel@latest init
npx devkeel@latest doctor`}</code></pre>
        </div>
      </details>

      <OnboardingFlowDiagram />
    </section>
  )
}
