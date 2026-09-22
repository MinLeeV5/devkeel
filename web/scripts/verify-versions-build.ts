import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const VERSION_STREAMS = ['cli', 'templates'] as const

export function verifyVersionsBuild(sourceRoot: string, buildRoot: string): void {
  for (const stream of VERSION_STREAMS) {
    const sourceFiles = listVersionFiles(sourceRoot, stream)
    const buildFiles = listVersionFiles(buildRoot, stream)
    if (JSON.stringify(sourceFiles) !== JSON.stringify(buildFiles)) {
      throw new Error(
        `${stream} version file set mismatch: source=[${sourceFiles.join(', ')}], build=[${buildFiles.join(', ')}]`,
      )
    }

    for (const fileName of sourceFiles) {
      const sourceFile = path.join(sourceRoot, stream, fileName)
      const buildFile = path.join(buildRoot, stream, fileName)
      if (!fs.readFileSync(sourceFile).equals(fs.readFileSync(buildFile))) {
        throw new Error(`${stream}/${fileName} content mismatch between public and dist`)
      }
    }
  }
}

function listVersionFiles(root: string, stream: (typeof VERSION_STREAMS)[number]): string[] {
  const streamDir = path.join(root, stream)
  return fs
    .readdirSync(streamDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort()
}

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (invokedPath === fileURLToPath(import.meta.url)) {
  verifyVersionsBuild(path.join(webRoot, 'public', 'versions'), path.join(webRoot, 'dist', 'versions'))
}
