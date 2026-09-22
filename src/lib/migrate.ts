import fs from 'node:fs'
import path from 'node:path'

export function migrateKnowledgeAssets(sources: string[], targetRoot: string): { count: number; files: string[] } {
  const migratedDir = path.join(targetRoot, 'openspec', 'archive', 'migrated')
  fs.mkdirSync(migratedDir, { recursive: true })

  const migratedFiles: string[] = []

  for (const source of sources) {
    if (!fs.existsSync(source)) continue

    const stat = fs.statSync(source)
    if (stat.isDirectory()) {
      const files = fs.readdirSync(source, { recursive: true, encoding: 'utf-8' })
      for (const file of files) {
        const srcPath = path.join(source, file)
        if (!fs.statSync(srcPath).isFile()) continue
        const destPath = path.join(migratedDir, file)
        fs.mkdirSync(path.dirname(destPath), { recursive: true })
        fs.copyFileSync(srcPath, destPath)
        migratedFiles.push(file)
      }
    } else {
      const fileName = path.basename(source)
      fs.copyFileSync(source, path.join(migratedDir, fileName))
      migratedFiles.push(fileName)
    }
  }

  return { count: migratedFiles.length, files: migratedFiles }
}
