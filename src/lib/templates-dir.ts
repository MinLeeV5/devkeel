import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let cachedTemplatesDir: string | null = null

export function setTemplatesDir(dir: string): void {
  cachedTemplatesDir = dir
}

export function getTemplatesDir(): string {
  if (cachedTemplatesDir) return cachedTemplatesDir
  const candidate = path.resolve(__dirname, '..', 'templates')
  if (fs.existsSync(candidate)) return candidate
  return path.resolve(__dirname, '..', '..', 'templates')
}
