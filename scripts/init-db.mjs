import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function loadEnv() {
  const envPath = path.join(root, '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const i = trimmed.indexOf('=')
    if (i === -1) continue
    const key = trimmed.slice(0, i).trim()
    const value = trimmed.slice(i + 1).trim()
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnv()

const config = {
  host: process.env.NUXT_DB_HOST || '127.0.0.1',
  port: Number(process.env.NUXT_DB_PORT || 3306),
  user: process.env.NUXT_DB_USER || 'root',
  password: process.env.NUXT_DB_PASSWORD || '',
  multipleStatements: true,
  charset: 'utf8mb4',
  // Ensure Node sends UTF-8 strings correctly on Windows
  supportBigNumbers: true
}

const categories = [
  { id: 'ai', name: 'AI 研究', sort: 1 },
  { id: 'devtools', name: '开发工具', sort: 2 },
  { id: 'frontend', name: '前端开发', sort: 3 },
  { id: 'backend', name: '后端开发', sort: 4 },
  { id: 'mobile', name: '移动开发', sort: 5 },
  { id: 'database', name: '数据库', sort: 6 },
  { id: 'algo', name: '算法研究', sort: 7 },
  { id: 'devops', name: 'DevOps', sort: 8 },
  { id: 'design', name: '设计工具', sort: 9 },
  { id: 'learn', name: '学习技能', sort: 10 },
  { id: 'community', name: '技术社区', sort: 11 },
  { id: 'other', name: '其他工具', sort: 12 },
  { id: 'plugins', name: '插件平台', sort: 13 }
]

const sites = [
  ['cursor', 'Cursor', 'AI 原生代码编辑器，用自然语言驱动开发', 'https://cursor.com', 'ai', 'online', 1, '#1a1714', 'C'],
  ['copilot', 'GitHub Copilot', 'GitHub 官方 AI 结对编程助手', 'https://github.com/features/copilot', 'ai', 'online', 1, '#24292f', 'G'],
  ['trae', 'TRAE', '字节跳动推出的 AI 编程 IDE', 'https://trae.ai', 'ai', 'online', 1, '#4f46e5', 'T'],
  ['marscode', 'MarsCode', '云端 AI 开发环境，即开即用', 'https://www.marscode.cn', 'ai', 'online', 1, '#0ea5e9', 'M'],
  ['joycode', 'JoyCode', '京东云 AI 编程助手', 'https://joycode.jd.com', 'ai', 'online', 0, '#e11d48', 'J'],
  ['tabnine', 'Tabnine', '本地优先的 AI 代码补全', 'https://www.tabnine.com', 'ai', 'online', 0, '#0d9488', 'T'],
  ['workbuddy', 'WorkBuddy', '多智能体协作的开发助手', 'https://workbuddy.ai', 'ai', 'online', 0, '#7c3aed', 'W'],
  ['codegeex', 'CodeGeeX', '智谱开源多语言代码生成模型', 'https://codegeex.cn', 'ai', 'online', 0, '#2563eb', 'C'],
  ['lingma', '通义灵码', '阿里云智能编码助手', 'https://tongyi.aliyun.com/lingma', 'ai', 'online', 0, '#f97316', '灵'],
  ['codeium', 'Codeium', '免费高速的 AI 代码补全', 'https://codeium.com', 'ai', 'online', 0, '#0891b2', 'C'],
  ['vscode', 'VS Code', '微软开源跨平台编辑器', 'https://code.visualstudio.com', 'devtools', 'online', 0, '#0078d4', 'V'],
  ['vim', 'Vim', '高效键盘驱动文本编辑器', 'https://www.vim.org', 'devtools', 'online', 0, '#019833', 'Vi'],
  ['idea', 'IntelliJ IDEA', 'JetBrains Java IDE', 'https://www.jetbrains.com/idea', 'devtools', 'online', 0, '#fe315d', 'I'],
  ['pycharm', 'PyCharm', '专业 Python 开发环境', 'https://www.jetbrains.com/pycharm', 'devtools', 'online', 0, '#21d789', 'P'],
  ['webstorm', 'WebStorm', '前端与 Node.js IDE', 'https://www.jetbrains.com/webstorm', 'devtools', 'online', 0, '#07c3f2', 'W'],
  ['android', 'Android Studio', '官方 Android 开发 IDE', 'https://developer.android.com/studio', 'devtools', 'online', 0, '#3ddc84', 'A'],
  ['xcode', 'Xcode', 'Apple 官方开发工具套件', 'https://developer.apple.com/xcode', 'devtools', 'online', 0, '#147efb', 'X'],
  ['sublime', 'Sublime Text', '轻量高速文本编辑器', 'https://www.sublimetext.com', 'devtools', 'hidden', 0, '#ff9800', 'S'],
  ['zed', 'Zed', '高性能多人协作编辑器', 'https://zed.dev', 'devtools', 'online', 0, '#084ccf', 'Z']
]

const reviews = [
  ['r1', 'CodeRabbit', 'AI 驱动的代码审查助手，自动生成 PR 评论与改进建议', 'coderabbit.ai', 'ai', 'AI相关', '林晓', 'pending', '#dcfce7', 'C', '2026-02-14 09:12:00'],
  ['r2', 'Figma', '协作式界面设计与原型工具，设计师与开发者共用', 'figma.com', 'design', '设计工具', '陈可', 'pending', '#fee2e2', 'F', '2026-02-14 08:40:00'],
  ['r3', 'Grafana', '开源可观测性平台，可视化指标、日志与链路追踪', 'grafana.com', 'devops', 'DevOps', '赵航', 'pending', '#ffedd5', 'G', '2026-02-13 22:18:00'],
  ['r4', 'Raycast', 'macOS 效率启动器，支持 AI 与开发者扩展', 'raycast.com', 'other', '其他工具', '周明', 'pending', '#ede9fe', 'R', '2026-02-13 19:05:00'],
  ['r5', 'Notion', '一体化笔记与知识库，适合团队文档协作', 'notion.so', 'other', '其他工具', '吴优', 'approved', '#e5e7eb', 'N', '2026-02-13 15:33:00'],
  ['r6', 'Postman', 'API 设计、调试与协作平台', 'postman.com', 'devtools', '开发工具', '郑凯', 'pending', '#ffedd5', 'P', '2026-02-12 11:20:00']
]

const visitStats = [
  ['2026-02-08', 42000],
  ['2026-02-09', 58000],
  ['2026-02-10', 51000],
  ['2026-02-11', 73000],
  ['2026-02-12', 88000],
  ['2026-02-13', 64000],
  ['2026-02-14', 70000]
]

async function main() {
  console.log(`Connecting ${config.host}:${config.port} ...`)
  const conn = await mysql.createConnection(config)
  await conn.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')
  await conn.query('SET CHARACTER SET utf8mb4')

  const schema = fs.readFileSync(path.join(root, 'server/utils/schema.sql'), 'utf8')
  await conn.query(schema)
  console.log('Schema applied')

  await conn.query('USE `portal_site`')
  await conn.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')

  // Re-seed cleanly
  await conn.query('SET FOREIGN_KEY_CHECKS = 0')
  await conn.query('TRUNCATE TABLE visit_stats')
  await conn.query('TRUNCATE TABLE reviews')
  await conn.query('TRUNCATE TABLE sites')
  await conn.query('TRUNCATE TABLE categories')
  await conn.query('TRUNCATE TABLE settings')
  await conn.query('TRUNCATE TABLE admins')
  await conn.query('SET FOREIGN_KEY_CHECKS = 1')


  for (const c of categories) {
    await conn.query(
      `INSERT INTO categories (id, name, sort_order) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order)`,
      [c.id, c.name, c.sort]
    )
  }
  console.log(`Seeded ${categories.length} categories`)

  for (const s of sites) {
    await conn.query(
      `INSERT INTO sites (id, name, description, url, category_id, status, is_hot, color, letter)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         url = VALUES(url),
         category_id = VALUES(category_id),
         status = VALUES(status),
         is_hot = VALUES(is_hot),
         color = VALUES(color),
         letter = VALUES(letter)`,
      s
    )
  }
  console.log(`Seeded ${sites.length} sites`)

  for (const r of reviews) {
    await conn.query(
      `INSERT INTO reviews (id, name, description, url, category_id, category_name, submitter, status, color, letter, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         description = VALUES(description),
         url = VALUES(url),
         category_id = VALUES(category_id),
         category_name = VALUES(category_name),
         submitter = VALUES(submitter),
         status = VALUES(status),
         color = VALUES(color),
         letter = VALUES(letter)`,
      r
    )
  }
  console.log(`Seeded ${reviews.length} reviews`)

  await conn.query(
    `INSERT INTO admins (account, password, display_name)
     VALUES ('admin', '123456', '管理员')
     ON DUPLICATE KEY UPDATE password = VALUES(password), display_name = VALUES(display_name)`
  )
  console.log('Seeded admin account')

  await conn.query(
    `INSERT INTO settings (\`key\`, \`value\`) VALUES
      ('site_name', '程序员导航网'),
      ('site_url', 'https://haonav.cn'),
      ('allow_submit', '1')
     ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`
  )
  console.log('Seeded settings')

  for (const [date, visits] of visitStats) {
    await conn.query(
      `INSERT INTO visit_stats (stat_date, visits) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE visits = VALUES(visits)`,
      [date, visits]
    )
  }
  console.log(`Seeded ${visitStats.length} visit stats`)

  await conn.end()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
