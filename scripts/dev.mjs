import net from 'node:net'
import path from 'node:path'
import { spawn } from 'node:child_process'

const port = 3000

function assertPortAvailable() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.unref()
    probe.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        reject(new Error(`Ya existe un servidor de Vertex en http://localhost:${port}. No se iniciará una segunda instancia.`))
        return
      }
      reject(error)
    })
    probe.listen({ host: '::', port }, () => probe.close(resolve))
  })
}

try {
  await assertPortAvailable()
} catch (error) {
  console.error(`\n✖ ${error.message}\n`)
  process.exit(1)
}

const dotenvCli = path.join(process.cwd(), 'node_modules', 'dotenv-cli', 'cli.js')
const child = spawn(process.execPath, [dotenvCli, '-e', '.env.dev', '--', 'next', 'dev', '-p', String(port)], {
  cwd: process.cwd(),
  stdio: 'inherit',
  env: process.env,
})

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal))
}

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(code ?? 1)
})

child.on('error', (error) => {
  console.error('No se pudo iniciar Next.js:', error.message)
  process.exit(1)
})
