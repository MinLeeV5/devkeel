import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { injectReview, resolveBundledAssetPath, validateHtml } from '../src/lib/inject-review.js'

describe('inject-review', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-inject-review-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  describe('injectReview', () => {
    it('should inject .md files as script tags', () => {
      const html = '<!DOCTYPE html><html><body><!-- INJECT:artifacts --></body></html>'
      const htmlPath = path.join(tmpDir, 'human-review.html')
      fs.writeFileSync(htmlPath, html)
      fs.writeFileSync(path.join(tmpDir, 'brainstorm.md'), '# Brainstorm\nHello')
      fs.writeFileSync(path.join(tmpDir, 'tasks.md'), '- [ ] Task 1')

      const result = injectReview(htmlPath)

      expect(result.errors).toHaveLength(0)
      expect(result.artifactsInjected).toContain('brainstorm')
      expect(result.artifactsInjected).toContain('tasks')

      const output = fs.readFileSync(htmlPath, 'utf-8')
      expect(output).toContain('data-artifact="brainstorm"')
      expect(output).toContain('data-artifact="tasks"')
      expect(output).toContain('# Brainstorm')
    })

    it('should handle specs directory by merging spec files', () => {
      const html = '<!DOCTYPE html><html><body><!-- INJECT:artifacts --></body></html>'
      const htmlPath = path.join(tmpDir, 'human-review.html')
      fs.writeFileSync(htmlPath, html)
      fs.mkdirSync(path.join(tmpDir, 'specs', 'my-cap'), { recursive: true })
      fs.writeFileSync(path.join(tmpDir, 'specs', 'my-cap', 'spec.md'), '### Requirement: Test')

      const result = injectReview(htmlPath)

      expect(result.artifactsInjected).toContain('specs')
      const output = fs.readFileSync(htmlPath, 'utf-8')
      expect(output).toContain('data-artifact="specs"')
      expect(output).toContain('### Requirement: Test')
    })

    it('should escape </script> in .md content', () => {
      const html = '<!DOCTYPE html><html><body><!-- INJECT:artifacts --></body></html>'
      const htmlPath = path.join(tmpDir, 'human-review.html')
      fs.writeFileSync(htmlPath, html)
      fs.writeFileSync(path.join(tmpDir, 'brainstorm.md'), 'Code: </script> end')

      const result = injectReview(htmlPath)

      expect(result.errors).toHaveLength(0)
      const output = fs.readFileSync(htmlPath, 'utf-8')
      expect(output).not.toContain('Code: </script> end')
      expect(output).toContain('<\\/script>')
    })

    it('should escape <script in .md content to avoid validation false-positive', () => {
      const html = '<!DOCTYPE html><html><body><!-- INJECT:artifacts --></body></html>'
      const htmlPath = path.join(tmpDir, 'human-review.html')
      fs.writeFileSync(htmlPath, html)
      fs.writeFileSync(path.join(tmpDir, 'explore.md'), 'Injects as `<script type="text/markdown">`.')

      const result = injectReview(htmlPath)

      expect(result.errors).toHaveLength(0)
      const output = fs.readFileSync(htmlPath, 'utf-8')
      expect(output).toContain('<\\script')
    })

    it('should inject bundled CSS and JS when placeholders exist outside project root', () => {
      const html = '<!DOCTYPE html><html><head><!-- INJECT:css --></head><body><!-- INJECT:js --></body></html>'
      const htmlPath = path.join(tmpDir, 'human-review.html')
      fs.writeFileSync(htmlPath, html)

      const result = injectReview(htmlPath)

      expect(result.errors).toHaveLength(0)
      expect(result.cssInjected).toBe(true)
      expect(result.jsInjected).toBe(true)

      const output = fs.readFileSync(htmlPath, 'utf-8')
      expect(output).toContain('artifact-viewer')
      expect(output).toContain('switchArtifactTab')
    })

    it('should return error when css placeholder exists but css asset is missing', () => {
      const html = '<!DOCTYPE html><html><head><!-- INJECT:css --></head><body></body></html>'
      const htmlPath = path.join(tmpDir, 'human-review.html')
      fs.writeFileSync(htmlPath, html)

      const result = injectReview(htmlPath, path.join(tmpDir, 'missing.css'))

      expect(result.errors.length).toBeGreaterThan(0)

      const output = fs.readFileSync(htmlPath, 'utf-8')
      expect(output).toContain('<!-- INJECT:css -->')
      expect(output).not.toContain('<!-- BEGIN:css -->')
    })

    it('should inject all markdown files in the change directory', () => {
      const html = '<!DOCTYPE html><html><body><!-- INJECT:artifacts --></body></html>'
      const htmlPath = path.join(tmpDir, 'human-review.html')
      fs.writeFileSync(htmlPath, html)
      fs.writeFileSync(path.join(tmpDir, 'brainstorm.md'), '# Brainstorm')
      fs.writeFileSync(path.join(tmpDir, 'plan.md'), '# Plan')

      const result = injectReview(htmlPath)

      expect(result.errors).toHaveLength(0)
      expect(result.artifactsInjected).toContain('brainstorm')
      expect(result.artifactsInjected).toContain('plan')

      const output = fs.readFileSync(htmlPath, 'utf-8')
      expect(output).toContain('data-artifact="brainstorm"')
      expect(output).toContain('data-artifact="plan"')
    })

    it('should be idempotent', () => {
      const html = '<!DOCTYPE html><html><body><!-- INJECT:artifacts --></body></html>'
      const htmlPath = path.join(tmpDir, 'human-review.html')
      fs.writeFileSync(htmlPath, html)
      fs.writeFileSync(path.join(tmpDir, 'brainstorm.md'), '# Hello')

      injectReview(htmlPath)
      const first = fs.readFileSync(htmlPath, 'utf-8')

      injectReview(htmlPath)
      const second = fs.readFileSync(htmlPath, 'utf-8')

      expect(first).toBe(second)
    })

    it('should inject CSS when INJECT:css placeholder exists', () => {
      const html = '<!DOCTYPE html><html><head><!-- INJECT:css --></head><body></body></html>'
      const htmlPath = path.join(tmpDir, 'human-review.html')
      fs.writeFileSync(htmlPath, html)

      const cssPath = path.join(tmpDir, 'test.css')
      fs.writeFileSync(cssPath, 'body { color: red; }')

      const result = injectReview(htmlPath, cssPath)

      expect(result.cssInjected).toBe(true)
      const output = fs.readFileSync(htmlPath, 'utf-8')
      expect(output).toContain('body { color: red; }')
      expect(output).toContain('<!-- BEGIN:css -->')
    })

    it('should not break HTML when no .md files exist', () => {
      const html = '<!DOCTYPE html><html><body><!-- INJECT:artifacts --></body></html>'
      const htmlPath = path.join(tmpDir, 'human-review.html')
      fs.writeFileSync(htmlPath, html)

      const result = injectReview(htmlPath)

      expect(result.errors).toHaveLength(0)
      expect(result.artifactsInjected).toHaveLength(0)
      const output = fs.readFileSync(htmlPath, 'utf-8')
      expect(output).toContain('<!DOCTYPE html>')
      expect(output).toContain('</html>')
    })

    it('should return error for non-existent html file', () => {
      const result = injectReview(path.join(tmpDir, 'nonexistent.html'))
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('validateHtml', () => {
    it('should pass for valid HTML', () => {
      const html = '<!DOCTYPE html><html><body><script></script></body></html>'
      expect(validateHtml(html)).toHaveLength(0)
    })

    it('should detect missing DOCTYPE', () => {
      const html = '<html><body></body></html>'
      const errors = validateHtml(html)
      expect(errors.some(e => e.includes('DOCTYPE'))).toBe(true)
    })

    it('should detect unclosed script tags', () => {
      const html = '<!DOCTYPE html><html><body><script><script></script></body></html>'
      const errors = validateHtml(html)
      expect(errors.some(e => e.includes('script'))).toBe(true)
    })

    it('should not false-positive on escaped script tags in markdown content', () => {
      const html = '<!DOCTYPE html><html><body><script type="text/markdown" data-artifact="explore">\n`inject-review` injects as `<\\script type="text/markdown">`.\n</script></body></html>'
      expect(validateHtml(html)).toHaveLength(0)
    })
  })

  describe('resolveBundledAssetPath', () => {
    it('should resolve bundled asset from src module layout', () => {
      const pkgDir = path.join(tmpDir, 'pkg-src')
      const modulePath = path.join(pkgDir, 'src', 'lib', 'inject-review.js')
      const assetPath = path.join(pkgDir, 'web', 'human-review.css')
      fs.mkdirSync(path.dirname(modulePath), { recursive: true })
      fs.mkdirSync(path.dirname(assetPath), { recursive: true })
      fs.writeFileSync(assetPath, 'body {}')

      const resolved = resolveBundledAssetPath('human-review.css', `file://${modulePath}`)

      expect(resolved).toBe(assetPath)
    })

    it('should resolve bundled asset from dist module layout', () => {
      const pkgDir = path.join(tmpDir, 'pkg-dist')
      const modulePath = path.join(pkgDir, 'dist', 'index.js')
      const assetPath = path.join(pkgDir, 'web', 'human-review.css')
      fs.mkdirSync(path.dirname(modulePath), { recursive: true })
      fs.mkdirSync(path.dirname(assetPath), { recursive: true })
      fs.writeFileSync(assetPath, 'body {}')

      const resolved = resolveBundledAssetPath('human-review.css', `file://${modulePath}`)

      expect(resolved).toBe(assetPath)
    })
  })
})
