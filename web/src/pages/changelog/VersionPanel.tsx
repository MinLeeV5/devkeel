import type { VersionCatalogStream, VersionEntry, VersionStream } from '../../lib/version-catalog'
import {
  formatReleaseDateLabel,
  formatVersionLabel,
  getVersionSectionId,
} from '../../lib/version-catalog'
import { InlineMarkdown } from './InlineMarkdown'

interface VersionPanelProps {
  catalog: VersionCatalogStream
  stream: VersionStream
}

export function VersionPanel({ catalog, stream }: VersionPanelProps): React.JSX.Element {
  const currentEntries = catalog.entries.filter((entry) => !entry.archived)
  const archivedEntries = catalog.entries.filter((entry) => entry.archived)

  return (
    <>
      {currentEntries.map((entry) => (
        <VersionSection key={getVersionSectionId(stream, entry.versions)} entry={entry} latest={catalog.latest} stream={stream} />
      ))}
      {archivedEntries.length > 0 ? (
        <div className="history-archive">
          <details>
            <summary>📚 查看历史版本</summary>
            {archivedEntries.map((entry) => (
              <VersionSection key={getVersionSectionId(stream, entry.versions)} entry={entry} latest={catalog.latest} stream={stream} />
            ))}
          </details>
        </div>
      ) : null}
    </>
  )
}

interface VersionSectionProps {
  entry: VersionEntry
  latest: string
  stream: VersionStream
}

function VersionSection({ entry, latest, stream }: VersionSectionProps): React.JSX.Element {
  const isLatest = entry.versions.includes(latest)
  const badgeClass = isLatest
    ? 'version-badge-latest'
    : entry.archived
      ? 'version-badge-legacy'
      : 'version-badge-minor'

  return (
    <section className="version-section" id={getVersionSectionId(stream, entry.versions)}>
      <div className="version-header">
        <span className={`version-badge ${badgeClass}`}>{formatVersionLabel(entry.versions)}</span>
        <span className="version-date">{formatReleaseDateLabel(entry.releasedAt)}</span>
        <span className="version-title"><InlineMarkdown>{entry.title}</InlineMarkdown></span>
      </div>
      <div className="changes">
        {entry.groups.map((group, groupIndex) => (
          <div className="change-group" key={`${group.type}-${group.label}-${groupIndex}`}>
            <h3><span className={`change-type type-${group.type}`}>{group.type}</span>{group.label}</h3>
            <ul className="change-list">
              {group.items.map((item, itemIndex) => (
                <li key={`${item.name}-${itemIndex}`}>
                  <span className="change-name"><InlineMarkdown>{item.name}</InlineMarkdown></span>
                  <span aria-hidden="true"> — </span>
                  <InlineMarkdown>{item.description}</InlineMarkdown>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
