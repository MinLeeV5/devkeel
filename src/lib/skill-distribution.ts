import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const SKILL_LINKS: Record<string, string> = {
  'claude-code': '.claude/skills',
  codex: '.agents/skills',
}
const STATE_PATH = '.harness/skills-state.json'

export interface SkillLink {
  path: string
  target: string
  status: 'missing' | 'linked' | 'conflict'
  detail: string
}

export interface SkillLinkPlan {
  links: SkillLink[]
  recorded: Record<string, string>
  errors: string[]
}

export interface SkillSyncResult {
  ok: boolean
  changed: boolean
  errors: string[]
  backupPath?: string
}

function directoryProblem(projectRoot: string, relative: string): string | null {
  const stat = fs.lstatSync(path.join(projectRoot, relative), { throwIfNoEntry: false })
  if (!stat || (stat.isDirectory() && !stat.isSymbolicLink())) return null
  return `${relative}: 父目录必须是真实目录，保留现有内容`
}

export function planSkillLinks(projectRoot: string, targets: readonly string[]): SkillLinkPlan {
  const plan: SkillLinkPlan = { links: [], recorded: {}, errors: [] }
  if (!Array.isArray(targets) || targets.some(target => typeof target !== 'string')) {
    plan.errors.push('targets 必须是平台名称列表')
    return plan
  }
  const paths = [...new Set(targets.flatMap(target => Object.hasOwn(SKILL_LINKS, target) ? SKILL_LINKS[target]! : []))]
  if (paths.length === 0) return plan
  try {
    for (const parent of ['.harness', ...paths.map(relative => path.dirname(relative))]) {
      const problem = directoryProblem(projectRoot, parent)
      if (problem) plan.errors.push(problem)
    }
    if (plan.errors.length > 0) return plan
    const statePath = path.join(projectRoot, STATE_PATH)
    const stateStat = fs.lstatSync(statePath, { throwIfNoEntry: false })
    if (stateStat) {
      if (!stateStat.isFile() || stateStat.isSymbolicLink()) {
        plan.errors.push(`${STATE_PATH}: 受管清单必须是普通文件`)
        return plan
      }
      const state: unknown = JSON.parse(fs.readFileSync(statePath, 'utf8'))
      if (!state || typeof state !== 'object' || !('version' in state) || state.version !== 1
        || !('links' in state) || !state.links || typeof state.links !== 'object' || Array.isArray(state.links)) {
        plan.errors.push(`${STATE_PATH}: 受管清单格式无效`)
        return plan
      }
      for (const [relative, target] of Object.entries(state.links)) {
        if (!Object.values(SKILL_LINKS).includes(relative) || typeof target !== 'string') {
          plan.errors.push(`${STATE_PATH}: 未知或无效的 skills 记录`)
          return plan
        }
        plan.recorded[relative] = target
      }
    }
    for (const relative of paths) {
      const fullPath = path.join(projectRoot, relative)
      const target = path.relative(path.dirname(fullPath), path.join(projectRoot, '.harness/skills'))
      const link: SkillLink = { path: relative, target, status: 'missing', detail: '技能链接缺失' }
      const stat = fs.lstatSync(fullPath, { throwIfNoEntry: false })
      if (stat) {
        link.status = 'conflict'
        link.detail = '同名内容不属于已确认的 DevKeel skills 链接'
        if (stat.isSymbolicLink()) {
          const actual = fs.readlinkSync(fullPath)
          const correct = path.resolve(path.dirname(fullPath), actual)
            === path.resolve(projectRoot, '.harness/skills')
          const unchanged = plan.recorded[relative] === undefined || plan.recorded[relative] === actual
          if (correct && unchanged) {
            link.status = 'linked'
            link.detail = '链接指向共享技能源'
          } else {
            link.detail = '链接目标与共享技能源或受管记录不符'
          }
        }
      }
      plan.links.push(link)
    }
  } catch (error) {
    plan.errors.push(`无法检查 skills 入口: ${error instanceof Error ? error.message : String(error)}`)
  }
  return plan
}

export function skillLinkProblems(plan: SkillLinkPlan): string[] {
  return [
    ...plan.errors,
    ...plan.links.filter(link => link.status === 'conflict').map(link => `${link.path}: ${link.detail}`),
  ]
}

export function syncSkillLinks(
  projectRoot: string,
  targets: readonly string[],
  options: { force?: boolean } = {},
): SkillSyncResult {
  const plan = planSkillLinks(projectRoot, targets)
  const errors = options.force ? [...plan.errors] : skillLinkProblems(plan)
  if (errors.length > 0) return { ok: false, changed: false, errors }
  if (plan.links.length === 0) return { ok: true, changed: false, errors: [] }
  const conflicts = plan.links.filter(link => link.status === 'conflict')
  let backupPath: string | undefined
  if (conflicts.length > 0) {
    try {
      const problem = directoryProblem(projectRoot, '.harness/skills-backups')
      if (problem) return { ok: false, changed: false, errors: [problem] }
      const backupRoot = path.join(projectRoot, '.harness/skills-backups')
      fs.mkdirSync(backupRoot, { recursive: true })
      backupPath = fs.mkdtempSync(path.join(backupRoot, `${Date.now()}-`))
      for (const link of conflicts) {
        const destination = path.join(backupPath, link.path)
        fs.mkdirSync(path.dirname(destination), { recursive: true })
        fs.cpSync(path.join(projectRoot, link.path), destination, {
          recursive: true, dereference: false, verbatimSymlinks: true, force: false, errorOnExist: true,
        })
      }
      fs.writeFileSync(path.join(backupPath, 'restore.json'), JSON.stringify({
        version: 1,
        paths: conflicts.map(link => link.path),
      }, null, 2) + '\n', { flag: 'wx' })
    } catch (error) {
      return {
        ok: false, changed: false, backupPath,
        errors: [`skills 备份失败，未覆盖入口: ${error instanceof Error ? error.message : String(error)}`],
      }
    }
  }
  const changed: SkillLink[] = []
  let recoveryRequired = false
  const statePath = path.join(projectRoot, STATE_PATH)
  const temporary = path.join(projectRoot, '.harness', `.skills-state-${randomUUID()}.tmp`)
  try {
    for (const link of plan.links) {
      if (link.status === 'linked') continue
      const fullPath = path.join(projectRoot, link.path)
      fs.mkdirSync(path.dirname(fullPath), { recursive: true })
      if (link.status === 'conflict') {
        try {
          fs.rmSync(fullPath, { recursive: true })
        } catch (error) {
          recoveryRequired = true
          errors.push(`${link.path}: 删除未完成，原件可能已部分变化；请从 ${path.join(backupPath!, link.path)} 恢复`)
          throw error
        }
        changed.push(link)
      }
      fs.symlinkSync(link.target, fullPath, process.platform === 'win32' ? 'junction' : 'dir')
      if (link.status === 'missing') changed.push(link)
    }
    const recorded = { ...plan.recorded }
    for (const link of plan.links) recorded[link.path] = fs.readlinkSync(path.join(projectRoot, link.path))
    const content = JSON.stringify({ version: 1, links: recorded }, null, 2) + '\n'
    const previous = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : ''
    if (content !== previous) {
      fs.mkdirSync(path.dirname(statePath), { recursive: true })
      fs.writeFileSync(temporary, content, { flag: 'wx' })
      fs.renameSync(temporary, statePath)
    }
    return { ok: true, changed: changed.length > 0 || content !== previous, errors: [], backupPath }
  } catch (error) {
    for (const link of changed.reverse()) {
      const fullPath = path.join(projectRoot, link.path)
      try {
        const stat = fs.lstatSync(fullPath, { throwIfNoEntry: false })
        if (stat) {
          if (!stat.isSymbolicLink() || path.resolve(path.dirname(fullPath), fs.readlinkSync(fullPath))
            !== path.resolve(projectRoot, '.harness/skills')) {
            errors.push(`${link.path}: 回退时入口已变化，请从备份恢复`)
            recoveryRequired = true
            continue
          }
          fs.unlinkSync(fullPath)
        }
        if (link.status === 'conflict' && backupPath) {
          fs.cpSync(path.join(backupPath, link.path), fullPath, {
            recursive: true, dereference: false, verbatimSymlinks: true, force: false, errorOnExist: true,
          })
        }
      } catch {
        recoveryRequired = true
        errors.push(`${link.path}: 无法回退，请检查入口`)
      }
    }
    errors.unshift(`skills 同步失败: ${error instanceof Error ? error.message : String(error)}`)
    return { ok: false, changed: recoveryRequired, errors, backupPath }
  } finally {
    if (fs.existsSync(temporary)) fs.rmSync(temporary)
  }
}
