interface SectionHeadingProps {
  eyebrow: string
  summary: string
  title: string
}

export function SectionHeading({ eyebrow, summary, title }: SectionHeadingProps): React.JSX.Element {
  return (
    <div className="home-section-heading">
      <span>{eyebrow}</span>
      <h2>{title}</h2>
      <p>{summary}</p>
    </div>
  )
}
