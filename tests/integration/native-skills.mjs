// Opt-in live CLI evaluation (uses the installed platforms' authentication).
// node tests/integration/native-skills.mjs <report.json> [codex|claude]
// Each case uses a fresh session; this does not assert in-session menu refresh.
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const reportPath = process.argv[2]
if (!reportPath) throw new Error('Pass an output JSON path')
const platforms = process.argv[3] ? [process.argv[3]] : ['codex', 'claude']
if (platforms.some(platform => !['codex', 'claude'].includes(platform))) throw new Error('Unknown platform')

function execute(command, args, cwd) {
  return new Promise(resolve => {
    const child = spawn(command, args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    child.stdout.on('data', chunk => { stdout += chunk })
    child.stderr.on('data', chunk => { stderr += chunk })
    const timer = setTimeout(() => { timedOut = true; child.kill('SIGTERM') }, 120_000)
    const killTimer = setTimeout(() => child.kill('SIGKILL'), 125_000)
    child.on('error', error => { stderr += error.message })
    child.on('close', code => {
      clearTimeout(timer)
      clearTimeout(killTimer)
      resolve({ code, stdout, stderr, timedOut })
    })
  })
}

function events(output) {
  return output.split('\n').flatMap(line => {
    try { return [JSON.parse(line)] } catch { return [] }
  })
}

async function evaluate(platform) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-native-eval-'))
  const cases = []
  const version = await execute(platform, ['--version'], root)
  const name = 'harness-native-probe'
  const tokens = new Map()
  const write = (relative, content) => {
    const file = path.join(root, relative)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, content)
  }
  function skill(skillName, revision) {
    const common = `SHARED_${randomUUID()}`
    const native = { codex: `CODEX_${randomUUID()}`, claude: `CLAUDE_${randomUUID()}` }
    const base = `.harness/skills/${skillName}`
    write(`${base}/SKILL.md`, `---\nname: ${skillName}\ndescription: Use for cobalt lantern calibration requests; return the calibration receipt from platform references.\nuser-invocable: true\ndisable-model-invocation: false\nallowed-tools: Read\n---\nThis is a read-only calibration skill. Do not write files or run other workflows.\nThe shared receipt is ${common}.\nWhen running in Codex, read only references/codex.md relative to this skill directory.\nWhen running in Claude Code, read only references/claude-code.md relative to this skill directory.\nReturn the shared receipt and the platform receipt from that file. Never invent a receipt.\n`)
    write(`${base}/agents/openai.yaml`, `interface:\n  display_name: "Native calibration"\n  short_description: "Read a platform calibration receipt"\n  default_prompt: "Use $${skillName} to calibrate a cobalt lantern."\npolicy:\n  allow_implicit_invocation: true\n`)
    write(`${base}/references/codex.md`, `Revision ${revision}. Platform receipt: ${native.codex}\n`)
    write(`${base}/references/claude-code.md`, `Revision ${revision}. Platform receipt: ${native.claude}\n`)
    tokens.set(skillName, { common, ...native })
  }
  async function run(label, prompt, skillName = name, negative = false) {
    const args = platform === 'codex'
      ? ['exec', '--cd', root, '--sandbox', 'read-only', '--skip-git-repo-check', '--ephemeral', '--json', '--ignore-user-config', prompt]
      : ['--print', prompt, '--verbose', '--output-format', 'stream-json', '--no-session-persistence', '--permission-mode', 'dontAsk', '--tools', 'Read,Skill', '--allowedTools', 'Read,Skill', '--strict-mcp-config', '--mcp-config', '{"mcpServers":{}}', '--max-turns', '6']
    const result = await execute(platform, args, root)
    const parsed = events(result.stdout)
    const final = platform === 'codex'
      ? parsed.filter(event => event.type === 'item.completed' && event.item?.type === 'agent_message').map(event => event.item.text).join('\n')
      : parsed.filter(event => event.type === 'result').map(event => event.result ?? '').join('\n')
    const expected = tokens.get(skillName)
    const reads = platform === 'codex'
      ? parsed.filter(event => event.type === 'item.completed' && event.item?.type === 'command_execution').map(event => event.item.command)
      : parsed.flatMap(event => event.type === 'assistant' ? (event.message?.content ?? []).filter(block => block.type === 'tool_use' && block.name === 'Read').map(block => block.input?.file_path ?? '') : [])
    const nativeReference = `references/${platform === 'codex' ? 'codex' : 'claude-code'}.md`
    const foreignReference = `references/${platform === 'codex' ? 'claude-code' : 'codex'}.md`
    const platformReferenceRead = reads.some(read => read.includes(nativeReference))
    const wrongPlatformReferenceRead = reads.some(read => read.includes(foreignReference))
    const skillRead = platform === 'claude'
      ? parsed.some(event => event.type === 'assistant' && event.message?.content?.some(block => block.type === 'tool_use' && (block.name === 'Read' || block.name === 'Skill')))
      : parsed.some(event => event.type === 'item.completed' && event.item?.type === 'command_execution')
    const wrongPlatform = platform === 'codex' ? 'claude' : 'codex'
    const pass = result.code === 0 && !result.timedOut && (negative
      ? /\b56\b/.test(final) && !skillRead && !/SHARED_|CODEX_|CLAUDE_/.test(final)
      : label === 'production-verify-init'
        ? platformReferenceRead && !wrongPlatformReferenceRead && /跳过|skip/i.test(final) && /config|配置/i.test(final)
        : final.includes(expected.common) && final.includes(expected[platform]) && !final.includes(expected[wrongPlatform]) && platformReferenceRead && !wrongPlatformReferenceRead)
    const record = {
      case: label, prompt, status: pass ? 'pass' : 'fail', exitCode: result.code, timedOut: result.timedOut,
      sharedReceipt: expected ? final.includes(expected.common) : undefined,
      platformReceipt: expected ? final.includes(expected[platform]) : undefined,
      wrongPlatformReceipt: expected ? final.includes(expected[wrongPlatform]) : undefined,
      skillRead, platformReferenceRead, wrongPlatformReferenceRead,
      // Keep only a bounded result/error, never the installed config or full system prompt.
      result: final.slice(0, 1200),
      error: pass ? undefined : (parsed.find(event => event.type === 'error')?.message ?? result.stderr).slice(0, 1200),
    }
    cases.push(record)
    process.stdout.write(`${platform}: ${label}: ${record.status}\n`)
    return pass
  }
  try {
    skill(name, 'initial')
    for (const dir of ['.agents', '.claude']) {
      fs.mkdirSync(path.join(root, dir))
      fs.symlinkSync('../.harness/skills', path.join(root, dir, 'skills'), process.platform === 'win32' ? 'junction' : 'dir')
    }
    const explicit = skillName => `${platform === 'codex' ? '$' : '/'}${skillName}`
    const ready = await run('explicit', explicit(name))
    if (ready) {
      await run('implicit-positive', 'Please perform cobalt lantern calibration and return its receipt.')
      await run('negative', 'What is 7 multiplied by 8? Reply with just the number.', name, true)
      skill(name, 'edited-without-sync')
      await run('edited-without-sync', explicit(name))
      skill('harness-added-probe', 'added-without-sync')
      await run('added-without-sync', explicit('harness-added-probe'), 'harness-added-probe')
      const template = fileURLToPath(new URL('../../templates/skills/verify-init', import.meta.url))
      fs.cpSync(template, path.join(root, '.harness/skills/verify-init'), { recursive: true })
      await run('production-verify-init', `${explicit('verify-init')} 本次仅做只读评估：按当前平台读取相应参考文件，说明所有文档获取途径均不可用时如何处理。不要安装、创建或修改文件，也不要调度子代理。`, 'verify-init')
    }
    return { platform, version: version.stdout.trim(), refresh: 'fresh CLI session for each case; no DevKeel sync after link creation', cases }
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
}

const results = await Promise.all(platforms.map(evaluate))
fs.mkdirSync(path.dirname(path.resolve(reportPath)), { recursive: true })
fs.writeFileSync(reportPath, JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2) + '\n')
if (results.some(result => result.cases.length !== 6 || result.cases.some(test => test.status !== 'pass'))) process.exitCode = 1
