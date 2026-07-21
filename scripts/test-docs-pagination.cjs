const { config } = require('dotenv')
const { PrismaClient } = require('@prisma/client')
const { encode } = require('next-auth/jwt')
const WebSocket = require('next/dist/compiled/ws')

config({ path: '.env.dev' })

const baseUrl = 'http://localhost:3000'
const debugUrl = 'http://localhost:9223'
const prisma = new PrismaClient()

async function waitFor(check, timeout = 12000) {
  const started = Date.now()
  while (Date.now() - started < timeout) {
    const value = await check()
    if (value) return value
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error('Tiempo de espera agotado')
}

async function connectCdp(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    socket.once('open', resolve)
    socket.once('error', reject)
  })
  let id = 0
  const pending = new Map()
  socket.on('message', (raw) => {
    const message = JSON.parse(String(raw))
    if (!message.id || !pending.has(message.id)) return
    const { resolve, reject } = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) reject(new Error(message.error.message))
    else resolve(message.result)
  })
  return {
    call(method, params = {}) {
      const messageId = ++id
      socket.send(JSON.stringify({ id: messageId, method, params }))
      return new Promise((resolve, reject) => pending.set(messageId, { resolve, reject }))
    },
    close() { socket.close() },
  }
}

async function main() {
  const user = await prisma.user.findFirst({ select: { id: true, name: true, email: true, role: true } })
  if (!user?.email) throw new Error('No hay un usuario disponible para la prueba')
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) throw new Error('Falta NEXTAUTH_SECRET')
  const sessionToken = await encode({
    secret,
    maxAge: 60 * 60,
    token: { sub: user.id, id: user.id, name: user.name, email: user.email, role: user.role, plan: 'FREE', planRefreshedAt: Date.now() },
  })
  const cookie = `next-auth.session-token=${sessionToken}`
  const title = `__PRUEBA_PAGINADO_${Date.now()}__`
  const content = Array.from({ length: 55 }, (_, index) => `<p>Párrafo ${index + 1}: ${'contenido de seguimiento '.repeat(24)}</p>`).join('')
  const documentIds = []
  let cdp
  try {
    const createResponse = await fetch(`${baseUrl}/api/docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ title, content, category: 'Prueba temporal' }),
    })
    if (!createResponse.ok) throw new Error(`No se pudo crear el documento temporal (${createResponse.status})`)
    documentIds.push((await createResponse.json()).document.id)

    const target = await fetch(`${debugUrl}/json/new?about:blank`, { method: 'PUT' }).then((response) => response.json())
    cdp = await connectCdp(target.webSocketDebuggerUrl)
    await cdp.call('Network.enable')
    await cdp.call('Network.setCookie', { name: 'next-auth.session-token', value: sessionToken, url: baseUrl, path: '/', httpOnly: true })
    await cdp.call('Page.enable')
    await cdp.call('Page.navigate', { url: `${baseUrl}/docs` })
    await waitFor(async () => {
      const result = await cdp.call('Runtime.evaluate', { expression: `document.readyState === 'complete' && document.body.innerText.includes(${JSON.stringify(title)})`, returnByValue: true })
      return result.result.value
    })
    await cdp.call('Runtime.evaluate', { expression: `Array.from(document.querySelectorAll('button')).find((button) => button.innerText.includes(${JSON.stringify(title)}))?.click()` })
    const before = await waitFor(async () => {
      const result = await cdp.call('Runtime.evaluate', { expression: `document.querySelectorAll('[aria-label^="Contenido de la página"]').length`, returnByValue: true })
      return result.result.value >= 2 ? result.result.value : 0
    })
    await cdp.call('Runtime.evaluate', { expression: `(() => {
      const pages = Array.from(document.querySelectorAll('[aria-label^="Contenido de la página"]'));
      const last = pages.at(-1);
      const range = document.createRange();
      range.selectNodeContents(last);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      document.execCommand('delete');
      last.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
    })()` })
    const afterDelete = await waitFor(async () => {
      const result = await cdp.call('Runtime.evaluate', { expression: `document.querySelectorAll('[aria-label^="Contenido de la página"]').length`, returnByValue: true })
      return result.result.value < before ? result.result.value : 0
    })
    const cursorAfterDelete = await cdp.call('Runtime.evaluate', { expression: `Boolean(getSelection()?.anchorNode && getSelection().anchorNode.parentElement?.closest('.docs-page-content'))`, returnByValue: true })
    await cdp.call('Runtime.evaluate', { expression: `(() => {
      document.execCommand('insertText', false, 'PRUEBA_SEGUIMIENTO');
      const page = getSelection()?.anchorNode?.parentElement?.closest('.docs-page-content');
      page?.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: 'PRUEBA_SEGUIMIENTO' }));
    })()` })
    await new Promise((resolve) => setTimeout(resolve, 500))
    const finalState = await cdp.call('Runtime.evaluate', { expression: `({
      pages: document.querySelectorAll('[aria-label^="Contenido de la página"]').length,
      cursorVisible: Boolean(getSelection()?.anchorNode && getSelection().anchorNode.parentElement?.closest('.docs-page-content')),
      textPreserved: Array.from(document.querySelectorAll('.docs-page-content')).some((page) => page.innerText.includes('PRUEBA_SEGUIMIENTO'))
    })`, returnByValue: true })
    const backspaceBefore = await cdp.call('Runtime.evaluate', { expression: `(() => {
      const allPages = Array.from(document.querySelectorAll('.docs-page-content'));
      const last = allPages.at(-1);
      last.focus();
      const range = document.createRange();
      range.selectNodeContents(last);
      range.collapse(true);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      return allPages.reduce((total, page) => total + page.innerText.length, 0);
    })()`, returnByValue: true })
    for (let index = 0; index < 12; index += 1) {
      await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8, autoRepeat: index > 0 })
      await new Promise((resolve) => setTimeout(resolve, 25))
    }
    await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 })
    await new Promise((resolve) => setTimeout(resolve, 500))
    const repeatedBackspace = await cdp.call('Runtime.evaluate', { expression: `({
      textLength: Array.from(document.querySelectorAll('.docs-page-content')).reduce((total, page) => total + page.innerText.length, 0),
      cursorVisibleAfterRepeat: Boolean(getSelection()?.anchorNode && getSelection().anchorNode.parentElement?.closest('.docs-page-content'))
    })`, returnByValue: true })
    const result = { before, afterDelete, cursorAfterDelete: cursorAfterDelete.result.value, ...finalState.result.value, backspaceReducedText: repeatedBackspace.result.value.textLength < backspaceBefore.result.value, cursorVisibleAfterRepeat: repeatedBackspace.result.value.cursorVisibleAfterRepeat }
    if (!result.cursorAfterDelete || !result.cursorVisible || !result.textPreserved || !result.backspaceReducedText || !result.cursorVisibleAfterRepeat) throw new Error(`Falló la prueba: ${JSON.stringify(result)}`)

    const repeatTitle = `__PRUEBA_ENTER_BACKSPACE_${Date.now()}__`
    const repeatResponse = await fetch(`${baseUrl}/api/docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ title: repeatTitle, content: '<p>INICIO</p>', category: 'Prueba temporal' }),
    })
    if (!repeatResponse.ok) throw new Error(`No se pudo crear la prueba simétrica (${repeatResponse.status})`)
    documentIds.push((await repeatResponse.json()).document.id)
    await cdp.call('Page.navigate', { url: `${baseUrl}/docs` })
    await waitFor(async () => {
      const state = await cdp.call('Runtime.evaluate', { expression: `document.readyState === 'complete' && document.body.innerText.includes(${JSON.stringify(repeatTitle)})`, returnByValue: true })
      return state.result.value
    })
    await cdp.call('Runtime.evaluate', { expression: `Array.from(document.querySelectorAll('button')).find((button) => button.innerText.includes(${JSON.stringify(repeatTitle)}))?.click()` })
    await waitFor(async () => {
      const state = await cdp.call('Runtime.evaluate', { expression: `document.querySelectorAll('.docs-page-content').length === 1`, returnByValue: true })
      return state.result.value
    })
    await cdp.call('Runtime.evaluate', { expression: `(() => {
      const page = document.querySelector('.docs-page-content');
      page.focus();
      const range = document.createRange();
      range.selectNodeContents(page);
      range.collapse(false);
      const selection = getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    })()` })
    for (let index = 0; index < 90; index += 1) {
      await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', text: '\r', unmodifiedText: '\r', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, autoRepeat: index > 0 })
      await new Promise((resolve) => setTimeout(resolve, 15))
    }
    await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13 })
    await new Promise((resolve) => setTimeout(resolve, 700))
    const pagesAfterEnter = await cdp.call('Runtime.evaluate', { expression: `(() => {
      const pageNodes = Array.from(document.querySelectorAll('.docs-page-content'));
      return {
        pages: pageNodes.length,
        htmlLength: pageNodes.reduce((total, page) => total + page.innerHTML.length, 0),
        breaks: pageNodes.reduce((total, page) => total + page.querySelectorAll('br').length, 0),
        children: pageNodes.reduce((total, page) => total + page.children.length, 0),
        cursorInside: Boolean(getSelection()?.anchorNode && (getSelection().anchorNode.nodeType === Node.ELEMENT_NODE ? getSelection().anchorNode : getSelection().anchorNode.parentElement)?.closest('.docs-page-content')),
        activePage: pageNodes.findIndex((page) => page === document.activeElement),
        anchorPage: pageNodes.findIndex((page) => getSelection()?.anchorNode && page.contains(getSelection().anchorNode))
      };
    })()`, returnByValue: true })
    const backspaceTrace = []
    for (let index = 0; index < 90; index += 1) {
      await cdp.call('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8, autoRepeat: index > 0 })
      await new Promise((resolve) => setTimeout(resolve, 15))
      if ([19, 39, 59, 79, 89].includes(index)) {
        const trace = await cdp.call('Runtime.evaluate', { expression: `(() => {
          const pages = Array.from(document.querySelectorAll('.docs-page-content'));
          const selection = getSelection();
          return {
            event: ${index + 1},
            pages: pages.length,
            children: pages.map((page) => page.children.length),
            text: pages.map((page) => page.innerText.length),
            activePage: pages.findIndex((page) => page === document.activeElement),
            anchorPage: pages.findIndex((page) => selection?.anchorNode && page.contains(selection.anchorNode))
          };
        })()`, returnByValue: true })
        backspaceTrace.push(trace.result.value)
      }
    }
    await cdp.call('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Backspace', code: 'Backspace', windowsVirtualKeyCode: 8, nativeVirtualKeyCode: 8 })
    await new Promise((resolve) => setTimeout(resolve, 900))
    const symmetricState = await cdp.call('Runtime.evaluate', { expression: `({
      pagesAfterBackspace: document.querySelectorAll('.docs-page-content').length,
      text: Array.from(document.querySelectorAll('.docs-page-content')).map((page) => page.innerText).join('').trim(),
      cursorVisible: Boolean(getSelection()?.anchorNode && getSelection().anchorNode.parentElement?.closest('.docs-page-content'))
    })`, returnByValue: true })
    const symmetric = { pagesAfterEnter: pagesAfterEnter.result.value.pages, enterDiagnostics: pagesAfterEnter.result.value, backspaceTrace, ...symmetricState.result.value }
    const pageRemovedWhileHeld = symmetric.backspaceTrace.some((trace) => trace.pages < symmetric.pagesAfterEnter)
    if (symmetric.pagesAfterEnter < 2 || !pageRemovedWhileHeld || symmetric.pagesAfterBackspace !== 1 || symmetric.text !== 'INICIO' || !symmetric.cursorVisible) throw new Error(`Falló Enter→Backspace: ${JSON.stringify(symmetric)}`)
    process.stdout.write(`${JSON.stringify({ ...result, symmetric })}\n`)
  } finally {
    for (const documentId of documentIds) await fetch(`${baseUrl}/api/docs/${documentId}`, { method: 'DELETE', headers: { Cookie: cookie } })
    if (cdp) {
      await cdp.call('Page.close').catch(() => {})
      cdp.close()
    }
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
