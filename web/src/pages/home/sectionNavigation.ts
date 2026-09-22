const REQUIRED_STABLE_FRAMES = 12
const MAX_FRAME_ATTEMPTS = 120

export function scrollToSectionAfterLayout(sectionId: string): () => void {
  let animationFrame = 0
  let cancelled = false
  let previousTop: number | undefined
  let stableFrames = 0
  let attempts = 0

  const checkLayout = (): void => {
    if (cancelled) return

    const target = document.getElementById(sectionId)
    attempts += 1
    if (!target) {
      if (attempts < MAX_FRAME_ATTEMPTS) animationFrame = window.requestAnimationFrame(checkLayout)
      return
    }

    const targetTop = target.getBoundingClientRect().top + window.scrollY
    const hasSectionStyles = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) > 0
    stableFrames = hasSectionStyles && previousTop !== undefined && Math.abs(targetTop - previousTop) < 1
      ? stableFrames + 1
      : 0
    previousTop = targetTop

    if ((hasSectionStyles && stableFrames >= REQUIRED_STABLE_FRAMES) || attempts >= MAX_FRAME_ATTEMPTS) {
      target.scrollIntoView({ behavior: 'instant', block: 'start' })
      return
    }
    animationFrame = window.requestAnimationFrame(checkLayout)
  }

  animationFrame = window.requestAnimationFrame(checkLayout)
  return () => {
    cancelled = true
    window.cancelAnimationFrame(animationFrame)
  }
}
