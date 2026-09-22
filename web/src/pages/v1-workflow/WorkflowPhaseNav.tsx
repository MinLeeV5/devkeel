import { useEffect } from 'react'

import { usePageUiStore, type WorkflowPhase } from '../../stores/page-ui-store'

const phases: Array<{ id: WorkflowPhase; label: string; subLabel: string }> = [
  { id: 'phase-spec', label: 'Spec', subLabel: '需求' },
  { id: 'phase-code', label: 'Code', subLabel: '编码' },
  { id: 'phase-growth', label: 'Growth', subLabel: '沉淀' },
]

export function WorkflowPhaseNav(): React.JSX.Element {
  const activeWorkflowPhase = usePageUiStore((state) => state.activeWorkflowPhase)
  const setActiveWorkflowPhase = usePageUiStore((state) => state.setActiveWorkflowPhase)
  const activeIndex = Math.max(0, phases.findIndex((phase) => phase.id === activeWorkflowPhase))

  useEffect(() => {
    const onScroll = (): void => {
      let current = phases[0]?.id ?? 'phase-spec'

      for (const phase of phases) {
        const element = document.getElementById(phase.id)
        if (element && element.getBoundingClientRect().top < window.innerHeight * 0.45) {
          current = phase.id
        }
      }

      if (usePageUiStore.getState().activeWorkflowPhase !== current) {
        usePageUiStore.getState().setActiveWorkflowPhase(current)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navigateToPhase = (phase: WorkflowPhase): void => {
    setActiveWorkflowPhase(phase)
    document.getElementById(phase)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="step-indicator" id="step-indicator">
      <div className="step-bar">
        {phases.map((phase, index) => (
          <FragmentedPhaseNode key={phase.id} active={index <= activeIndex} showLine={index < phases.length - 1} lineActive={index < activeIndex} number={index + 1} onSelect={() => navigateToPhase(phase.id)} />
        ))}
      </div>
      <div className="step-labels">
        {phases.map((phase, index) => (
          <button key={phase.id} type="button" className={`step-label${index === activeIndex ? ' active' : ''}`} onClick={() => navigateToPhase(phase.id)}>
            {phase.label}<br /><small style={{ fontWeight: 400, opacity: '.7' }}>{phase.subLabel}</small>
          </button>
        ))}
      </div>
    </div>
  )
}

interface FragmentedPhaseNodeProps {
  active: boolean
  lineActive: boolean
  number: number
  onSelect: () => void
  showLine: boolean
}

function FragmentedPhaseNode({ active, lineActive, number, onSelect, showLine }: FragmentedPhaseNodeProps): React.JSX.Element {
  return (
    <>
      <button type="button" className={`step-node${active ? ' active' : ''}`} onClick={onSelect}>{number}</button>
      {showLine ? <div className={`step-line${lineActive ? ' active' : ''}`} /> : null}
    </>
  )
}
