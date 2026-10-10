import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { setTimeout as sleep } from 'node:timers/promises'
import { createServer } from 'vite'
import react from '@vitejs/plugin-react'

const profile = await mkdtemp(path.join(tmpdir(), 'neotek-validation-'))
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--remote-debugging-pipe', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] })
let sequence = 0, buffer = '', server
const pending = new Map(), exceptions = [], passed = []
chrome.stdio[4].on('data', data => {
  buffer += data.toString()
  let end
  while ((end = buffer.indexOf('\0')) !== -1) {
    const message = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1)
    if (pending.has(message.id)) { const task = pending.get(message.id); pending.delete(message.id); clearTimeout(task.timer); message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result) }
    else if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text)
  }
})
const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++sequence, timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)) }, 15000)
  pending.set(id, { resolve, reject, timer })
  chrome.stdio[3].write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0')
})
try {
  server = await createServer({ configFile: false, plugins: [react(), { name: 'form-validation-fixture', configureServer(vite) { vite.middlewares.use(async (req, res, next) => {
    if (!req.url.startsWith('/__validation-test')) return next()
    res.setHeader('Content-Type', 'text/html')
    res.end(await vite.transformIndexHtml(req.url, '<html><body><div id="root"></div><script type="module" src="/scripts/fixtures/form-validation.jsx"></script></body></html>'))
  }) } }], define: { 'import.meta.env.VITE_FEATURE_GOOGLE_LOGIN': '"false"', 'import.meta.env.VITE_API_BASE_URL': '"/api"' }, server: { host: '127.0.0.1', port: 0 } })
  await server.listen()
  const origin = server.resolvedUrls.local[0].replace(/\/$/, '')
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true })
  const send = (method, params) => call(method, params, sessionId)
  const screenshot = async name => {
    if (!process.argv.includes('--screenshots')) return
    const directory = path.resolve('docs/customer-auth-hardening-browser')
    await mkdir(directory, { recursive: true })
    const capture = await send('Page.captureScreenshot', { format: 'png' })
    await writeFile(path.join(directory, `${name}.png`), Buffer.from(capture.data, 'base64'))
  }
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
    return result.result.value
  }
  const wait = async expression => { for (let i = 0; i < 100; i++) { if (await evaluate(expression)) return; await sleep(100) } throw new Error(`Browser assertion timed out: ${expression}`) }
  const fill = async (name, value) => { await evaluate(`(() => { const field=document.querySelector('[name="${name}"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(field,${JSON.stringify(value)}); field.dispatchEvent(new Event('input',{bubbles:true})); })()`); await sleep(50) }
  await send('Page.enable'); await send('Runtime.enable')
  for (const lang of ['vi', 'en']) for (const mode of ['login', 'register', 'verify', 'forgot', 'reset', 'booking', 'booking-guest', 'admin']) {
    await send('Page.navigate', { url: `${origin}/__validation-test?form=${mode}&lang=${lang}${mode === 'reset' ? '#token=' + 'a'.repeat(43) : ''}` })
    await wait("!!document.querySelector('form')")
    if (mode === 'reset') assert.equal(await evaluate('location.hash'), '', 'Reset fragment removed immediately on initial render')
    if (['login', 'register', 'verify', 'forgot', 'reset'].includes(mode)) {
      for (const width of [1440, 1024, 820, 390]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: 864, deviceScaleFactor: 1, mobile: false })
        assert(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), `${mode}: no horizontal overflow at ${width}px`)
        assert(await evaluate(`(() => { const form=document.querySelector('form').getBoundingClientRect(); return form.left>=0 && form.right<=innerWidth })()`), `${mode}: form fits at ${width}px`)
        if (mode === 'login' || mode === 'register') assert(await evaluate(`(() => { const input=document.querySelector('[name=password]').getBoundingClientRect(); const toggle=document.querySelector('.auth-password-toggle').getBoundingClientRect(); return toggle.left>=input.left && toggle.right<=input.right && toggle.top>=input.top && toggle.bottom<=input.bottom })()`), `${mode}: password toggle stays inside input`)
      }
      await send('Emulation.clearDeviceMetricsOverride')
      passed.push(`${mode}/${lang}: 1440/1024/820/390 responsive widths`)
    }
    if (mode === 'login' || mode === 'register') {
      await evaluate("document.querySelector('.auth-password-toggle').click()")
      assert.equal(await evaluate("document.querySelector('[name=password]').type"), 'text', 'Password eye reveals password')
      if (mode === 'register') assert.equal(await evaluate("document.querySelector('[name=confirm]').type"), 'password', 'Confirmation eye is independent')
      await evaluate("document.querySelector('.auth-password-toggle').click()")
      assert.equal(await evaluate("document.querySelector('[name=password]').type"), 'password', 'Password eye hides password')
      assert.equal(await evaluate('window.__submissions'), 0, 'Eye toggle does not submit')
      passed.push(`${mode}/${lang}: responsive width, password eye position and independent visibility`)
    }
    assert(await evaluate('document.querySelector("form").noValidate'), `${mode}: native validation must be disabled`)
    assert.equal(await evaluate('document.querySelectorAll(".form-field-error").length'), 0, `${mode}: untouched fields must have no errors`)
    await evaluate(`window.__nativeValidation=0; document.addEventListener('invalid',()=>window.__nativeValidation++,true); HTMLFormElement.prototype.reportValidity=()=>{window.__nativeValidation++;throw new Error('Native validation UI invoked')}`)
    const hasEmail = !['reset', 'booking', 'booking-guest'].includes(mode)
    if (hasEmail) {
      await fill('email', 'invalid')
      assert.equal(await evaluate('document.querySelectorAll(".form-field-error").length'), 0, `${mode}: no keystroke errors before touch`)
      await evaluate('document.querySelector("[name=email]").focus(); document.querySelector("[name=email]").blur()')
      await wait('document.querySelector("[name=email]").getAttribute("aria-invalid")==="true"')
      const errorId = await evaluate('document.querySelector("[name=email]").getAttribute("aria-describedby")')
      assert(await evaluate(`document.getElementById(${JSON.stringify(errorId)}).parentElement.contains(document.querySelector('[name=email]'))`), 'Email error is inline under its own field')
      await fill('email', 'still-invalid')
      assert.equal(await evaluate('document.querySelector("[name=email]").getAttribute("aria-describedby")'), errorId, 'Stable error ID')
      await fill('email', 'valid@example.test')
      await wait('document.querySelector("[name=email]").getAttribute("aria-invalid")==="false"')
      assert.equal(await evaluate(`!!document.getElementById(${JSON.stringify(errorId)})`), false, 'Touched correction clears error')
      await fill('email', '')
      passed.push(`${mode}/${lang}: untouched typing, invalid email blur, stable inline ARIA error, touched correction`)
    }
    await evaluate('document.querySelector("button[type=submit], .auth-submit").click()')
    await wait('document.querySelectorAll(".form-field-error").length>0')
    const requiredFields = { login: ['email', 'password'], admin: ['email', 'password'], register: ['name', 'phone', 'email', 'password', 'confirm'], verify: ['email'], forgot: ['email'], reset: ['password', 'confirmPassword'], booking: ['name', 'company', 'phone', 'module'], 'booking-guest': ['module'] }[mode]
    for (const name of requiredFields) assert(await evaluate(`document.querySelector('[data-validation-field="${name}"], [name="${name}"]').getAttribute('aria-invalid')==='true'`), `${mode}: submit validates ${name}`)
    const first = mode === 'register' || mode === 'booking' ? 'name' : mode === 'reset' ? 'password' : mode === 'booking-guest' ? 'module' : 'email'
    assert.equal(await evaluate('document.activeElement.dataset.validationField || document.activeElement.name'), first, `${mode}: first invalid field must receive focus`)
    assert.equal(await evaluate('window.__submissions'), 0, `${mode}: invalid submit must not reach API/workflow`)
    assert.equal(await evaluate('window.__nativeValidation'), 0, `${mode}: no native invalid event or popup API`)
    assert(await evaluate(`getComputedStyle(document.activeElement).outlineStyle!=='none' || getComputedStyle(document.activeElement).borderColor!==getComputedStyle(document.querySelector('form')).borderColor`), 'Focus retains visible styling')
    passed.push(`${mode}/${lang}: empty submit shows inline errors, blocks request, focuses ${first}, no native validation`)
    if (mode === 'register' || mode === 'reset') {
      if (mode === 'register') {
        await fill('name', 'Test Customer'); await fill('email', 'customer@example.test')
        await fill('phone', 'not-a-phone')
        await evaluate('document.querySelector(".auth-submit").click()')
        assert.equal(await evaluate('document.activeElement.name'), 'phone', 'Invalid phone receives focus before password')
        assert.equal(await evaluate('window.__submissions'), 0, 'Invalid phone blocks registration')
        await fill('phone', '0900000000')
        await wait('document.querySelector("[name=phone]").getAttribute("aria-invalid")==="false"')
        passed.push(`register/${lang}: phone is required, invalid phone blocks submit, correction clears inline error`)
      }
      await fill('password', 'valid password 123')
      const confirm = mode === 'register' ? 'confirm' : 'confirmPassword'
      await fill(confirm, 'different password')
      await evaluate('document.querySelector(".auth-submit").click()')
      assert.equal(await evaluate('document.activeElement.name'), confirm, 'Mismatch focuses confirmation field')
      await fill(confirm, 'valid password 123')
      await wait('document.querySelectorAll(".form-field-error").length===0')
      passed.push(`${mode}/${lang}: confirmation mismatch stays inline and clears on correction`)
    }
    if (mode === 'booking') {
      await fill('name', 'Test Customer'); await fill('company', 'Test Company'); await fill('phone', 'not-a-phone')
      assert(await evaluate('document.querySelector("[name=phone]").getAttribute("aria-invalid")==="true"'))
      await fill('phone', '0900000000')
      await wait('document.querySelector("[name=phone]").getAttribute("aria-invalid")==="false"')
      passed.push(`booking/${lang}: touched invalid phone correction clears inline error`)
    }
    if (mode === 'booking' || mode === 'booking-guest') {
      await evaluate('document.getElementById("booking-module").click()')
      await wait('!!document.querySelector("[role=option]")')
      await evaluate('document.querySelector("[role=option]").focus()')
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter' })
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter' })
      await wait('document.getElementById("booking-module").getAttribute("aria-invalid")==="false"')
    } else if (mode === 'login' || mode === 'admin') {
      await fill('email', 'customer@example.test'); await fill('password', 'valid password 123')
    } else if (mode === 'forgot' || mode === 'verify') await fill('email', 'customer@example.test')
    await evaluate('document.querySelector("button[type=submit], .auth-submit").click()')
    await wait('window.__submissions===1')
    if (mode === 'register') {
      assert.equal(await evaluate('window.__lastBody.phone'), '0900000000', 'Registration sends phone to API')
      await wait('location.pathname.endsWith("/verify-email")')
      assert(await evaluate('document.querySelector("[name=email]").value==="customer@example.test"'), 'Register redirects with known email')
      assert(await evaluate('document.querySelector("button[type=submit]").disabled'), 'Registration starts resend cooldown')
    }
    if (mode === 'reset') {
      assert.equal(await evaluate('location.hash'), '', 'Reset fragment removed before submission')
      assert.equal(await evaluate('window.__lastBody.token'), 'a'.repeat(43), 'Captured runtime token reaches reset endpoint')
      assert(await evaluate(`![...Object.values(localStorage), ...Object.values(sessionStorage)].some(value=>value.includes('${'a'.repeat(43)}'))`), 'Reset token is absent from browser storage')
    }
    assert.equal(await evaluate('window.__nativeValidation'), 0)
    passed.push(`${mode}/${lang}: valid fields submit exactly once without native validation`)
  }
  for (const lang of ['vi', 'en']) {
    const prefix = lang === 'en' ? '/en' : ''
    for (const scenario of ['hold', 'invalid']) {
      await send('Page.navigate', { url: `${origin}/__validation-test?form=verify&lang=${lang}&scenario=${scenario}&returnTo=${encodeURIComponent(`${prefix}/account/bookings`)}#token=${'a'.repeat(43)}` })
      await wait('window.__calls?.length===1')
      assert.equal(await evaluate('location.hash'), '', 'Verification token removed immediately')
      assert(await evaluate(`![...Object.values(localStorage), ...Object.values(sessionStorage)].some(value=>value.includes('${'a'.repeat(43)}'))`), 'Verification token is absent from storage')
      if (scenario === 'hold') {
        assert.equal(await evaluate('document.querySelectorAll("form").length'), 0, 'Compact verifying state has no resend form')
        await evaluate('window.__resolveVerification()')
        await wait('!!document.querySelector(".auth-verification-continue")')
        assert.equal(await evaluate('document.querySelector(".auth-verification-continue").getAttribute("href")'), `${prefix}/login?returnTo=${encodeURIComponent(`${prefix}/account/bookings`)}`, 'Success requires login with safe returnTo')
      } else {
        await wait('!!document.querySelector("form")')
        assert(await evaluate('!document.body.textContent.includes("private backend error")'), 'Invalid state hides raw backend errors')
      }
      for (const width of [1440, 1024, 820, 390]) {
        await send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false })
        assert(await evaluate('document.documentElement.scrollWidth<=innerWidth'), `${scenario}: no overflow at ${width}px`)
      }
      await send('Emulation.clearDeviceMetricsOverride')
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 900, deviceScaleFactor: 1, mobile: false })
      await screenshot(`verify-${scenario === 'hold' ? 'success' : 'invalid'}-${lang}-390`)
      await send('Emulation.clearDeviceMetricsOverride')
      assert.equal(await evaluate('window.__calls.length'), 1, 'StrictMode verification submits exactly once')
      passed.push(`verify/${lang}/${scenario}: single request, immediate URL cleanup, protected runtime token, state and safe target, responsive`)
    }
    await send('Page.navigate', { url: `${origin}/__validation-test?form=verify&lang=${lang}&returnTo=${encodeURIComponent('https://attacker.test')}` })
    await wait('!!document.querySelector("form")')
    await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
    await screenshot(`verify-waiting-${lang}-1440`)
    await send('Emulation.clearDeviceMetricsOverride')
    assert.equal(await evaluate('document.querySelector(".auth-switch a").getAttribute("href")'), `${prefix}/login?returnTo=${encodeURIComponent(`${prefix}/booking`)}`, 'Unsafe target falls back to booking via login')
    await fill('email', 'customer@example.test')
    await evaluate('document.querySelector("button[type=submit]").click()')
    await wait('document.querySelector("button[type=submit]").disabled')
    const first = await evaluate('document.querySelector("button[type=submit]").textContent')
    await sleep(1200)
    assert.notEqual(await evaluate('document.querySelector("button[type=submit]").textContent'), first, 'Cooldown counts down')
    await evaluate('Date.now=()=>new Date().getTime()+61000')
    await wait('!document.querySelector("button[type=submit]").disabled')
    assert.equal(await evaluate('window.__submissions'), 1, 'Cooldown prevents duplicate resend')
    passed.push(`verify/${lang}: waiting state, enumeration-safe resend, countdown disabled then enabled, unsafe target rejected`)
    await send('Page.navigate', { url: `${origin}/__validation-test?form=login&lang=${lang}&scenario=unverified&returnTo=${encodeURIComponent(`${prefix}/account/bookings`)}` })
    await wait('!!document.querySelector("[name=password]")')
    await fill('email', 'customer@example.test'); await fill('password', 'valid password 123')
    await evaluate('document.querySelector(".auth-submit").click()')
    await wait('location.pathname.endsWith("/verify-email")')
    assert.equal(await evaluate('document.querySelector("[name=email]").value'), 'customer@example.test', 'Unverified login enters verification flow with known email')
    assert.equal(await evaluate('window.__submissions'), 1, 'Unverified login does not automatically resend')
    passed.push(`login/${lang}: EMAIL_NOT_VERIFIED redirects without authenticated customer state`)
  }
  assert.deepEqual(exceptions, [], 'No unhandled browser exceptions')
  console.log(JSON.stringify({ passed: passed.length, checks: passed, unhandledExceptions: exceptions.length }, null, 2))
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  await call('Browser.close').catch(() => {})
  await new Promise(resolve => { if (chrome.exitCode !== null) resolve(); else { chrome.once('exit', resolve); chrome.kill() } })
  server?.httpServer?.closeAllConnections()
  await Promise.race([server?.close(), sleep(5000)])
  const resolved = path.resolve(profile), root = path.resolve(tmpdir()) + path.sep
  assert(resolved.startsWith(root) && path.basename(resolved).startsWith('neotek-validation-'))
  await rm(resolved, { recursive: true, force: true })
}
