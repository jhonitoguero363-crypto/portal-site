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

const SOURCE_DB = 'porttal_site'
const TARGET_DB = 'portal_site'

const config = {
  host: process.env.NUXT_DB_HOST || '127.0.0.1',
  port: Number(process.env.NUXT_DB_PORT || 3306),
  user: process.env.NUXT_DB_USER || 'root',
  password: process.env.NUXT_DB_PASSWORD || '',
  multipleStatements: true,
  charset: 'utf8mb4'
}

async function main() {
  console.log(`Connecting ${config.host}:${config.port} ...`)
  console.log(`Copy ${SOURCE_DB} -> ${TARGET_DB}`)

  const conn = await mysql.createConnection(config)
  await conn.query('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci')

  const [sources] = await conn.query('SHOW DATABASES LIKE ?', [SOURCE_DB])
  if (!sources.length) {
    throw new Error(`Source database \`${SOURCE_DB}\` does not exist`)
  }

  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${TARGET_DB}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  )

  const [tables] = await conn.query(
    `SELECT TABLE_NAME AS name
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME`,
    [SOURCE_DB]
  )

  if (!tables.length) {
    throw new Error(`Source database \`${SOURCE_DB}\` has no tables`)
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 0')

  for (const { name } of tables) {
    console.log(`Copying table: ${name}`)
    await conn.query(`DROP TABLE IF EXISTS \`${TARGET_DB}\`.\`${name}\``)
    await conn.query(`CREATE TABLE \`${TARGET_DB}\`.\`${name}\` LIKE \`${SOURCE_DB}\`.\`${name}\``)
    await conn.query(`INSERT INTO \`${TARGET_DB}\`.\`${name}\` SELECT * FROM \`${SOURCE_DB}\`.\`${name}\``)

    const [countRows] = await conn.query(`SELECT COUNT(*) AS c FROM \`${TARGET_DB}\`.\`${name}\``)
    console.log(`  -> ${countRows[0].c} rows`)
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1')
  await conn.end()
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
