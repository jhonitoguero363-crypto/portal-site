import { spawnSync } from 'node:child_process'
import fs from 'node:fs'

const git = 'C:\\Program Files\\Git\\mingw64\\bin\\git.exe'
const fallback = 'C:\\Program Files\\Git\\cmd\\git.exe'
const bin = fs.existsSync(git) ? git : fallback

function run(args) {
  const res = spawnSync(bin, args, { encoding: 'utf8', cwd: process.cwd() })
  if (res.status !== 0) {
    console.error(res.stderr || res.stdout)
    process.exit(res.status || 1)
  }
  return (res.stdout || '').trim()
}

// Ensure cleaned files are staged
run(['add', '-A'])
const tree = run(['write-tree'])
const commit = run(['commit-tree', tree, '-m', 'feat: portal site with admin, COS icons, and CI/CD'])
run(['reset', '--hard', commit])
console.log('NEW_COMMIT', commit)
const example = run(['show', 'HEAD:.env.example'])
if (/AKID[A-Za-z0-9]+/.test(example) || /NUXT_COS_SECRET_KEY=.+/.test(example)) {
  console.error('Secret still present in commit')
  process.exit(1)
}
console.log('SECRET_CLEARED_OK')
