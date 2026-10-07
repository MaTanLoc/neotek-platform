/* global process, console, setTimeout, clearTimeout */
import { spawn } from 'node:child_process'
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { validateSectionContent } = require('../../Neotek Backend/dist/src/sections/validation/section-content.registry.js')
const profile = await mkdtemp(path.join(tmpdir(), 'neotek-phase3-'))
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-first-run', '--remote-debugging-pipe', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'] })
let sequence = 0, buffer = ''
const pending = new Map()
chrome.stdio[4].on('data', data => {
  buffer += data.toString()
  let end
  while ((end = buffer.indexOf('\0')) !== -1) {
    const item = JSON.parse(buffer.slice(0, end)); buffer = buffer.slice(end + 1)
    if (pending.has(item.id)) { const task = pending.get(item.id); pending.delete(item.id); clearTimeout(task.timer); item.error ? task.reject(new Error(item.error.message)) : task.resolve(item.result) }
  }
})
const call = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
  const id = ++sequence
  const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timed out: ${method}`)) }, 15000)
  pending.set(id, { resolve, reject, timer })
  chrome.stdio[3].write(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }) + '\0')
})
let server
try {
  require('../../Neotek Backend/node_modules/dotenv').config({path:'../Neotek Backend/.env',quiet:true})
  const {PrismaClient}=require('../../Neotek Backend/node_modules/@prisma/client')
  const prisma=new PrismaClient()
  let fixtures
  try {
    fixtures=await prisma.page.findMany({where:{OR:[{slug:{in:['home','solutions']}},{kind:'SOLUTION_DETAIL'}]},include:{translations:true,sections:{include:{translations:true},orderBy:{sortOrder:'asc'}}}});
    const {resolveSharedTranslations}=require('../../Neotek Backend/dist/src/sections/shared-content.js');
    for(const page of fixtures) for(const section of page.sections) section.translations=await resolveSharedTranslations(prisma,section.translations);
  } finally {await prisma.$disconnect()}
  for (const page of fixtures) for (const section of page.sections) {
    if (['cta', 'faq', 'trustedBy'].includes(section.key)) Object.assign(section, { source: 'shared.' + (section.key === 'trustedBy' ? 'trustedLogos' : section.key), sharedPages: ['home', 'solutions'] });
  }
  server=createServer(async(req,res)=>{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
    const asset=pathname.startsWith('/assets/')
    const file=path.resolve(asset && !pathname.match(/^\/assets\/[^/]+\.(js|css)$/) ? 'public' : 'dist', asset ? '.'+pathname : 'index.html')
    if(!file.startsWith(path.resolve('dist')+path.sep)&&!file.startsWith(path.resolve('public')+path.sep)){res.writeHead(403);res.end();return}
    try {const data=await readFile(file);res.writeHead(200,{'Content-Type':file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':file.endsWith('.svg')?'image/svg+xml':file.endsWith('.woff2')?'font/woff2':'text/html'});res.end(data)}catch{res.writeHead(404);res.end()}
  })
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve))
  const base='http://127.0.0.1:'+server.address().port
  const {targetId}=await call('Target.createTarget',{url:'about:blank'})
  const {sessionId}=await call('Target.attachToTarget',{targetId,flatten:true})
  const evaluate=async expression=>{const result=await call('Runtime.evaluate',{expression:"{\n"+expression+"\n}",awaitPromise:true,returnByValue:true},sessionId);if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value}
  await call('Page.enable',{},sessionId)
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]},sessionId)
  await call('Page.addScriptToEvaluateOnNewDocument',{source: `
    window.fixtures=JSON.parse(sessionStorage.getItem('solutionDetailFixtures')||'null')||${JSON.stringify(fixtures)};window.requests=[];window.saved=[];
    for(const context of ['overview','section','article']){const key='neotek:cms:tutorial:v1:test:'+context;if(context!==sessionStorage.getItem('tutorialTest')&&!localStorage.getItem(key))localStorage.setItem(key,'seen');}
    window.confirm=()=>{throw Error('Native confirm used')};window.alert=()=>{throw Error('Native alert used')};
    const nativeFetch=window.fetch;
    window.fetch=async(url,options={})=>{
      const parsed=new URL(url,location.href);const route=parsed.pathname.replace(/^\\/api/,'');
      if(parsed.hostname==='api.cloudinary.com')return new Response(JSON.stringify({secure_url:'https://res.cloudinary.com/demo/image/upload/test.png',public_id:'test'}),{headers:{'Content-Type':'application/json'}});
      if(!parsed.pathname.startsWith('/api'))return nativeFetch(url,options);
      window.requests.push({route,method:options.method||'GET'});
      const reply=data=>new Response(JSON.stringify(data),{headers:{'Content-Type':'application/json'}});
      if(route==='/auth/me')return reply({user:{id:'test',email:'editor@example.test',role:'ADMIN'}});
      if(route==='/auth/csrf')return reply({csrfToken:'csrf'});
      if(route==='/admin/pages')return reply(window.fixtures);
      const detailList=()=>window.fixtures.filter(page=>page.kind==='SOLUTION_DETAIL').map(page=>({id:page.id,slug:page.slug,status:page.status,locales:page.translations.filter(t=>t.title&&JSON.stringify(page.sections.find(s=>s.type==='solutionArticle')?.translations.find(a=>a.locale===t.locale)?.content).includes('"text"')).map(t=>t.locale)}));
      if(route==='/admin/solutions'&&options.method==='POST'){
        if(options.headers['x-csrf-token']!=='csrf')throw Error('Missing create CSRF');
        const {moduleKey}=JSON.parse(options.body);window.createdModule=moduleKey;
        const module=window.fixtures.find(p=>p.slug==='solutions').sections.find(s=>s.type==='solutionModules').translations.find(t=>t.locale==='vi').content.items.find(m=>m.key===moduleKey);
        if(window.fixtures.some(p=>p.kind==='SOLUTION_DETAIL'&&p.slug===module.slug))return new Response('{}',{status:409});
        const page=structuredClone(window.fixtures.find(p=>p.kind==='SOLUTION_DETAIL'));Object.assign(page,{id:'browser-created-detail',slug:module.slug,status:'DRAFT',publishedAt:null});
        for(const translation of page.translations)translation.title=module.title;
        for(const section of page.sections)for(const translation of section.translations){if(section.key==='hero')translation.content.title=module.title;if(section.key==='article')translation.content.doc={type:'doc',content:[{type:'paragraph'}]};}
        window.fixtures.push(page);sessionStorage.setItem('solutionDetailFixtures',JSON.stringify(window.fixtures));return reply(page);
      }
      if(route==='/admin/solutions')return reply(detailList());
      if(route.startsWith('/admin/solutions/')&&options.method==='PUT'){
        if(window.failSave)return new Response('{}',{status:500});
        if(options.headers['x-csrf-token']!=='csrf')throw Error('Missing detail CSRF');
        const page=window.fixtures.find(p=>p.id===route.split('/').pop()),body=JSON.parse(options.body);window.detailSaved=body;
        Object.assign(page,{slug:body.slug,status:body.status,publishedAt:body.status==='PUBLISHED'?new Date().toISOString():null});
        for(const locale of ['vi','en']){Object.assign(page.translations.find(t=>t.locale===locale),body.translations[locale]);for(const section of page.sections){section.enabled=body.visible;section.translations.find(t=>t.locale===locale).content=section.key==='related'?body.related:body.translations[locale][section.key];}}
        sessionStorage.setItem('solutionDetailFixtures',JSON.stringify(window.fixtures));return reply(page);
      }
      if(route.startsWith('/admin/solutions/'))return reply(window.fixtures.find(p=>p.slug===route.split('/').pop()));
      if(route==='/pages/solution-details')return reply(detailList().filter(page=>page.status==='PUBLISHED'));
      if(route==='/admin/media/upload-signature')return reply({uploadUrl:'https://api.cloudinary.com/v1_1/demo/image/upload',params:{timestamp:1},apiKey:'test',signature:'test'});
      if(route.startsWith('/admin/pages/'))return reply(window.fixtures.find(p=>p.slug===route.split('/').pop()));
      if(route.startsWith('/admin/sections/')&&route.endsWith('/translations')){
        if(window.failSave)return new Response('{}',{status:500});
        const body=JSON.parse(options.body);if(options.headers['x-csrf-token']!=='csrf')throw Error('Missing CSRF');window.saved.push(body);
        return reply(body.translations);
      }
      if(route.startsWith('/pages/')){
        const page=window.fixtures.find(p=>p.slug===route.split('/').pop());const locale=parsed.searchParams.get('locale')||'vi';
        if(!page||(page.kind==='SOLUTION_DETAIL'&&page.status!=='PUBLISHED'))return new Response('{}',{status:404});
        const translation=page.translations.find(t=>t.locale===locale);
        return reply({slug:page.slug,locale,kind:page.kind,updatedAt:page.updatedAt,publishedAt:page.publishedAt,title:translation.title,seo:{title:translation.seoTitle,description:translation.seoDescription},sections:page.sections.filter(s=>s.enabled).map(s=>({key:s.key,type:s.type,content:s.translations.find(t=>t.locale===locale)?.content||{}}))});
      }
      throw Error('Unmocked API: '+route);
    };
  `},sessionId)
  const navigate=async route=>{await call('Page.navigate',{url:base+route},sessionId);await evaluate('new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{if(document.querySelector("h1")||document.querySelector(".admin-page-summary")){clearInterval(timer);resolve()}else if(++n>100){clearInterval(timer);reject(Error("Route did not render "+location.pathname))}},50)})')}
  const trustedSnapshots = new Map();
  for(const route of ['/','/en','/solutions','/en/solutions']){
    for(const width of [1440,1024,820,390]){
      await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false},sessionId)
      await navigate(route)
      await evaluate('new Promise(resolve=>setTimeout(resolve,200))')
      const dimensions=await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth,title:document.querySelector("h1").textContent,missingImages:[...document.querySelectorAll("main img")].filter(i=>!i.getAttribute("src")).length,clamp:document.querySelector(".solutions-cluster__description")?getComputedStyle(document.querySelector(".solutions-cluster__description")).webkitLineClamp:null,containers:[...document.querySelectorAll(".solutions-hero__title-line,.solutions-cluster__description")].map(e=>({scroll:e.scrollWidth,width:e.clientWidth}))})')
      assert(dimensions.scroll<=width+1,route+' overflow at '+width+': '+dimensions.scroll)
      assert.equal(dimensions.missingImages,0,route+' empty media')
      const logos = await evaluate('[...document.querySelectorAll(".trusted-by-logo-item")].map(node=>({src:node.querySelector("img")?.getAttribute("src"),alt:node.querySelector("img")?.getAttribute("alt"),width:node.style.getPropertyValue("--logo-width"),scale:node.style.getPropertyValue("--logo-scale")}))');
      assert(logos.length > 0, route + ' missing logo marquee');
      const logoKey = (route.startsWith('/en') ? 'en' : 'vi') + width;
      if (route.includes('solutions')) {
        assert.deepEqual(logos, trustedSnapshots.get(logoKey), 'Home/Solutions logo marquee differs');
        assert(await evaluate('document.querySelector(".solutions-hero__inner").getBoundingClientRect().width <= 1280'), 'Hero container too wide');
      } else trustedSnapshots.set(logoKey, logos);
      if (!route.includes('solutions')) {
        assert.equal(await evaluate('document.querySelectorAll(".solution-panel").length'),4)
        assert.equal(await evaluate('!!document.querySelector(".neotek-footer-cta")'),true)
      }
      if(route.includes('solutions')){
        assert((width<768?['3']:['none','']).includes(dimensions.clamp),'Unexpected responsive description clamp');dimensions.containers.forEach(d=>assert(d.scroll<=d.width+1,'Text clipped'));
        await evaluate('window.scrollTo(0,800);new Promise(resolve=>setTimeout(resolve,1200))');
        assert(await evaluate('Math.abs(document.querySelector(".neotek-navbar.is-visible").getBoundingClientRect().top)<=1'),'Solutions navbar scrolls away');
        assert.equal(await evaluate('document.querySelector(".neotek-navbar.is-visible").parentElement===document.body'),true,'Navbar remains in transformed wrapper');
      }
    }
  }
  for (const route of ['/solutions/crm','/en/solutions/crm','/solutions/not-a-detail','/en/solutions/not-a-detail']) { await navigate(route);assert.equal(await evaluate('!!document.querySelector(".neotek-not-found")'),true,'Unexpected detail route '+route) }
  await evaluate('sessionStorage.setItem("tutorialTest","overview");localStorage.removeItem("neotek:cms:tutorial:v1:test:overview")');
  await navigate('/admin');await evaluate('new Promise(resolve=>setTimeout(resolve,1200))');
  assert.equal(await evaluate('!!document.querySelector(".admin-tutorial-panel")'),true,'First-time overview tutorial missing');
  assert.equal(await evaluate('!!document.querySelector(".admin-overview-card[href=\\"/admin/solution-details\\"]")'),true,'Detail overview card missing');
  await evaluate('document.querySelector(".admin-tutorial-panel input").click();[...document.querySelectorAll(".admin-tutorial-panel button")].find(b=>b.textContent==="Bỏ qua hướng dẫn").click()');
  assert.equal(await evaluate('localStorage.getItem("neotek:cms:tutorial:v1:test:overview")'),'suppressed','Tutorial opt-out not persisted');
  for(const width of [1440,1024,820,390]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false},sessionId);
    await navigate('/admin/solution-details');await evaluate('new Promise(resolve=>setTimeout(resolve,1000))');
    assert.equal(await evaluate('!!document.querySelector(".admin-detail-manager")'),true,'Detail manager missing');
    assert.equal(await evaluate('!!document.querySelector(".admin-tutorial-panel")'),false,'Opted-out context reappeared');
    assert.equal(await evaluate('!!document.querySelector("#admin-detail-pages a[href=\\"/admin/solutions/nhan-su-tien-luong\\"]")'),true,'Dynamic detail sidebar link missing');
    assert(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Manager horizontal overflow');
    await evaluate('const input=document.querySelector(".admin-detail-filters input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,"Nhân sự");input.dispatchEvent(new Event("input",{bubbles:true}))');
    await evaluate('new Promise(resolve=>setTimeout(resolve,100))');
    assert.equal(await evaluate('document.querySelectorAll(".admin-detail-manager tbody tr").length'),1,'Manager search failed');
    await evaluate('const input=document.querySelector(".admin-detail-filters input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,"");input.dispatchEvent(new Event("input",{bubbles:true}));const button=document.querySelector("button[aria-label=\\"Trợ giúp CMS\\"]");button.dispatchEvent(new PointerEvent("pointerdown",{bubbles:true,button:0,pointerType:"mouse"}));');
    await evaluate('new Promise(resolve=>setTimeout(resolve,100))');
    await evaluate('[...document.querySelectorAll("[role=menuitem]")].find(item=>item.textContent==="Xem lại hướng dẫn").click()');
    await evaluate('new Promise(resolve=>setTimeout(resolve,100))');
    assert(await evaluate('(()=>{const r=document.querySelector(".admin-tutorial-panel").getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight})()'),'Tutorial outside viewport');
    await evaluate('document.querySelector(".admin-tutorial-close").click()');
  }
  await evaluate('document.querySelector(".admin-page-heading button").click()');
  await evaluate('new Promise(resolve=>setTimeout(resolve,100))');
  assert.equal(await evaluate('document.querySelector(".admin-detail-manager form button").disabled'),true,'Unsaved module slug must not create an invalid detail');
  assert.equal(await evaluate('!!document.querySelector(".admin-detail-manager form a[href=\\"/admin/pages/solutions/modules\\"]")'),true,'Missing slug setup workflow not linked');
  await evaluate('const page=window.fixtures.find(p=>p.slug==="solutions");for(const translation of page.sections.find(s=>s.type==="solutionModules").translations){translation.content.items.find(m=>m.key==="crm").slug="crm";}sessionStorage.setItem("solutionDetailFixtures",JSON.stringify(window.fixtures));');
  await navigate('/admin/solution-details');await evaluate('new Promise(resolve=>setTimeout(resolve,200))');
  await evaluate('document.querySelector(".admin-page-heading button").click()');await evaluate('new Promise(resolve=>setTimeout(resolve,100))');
  const createKey=await evaluate('document.querySelector(".admin-detail-manager form select").value');
  await evaluate('document.querySelector(".admin-detail-manager form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}))');
  await evaluate('new Promise(resolve=>setTimeout(resolve,500))');
  assert.equal(await evaluate('window.createdModule'),createKey,'Manager did not reuse module-key create API');
  assert.equal(await evaluate('!!document.querySelector(".admin-article-document")'),true,'Create workflow did not open existing editor');
  await evaluate('window.fixtures=window.fixtures.filter(page=>page.id!=="browser-created-detail");sessionStorage.setItem("solutionDetailFixtures",JSON.stringify(window.fixtures));sessionStorage.setItem("tutorialTest","section");localStorage.removeItem("neotek:cms:tutorial:v1:test:section")');
  await navigate('/admin/pages/home/hero');await evaluate('new Promise(resolve=>setTimeout(resolve,1200))');
  assert.equal(await evaluate('document.querySelector(".admin-tutorial-panel small").textContent.includes("1/3")'),true,'Section tutorial missing');
  await evaluate('document.querySelector(".admin-tutorial-close").click();sessionStorage.setItem("tutorialTest","article");localStorage.removeItem("neotek:cms:tutorial:v1:test:article")');
  await navigate('/admin/solutions/nhan-su-tien-luong');await evaluate('new Promise(resolve=>setTimeout(resolve,1200))');
  for(let step=1;step<=8;step++) {
    assert.equal(await evaluate(`document.querySelector(".admin-tutorial-panel small").textContent.includes("${step}/8")`),true,'Article tutorial step missing');
    await evaluate('[...document.querySelectorAll(".admin-tutorial-panel button")].find(b=>["Tiếp tục","Hoàn tất"].includes(b.textContent)).click()');
    await evaluate('new Promise(resolve=>setTimeout(resolve,60))');
  }
  assert.equal(await evaluate('!!document.querySelector(".admin-tutorial-panel")'),false,'Completed article tutorial still open');
  await evaluate('sessionStorage.removeItem("tutorialTest")');
  await navigate('/admin/pages/home/hero')
  assert.equal(await evaluate('!!document.querySelector(".admin-language-buttons")'),false)
  assert.equal(await evaluate('document.querySelectorAll(".admin-section-heading-copy").length'),0)
  await evaluate('const input=document.querySelector(".admin-language-panel textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(input,"Draft text");input.dispatchEvent(new Event("input",{bubbles:true}));')
  await evaluate('new Promise(resolve=>setTimeout(resolve,50))')
  await evaluate('[...document.querySelectorAll("a")].find(a=>a.getAttribute("href")==="/admin/pages/solutions").click()')
  await evaluate('new Promise(resolve=>setTimeout(resolve,50))')
  assert.equal(await evaluate('!!document.querySelector("[role=alertdialog]")'),true)
  await evaluate('document.querySelector("[role=alertdialog] button").click()')
  assert.equal(await evaluate('location.pathname'),'/admin/pages/home/hero')
  assert.equal(await evaluate('document.querySelector(".admin-language-panel textarea").value'),'Draft text')
  await evaluate('[...document.querySelectorAll("a")].find(a=>a.getAttribute("href")==="/admin/pages/solutions").click()')
  await evaluate('new Promise(resolve=>setTimeout(resolve,50))')
  await evaluate('document.querySelector("[role=alertdialog] button:last-child").click()')
  await evaluate('new Promise(resolve=>setTimeout(resolve,200))')
  assert.equal(await evaluate('location.pathname'),'/admin/pages/solutions')
  assert.equal(await evaluate('!!document.querySelector(".admin-language-buttons")'),false)
  await navigate('/admin/pages/solutions/hero')
  await evaluate('new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{if(document.querySelectorAll(".solutions-hero").length===2){clearInterval(timer);resolve()}else if(++n>100){clearInterval(timer);reject(Error("Hero preview did not load"))}},50)})')
  assert.equal(await evaluate('document.querySelectorAll(".solutions-hero").length'),2)
  await navigate('/admin/pages/home/faq')
  await evaluate('const input=document.querySelector(".admin-collection-card .admin-language-panel textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(input,"Changed question");input.dispatchEvent(new Event("input",{bubbles:true}));')
  await evaluate('new Promise(resolve=>setTimeout(resolve,50))')
  await evaluate('const form=document.querySelector(".admin-section-form");form.dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));')
  await evaluate('new Promise(resolve=>setTimeout(resolve,100))')
  const saved=await evaluate('window.saved[0]');assert(saved?.translations.vi&&saved.translations.en)
  validateSectionContent('faq',saved.translations.vi.content);validateSectionContent('faq',saved.translations.en.content)
  await evaluate('const input=document.querySelector(".admin-collection-card .admin-language-panel textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(input,"Failed save draft");input.dispatchEvent(new Event("input",{bubbles:true}));window.failSave=true;')
  await evaluate('new Promise(resolve=>setTimeout(resolve,50))')
  await evaluate('document.querySelector(".admin-section-form").dispatchEvent(new Event("submit",{bubbles:true,cancelable:true}));')
  await evaluate('new Promise(resolve=>setTimeout(resolve,100))')
  assert.equal(await evaluate('document.querySelectorAll(".admin-semantic-status").length'),1);assert.equal(await evaluate('!!document.querySelector(".admin-title-section-meta .admin-semantic-status--error")'),true)
  assert.equal(await evaluate('document.querySelector(".admin-collection-card .admin-language-panel textarea").value'),'Failed save draft')
  await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.trim()==="Bỏ thay đổi").click()')
  await evaluate('new Promise(resolve=>setTimeout(resolve,50))')
  await evaluate('document.querySelector("[role=alertdialog] button:last-child").click();window.failSave=false;')
  await evaluate('new Promise(resolve=>setTimeout(resolve,50))')
  assert.equal(await evaluate('document.querySelector(".admin-collection-card .admin-language-panel textarea").value'),'Changed question')
  assert.equal(await evaluate('!!document.querySelector(".admin-semantic-status--error")'),false,'Discard retained a stale save error')
  assert.equal(await evaluate('window.requests.filter(r=>r.route==="/admin/pages/home").length'),1)
  const clickHref=async href=>evaluate('[...document.querySelectorAll("a")].find(a=>a.getAttribute("href")==='+JSON.stringify(href)+').click()')
  const pause=()=>evaluate('new Promise(resolve=>setTimeout(resolve,150))')
  await clickHref('/admin/pages/solutions');await pause()
  await clickHref('/admin/pages/home/faq');await pause()
  await evaluate('const input=document.querySelector(".admin-collection-card .admin-language-panel textarea");Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,"value").set.call(input,"Back guard draft");input.dispatchEvent(new Event("input",{bubbles:true}));')
  await pause();await evaluate('history.back()');await pause()
  assert.equal(await evaluate('!!document.querySelector("[role=alertdialog]")'),true)
  assert.equal(await evaluate('location.pathname'),'/admin/pages/home/faq')
  await evaluate('document.querySelector("[role=alertdialog] button").click()');await pause()
  assert.equal(await evaluate('document.querySelector(".admin-collection-card .admin-language-panel textarea").value'),'Back guard draft')
  await evaluate('history.back()');await pause();await evaluate('document.querySelector("[role=alertdialog] button:last-child").click()');await pause()
  assert.equal(await evaluate('location.pathname'),'/admin/pages/solutions')
  await evaluate('history.forward()');await pause();assert.equal(await evaluate('location.pathname'),'/admin/pages/home/faq')
  for (const page of fixtures.filter(page => page.kind !== 'SOLUTION_DETAIL')) for (const section of page.sections) {
    await navigate(`/admin/pages/${page.slug}/${section.key}`)
    assert.equal(await evaluate('!!document.querySelector(".admin-editor-fields")'),true,`${page.slug}.${section.key} editor missing`)
    assert.equal(await evaluate('!!document.querySelector(".admin-language-buttons")'),false,`${page.slug}.${section.key} locale controls duplicated`)
    assert.equal(await evaluate('document.querySelectorAll(".admin-technical-details, .admin-item-identity, pre").length'),0,`${page.slug}.${section.key} exposes technical data`)
    if (section.type === 'solutionModules') {
      const groups=page.sections.find(section=>section.type==='solutionGroups').translations.find(t=>t.locale==='vi').content.items
      const count=await evaluate('document.querySelector(".admin-editor-items").querySelectorAll(":scope > .admin-editor-tabs > .admin-editor-tab-rail [role=tab]").length')
      assert.equal(count,groups.length,'Module editor has flat top-level tabs')
      assert.equal(await evaluate('document.querySelectorAll(".admin-editor-items")[1].querySelectorAll(":scope > .admin-editor-tabs > .admin-editor-tab-rail [role=tab]").length'),groups[0].modules.length)
    }
    if (section.type === 'solutionModules') assert.equal(await evaluate('!!document.querySelector(".admin-editor-fields > .admin-standard-editor > .admin-form-grid")'),false,'Empty module heading row')
    if (section.type === 'trustedLogos' && page.slug === 'home') {
      await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false},sessionId)
      const layout=await evaluate('({columns:getComputedStyle(document.querySelector(".admin-bilingual-panel")).gridTemplateColumns.split(" ").length,previews:document.querySelectorAll(".admin-media-preview").length})')
      assert.equal(layout.previews,1)
      assert.equal(layout.columns,2)
      await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true},sessionId)
      assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-bilingual-panel")).gridTemplateColumns.split(" ").length'),1)
      await call('Emulation.setDeviceMetricsOverride',{width:820,height:1000,deviceScaleFactor:1,mobile:false},sessionId)
    }
    for (const width of [1440,1024,820]) {
      await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false},sessionId)
      await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
      const languageLayout = await evaluate('(() => { const panels=[...document.querySelectorAll(".admin-bilingual-panel")]; return panels.map(panel=>({count:panel.querySelectorAll(":scope > .admin-language-panel").length,columns:getComputedStyle(panel).gridTemplateColumns.split(" ").length,align:getComputedStyle(panel).alignItems,headings:[...panel.querySelectorAll(":scope > section > strong")].map(node=>node.textContent)})) })()')
      for (const layout of languageLayout) { assert.equal(layout.count,2); assert.equal(layout.columns,width===1440?2:1); assert.equal(layout.align,'start'); assert.deepEqual(layout.headings,['VI','EN']) }
      assert.equal(await evaluate('document.querySelectorAll(".admin-semantic-status--success").length'),1,'Duplicate saved state')
      if (['why','testimonials','trustedLogos','cta','solutionClusters','solutionOverview','solutionGroups','solutionModules'].includes(section.type)) {
        const labels=await evaluate('[...document.querySelectorAll(".admin-editor-fields [role=tab]")].map(node=>node.textContent)');
        assert(!labels.some(label=>['N\u1ed9i dung','H\u00ecnh \u1ea3nh','Hi\u1ec3n th\u1ecb','Thi\u1ebft l\u1eadp section'].includes(label)), 'Unnecessary inner tabs '+section.type);
      }
      if (['cta','faq','trustedBy'].includes(section.key)) assert.equal(await evaluate('!!document.querySelector(".admin-shared-source")'),true);
      if (section.type==='testimonials') {
        await evaluate('[...document.querySelectorAll("button")].find(node=>node.textContent.trim()==="Ch\u1ec9nh \u1ea3nh").click()');await pause();
        assert.equal(await evaluate('document.querySelectorAll("[role=dialog] .admin-image-position").length'),0);
        const bounds=await evaluate('document.querySelector(".admin-media-dialog").getBoundingClientRect().toJSON()');assert(bounds.left>=0&&bounds.right<=width+1);
        if(width===820){const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);await writeFile('docs/admin-editor-portrait-dialog-820.png',Buffer.from(shot.data,'base64'));}
        await evaluate('document.querySelector("[role=dialog] .admin-surface-heading button").click()');await pause();
        assert.equal(await evaluate('document.querySelectorAll(".admin-semantic-status--success").length'),1);
      }
      const fieldTabs = await evaluate('(() => {const rails=[...document.querySelectorAll(".admin-editor-tab-rail")];const rail=rails.at(-1);return rail?[...rail.querySelectorAll("[role=tab]")].map(tab=>tab.textContent):[]})()')
      for (const title of fieldTabs) {
        await evaluate('const rails=[...document.querySelectorAll(".admin-editor-tab-rail")];const button=[...rails.at(-1).querySelectorAll("[role=tab]")].find(button=>button.textContent==='+JSON.stringify(title)+');button.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,button:0}));button.click();')
        await pause()
        if (section.type === 'solutionModules' && width === 1440 && title === 'Hình ảnh') {
          await evaluate('document.querySelector(".admin-draft-preview").scrollIntoView({block:"center"})');await pause()
          const screenshot=await call('Page.captureScreenshot',{format:'png'},sessionId)
          await writeFile('docs/admin-editor-module-media-preview-1440.png',Buffer.from(screenshot.data,'base64'))
          await evaluate('document.querySelector(".admin-main").scrollTop=0')
        }
        assert.equal(await evaluate('document.querySelector(".admin-main").scrollWidth<=document.querySelector(".admin-main").clientWidth+1'),true,page.slug+'.'+section.key+' '+title+' overflows at '+width)
      }
      if (fieldTabs.length) { await evaluate('const button=[...document.querySelectorAll(".admin-editor-tab-rail")].at(-1).querySelector("[role=tab]");button.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,button:0}));button.click();');await pause() }
      if (section.type === 'solutionModules' && width === 1440) {
        await evaluate('document.querySelector(".admin-draft-preview").scrollIntoView({block:"center"})');await pause();
        const shot=await call('Page.captureScreenshot',{format:'png'},sessionId);await writeFile('docs/admin-editor-module-media-preview-1440.png',Buffer.from(shot.data,'base64'));
        await evaluate('document.querySelector(".admin-main").scrollTop=0');
      }
      const overflow=await evaluate('({main:document.querySelector(".admin-main").scrollWidth,viewport:document.querySelector(".admin-main").clientWidth})')
      if ((page.slug === 'solutions' && section.type === 'solutionModules') || (page.slug === 'solutions' && section.type === 'solutionGroups' && width === 1440) || (page.slug === 'home' && section.type === 'hero' && width === 1024) || (page.slug === 'home' && section.type === 'testimonials' && width === 820) || (page.slug === 'home' && ['solutionClusters','cta','trustedLogos'].includes(section.type) && width === 1440)) {
        const screenshot = await call('Page.captureScreenshot', { format: 'png' }, sessionId)
        await writeFile('docs/admin-editor-' + page.slug + '-' + section.type + '-' + width + '.png', Buffer.from(screenshot.data, 'base64'))
      }
      assert(overflow.main<=overflow.viewport+1,`${page.slug}.${section.key} clips at ${width}: ${JSON.stringify(overflow)}`)
    }
    if (section.type === 'why') {
      const vi=section.translations.find(t=>t.locale==='vi').content.items
      const en=section.translations.find(t=>t.locale==='en').content.items
      assert.equal(await evaluate('document.querySelectorAll(".admin-editor-items > .admin-editor-tabs > .admin-editor-tab-rail [role=tab]").length'),Math.max(vi.length,en.length),'Legacy Why duplicated locales')
    }
    if (section.type === 'solutionModules') {
      await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false},sessionId)
      const before=await evaluate('document.querySelectorAll(".admin-language-panel")[1].getBoundingClientRect().height')
      await evaluate('document.querySelector(".admin-language-panel textarea").style.height="350px"')
      assert.equal(await evaluate('document.querySelectorAll(".admin-language-panel")[1].getBoundingClientRect().height'),before,'VI resize stretched EN')
    }
  }
  await call('Page.addScriptToEvaluateOnNewDocument',{source:`const solutions=window.fixtures.find(page=>page.slug==='solutions');const groups=solutions.sections.find(section=>section.type==='solutionGroups');const modules=solutions.sections.find(section=>section.type==='solutionModules');for(const translation of groups.translations)translation.content.items[0].visualSrc='/assets/logo/logo_306x98.png';for(const translation of modules.translations)for(const item of translation.content.items)item.visualSrc='';`},sessionId)
  await navigate('/solutions');await pause()
  assert.equal(await evaluate('document.querySelector(".solutions-cluster__visual-image img").getAttribute("src")'),'/assets/logo/logo_306x98.png','Group image fallback not rendered')
  await call('Page.addScriptToEvaluateOnNewDocument',{source:`{const solutions=window.fixtures.find(page=>page.slug==='solutions');const groups=solutions.sections.find(section=>section.type==='solutionGroups');const modules=solutions.sections.find(section=>section.type==='solutionModules');for(const translation of groups.translations){const key=translation.content.items[0].modules[0];modules.translations.find(item=>item.locale===translation.locale).content.items.find(item=>item.key===key).visualSrc='/assets/logo/logo_306x98_w.png';}}`},sessionId)
  await navigate('/solutions');await pause()
  assert.equal(await evaluate('document.querySelector(".solutions-cluster__visual-image img").getAttribute("src")'),'/assets/logo/logo_306x98_w.png','Module image did not take priority')
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".solutions-cluster__visual-image img")).objectFit'),'contain','Module visual crops the image')
  assert.equal(await evaluate('[...document.querySelectorAll("a.solutions-module-cta")].some(a=>!a.href.endsWith("/nhan-su-tien-luong"))'),false,'CTA targets an unimplemented route')
  assert.equal(await evaluate('!!document.querySelector("button.solutions-module-cta:disabled")'),true)

  const detailSlug = 'nhan-su-tien-luong';
  for (const language of ['vi','en']) for (const width of [1440,1024,820,390]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false},sessionId);
    await navigate(`${language==='en'?'/en':''}/solutions/${detailSlug}`);await pause();
    assert.equal(await evaluate('!!document.querySelector(".solution-article")'),true,'Detail article missing');
    assert.equal(await evaluate('document.querySelectorAll("h1").length'),1,'Multiple H1 headings');
    assert.equal(await evaluate('document.querySelectorAll(".solution-detail-toc a").length'),4,'TOC missing');
    assert.equal(await evaluate('document.querySelectorAll(".solution-detail-toc").length'),1,'TOC duplicated');
    assert.equal(await evaluate('[...document.querySelectorAll(".solution-detail-toc a")].every(a=>document.getElementById(a.hash.slice(1)))'),true,'TOC anchors broken');
    assert.equal(await evaluate('document.querySelectorAll(".solution-article-image img").length'),2);
    assert.equal(await evaluate('!!document.querySelector(".solution-article-callout")&&!!document.querySelector(".solution-detail-related")'),true);
    assert.equal(await evaluate('!!document.querySelector(".solution-article-cta")||!!document.getElementById("next-steps")'),false,'Removed article closing block still rendered');
    assert.equal(await evaluate('document.querySelectorAll(".solution-detail-header .solution-detail-meta svg").length'),2,'Editorial metadata icons missing');
    assert.equal(await evaluate('document.querySelectorAll(".solution-detail-related-card").length'),4,'Related cards must use four real modules');
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".solution-detail-related>div")).gridTemplateColumns.split(" ").length'),width>767?2:1,'Editorial mosaic columns');
    assert.equal(await evaluate('document.querySelectorAll(".solution-detail-related-card.is-featured").length'),1,'Mosaic needs one featured card');
    assert.equal(await evaluate('!!document.querySelector(".solution-detail-identity img")'),true,'Real solution identity icon missing');
    assert.equal(await evaluate('document.querySelector(".solution-detail-toc details").open'),width>=1200,'Responsive reading disclosure');
    if(width<1200) assert.equal(await evaluate('getComputedStyle(document.querySelector(".solution-detail-toc")).position'),'static','Disclosure must stay in article flow');
    assert.equal(await evaluate('getComputedStyle(document.querySelector(".solution-article-callout")).backgroundColor'),'rgba(0, 0, 0, 0)','Insight must not be an alert box');
    assert.equal(await evaluate('[...document.querySelectorAll(".solution-detail-related-card")].every(card=>!!card.querySelector("img")&&!!card.querySelector("h3")&&card.href)'),true,'Related card missing thumbnail/title/link');
    assert.equal(await evaluate('document.querySelector("link[rel=canonical]").href'),`https://neotek.vn${language==='en'?'/en':''}/solutions/${detailSlug}`);
    assert.equal(await evaluate('document.querySelectorAll("link[hreflang]").length'),3);
    assert(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Detail public overflow');
    assert(await evaluate('document.querySelector(".solution-detail-header").getBoundingClientRect().top>=document.querySelector(".neotek-navbar.is-visible").getBoundingClientRect().bottom'),'Navbar overlaps article header');
    assert.equal(await evaluate('parseFloat(getComputedStyle(document.querySelector(".solution-detail-header h1")).fontSize)'),width>900?56:width>767?48:36,'Editorial title scale');
    assert(await evaluate('document.querySelector(".solution-detail-content").getBoundingClientRect().width<=1280'),'Page container too wide');
    assert(await evaluate('document.querySelector(".solution-detail-header").getBoundingClientRect().width<=900'),'Header container too wide');
    assert(await evaluate('document.querySelector(".solution-detail-cover img").getBoundingClientRect().height<=420'),'Cover dominates article');
    assert(await evaluate('[...document.querySelectorAll(".solution-article-image")].every(figure=>!!figure.querySelector("figcaption"))'),'Image captions missing');
    if(width===1440)assert(await evaluate('document.querySelector(".solution-article>p").getBoundingClientRect().width<=840'),'Article text too wide');
    if(width===1440) {const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},sessionId);await writeFile(`docs/solution-detail-public-${language}-1440.png`,Buffer.from(shot.data,'base64'));}
    if(width<1200) {
      await evaluate('document.querySelector(".solution-detail-toc summary").click()');
      assert.equal(await evaluate('document.querySelector(".solution-detail-toc details").open'),true,'Reading disclosure cannot open');
    }
    await evaluate('document.querySelectorAll(".solution-article h2")[1].scrollIntoView()');await pause();
    await evaluate('Promise.all([...document.querySelectorAll(".solution-detail-cover img, .solution-article-image img")].map(image=>image.complete?Promise.resolve():new Promise(resolve=>{image.addEventListener("load",resolve,{once:true});image.addEventListener("error",resolve,{once:true})})))');
    await evaluate('new Promise(resolve=>setTimeout(resolve,500))');
    await evaluate('document.querySelectorAll(".solution-article h2")[1].scrollIntoView();new Promise(resolve=>setTimeout(resolve,1200))');
    assert.equal(await evaluate('document.querySelector(".solution-detail-toc a[aria-current]").hash.slice(1)===document.querySelectorAll(".solution-article h2")[1].id'),true,`Reading rail active section not updated ${language}/${width}: ${JSON.stringify(await evaluate('[...document.querySelectorAll(".solution-article h2")].map(h=>({id:h.id,top:h.getBoundingClientRect().top,active:document.querySelector(".solution-detail-toc a[aria-current]").hash}))'))}`);
    assert(await evaluate('Math.abs(document.querySelector(".neotek-navbar.is-visible").getBoundingClientRect().top)<=1'),'Detail navbar scrolls away');
    if(width===1440) {
      assert(await evaluate('Math.abs(document.querySelector(".solution-detail-toc").getBoundingClientRect().top-document.querySelector(".neotek-navbar.is-visible").getBoundingClientRect().bottom-24)<=2'),'Rail must remain below navbar');
      assert(await evaluate('document.querySelector(".solution-detail-toc").getBoundingClientRect().left>document.querySelector(".solution-article>p").getBoundingClientRect().right'),'Reading rail must be on the right');
      assert(await evaluate('document.querySelector(".solution-article>p").getBoundingClientRect().width>=760'),'Rail reduces article readability');
    }
    if(language==='vi' && [1440,390].includes(width)) {
      await evaluate('document.querySelector(".solution-detail-related").scrollIntoView({block:"center"})');
      await evaluate('new Promise((resolve,reject)=>{let count=0;const timer=setInterval(()=>{const images=[...document.querySelectorAll(".solution-detail-related-card img")];if(images.every(image=>image.complete&&image.naturalWidth>0)){clearInterval(timer);resolve()}else if(++count>100){clearInterval(timer);reject(Error("Related thumbnail failed to load: "+JSON.stringify(images.map(image=>({src:image.src,complete:image.complete,width:image.naturalWidth})))))}},100)})');
    }
  }
  for (const width of [1440,1024,820]) {
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false},sessionId);await navigate(`/admin/solutions/${detailSlug}`);await pause();
    assert.equal(await evaluate('!!document.querySelector(".admin-article-document")'),true,'Article editor missing');
    assert(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Detail admin overflow');
  }
  const press=async(key,code,windowsVirtualKeyCode,modifiers=0)=>{await call('Input.dispatchKeyEvent',{type:'keyDown',key,code,windowsVirtualKeyCode,modifiers},sessionId);await call('Input.dispatchKeyEvent',{type:'keyUp',key,code,windowsVirtualKeyCode,modifiers},sessionId);};
  await evaluate('document.querySelector(".admin-article-document p").focus();const p=document.querySelector(".admin-article-document p");const range=document.createRange();range.selectNodeContents(p);range.collapse(false);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);document.querySelector(".admin-article-document").focus();');
  await press('Enter','Enter',13);await call('Input.insertText',{text:'Browser paragraph'},sessionId);
  await press('Enter','Enter',13);await call('Input.insertText',{text:'/'},sessionId);await pause();
  assert.equal(await evaluate('!!document.querySelector(".admin-article-command")'),true,'Slash command menu missing');
  await press('ArrowDown','ArrowDown',40);await press('Enter','Enter',13);await call('Input.insertText',{text:'Browser heading'},sessionId);await pause();
  assert.equal(await evaluate('[...document.querySelectorAll(".admin-article-document h2")].some(node=>node.textContent==="Browser heading")'),true,'Slash H2 failed');
  await evaluate('document.querySelector(".admin-article-block-tools button[title=\\"Nhân đôi\\"]").click()');await pause();
  assert.equal(await evaluate('[...document.querySelectorAll(".admin-article-document h2")].filter(node=>node.textContent==="Browser heading").length'),2,'Block duplicate failed');
  const followingBlock = await evaluate('[...document.querySelectorAll(".admin-article-document h2")].filter(node=>node.textContent==="Browser heading")[1].nextElementSibling.textContent');
  await evaluate('document.querySelector(".admin-article-block-tools button[title=\\"Xuống\\"]").click()');await pause();
  assert.equal(await evaluate('[...document.querySelectorAll(".admin-article-document h2")].filter(node=>node.textContent==="Browser heading")[1].previousElementSibling.textContent'),followingBlock,'Block move down failed');
  await evaluate('document.querySelector(".admin-article-block-tools button[title=\\"Lên\\"]").click()');await pause();
  await evaluate('document.querySelector(".admin-article-block-tools button[title=\\"Xóa đoạn\\"]").click()');await pause();
  assert.equal(await evaluate('[...document.querySelectorAll(".admin-article-document h2")].filter(node=>node.textContent==="Browser heading").length'),1,'Block delete failed');
  await evaluate('const heading=[...document.querySelectorAll(".admin-article-document h2")].find(node=>node.textContent==="Browser heading");const range=document.createRange();range.selectNodeContents(heading);range.collapse(false);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);document.querySelector(".admin-article-document").focus();');
  await press('Enter','Enter',13);await call('Input.insertText',{text:'Bold example'},sessionId);await press('ArrowLeft','ArrowLeft',37,10);await evaluate('new Promise(resolve=>setTimeout(resolve,400))');
  await evaluate('document.querySelector("button[aria-label=\\"Đậm\\"]").click()');await pause();
  assert.equal(await evaluate('!!document.querySelector(".admin-article-document strong")'),true,'Bold toolbar failed');
  await press('ArrowRight','ArrowRight',39);await press('Enter','Enter',13);await call('Input.insertText',{text:'/'},sessionId);await pause();
  await evaluate('[...document.querySelectorAll(".admin-article-command button")].find(b=>b.textContent==="Danh sách dấu đầu dòng").click()');await call('Input.insertText',{text:'Browser list item'},sessionId);await pause();
  assert.equal(await evaluate('[...document.querySelectorAll(".admin-article-document li")].some(node=>node.textContent.includes("Browser list item"))'),true,'List command failed');
  await evaluate('const input=document.querySelector(".admin-article-editor input[type=file]");const transfer=new DataTransfer();transfer.items.add(new File([new Uint8Array([1,2,3])],"test.png",{type:"image/png"}));input.files=transfer.files;input.dispatchEvent(new Event("change",{bubbles:true}));');await pause();
  assert.equal(await evaluate('!!document.querySelector(".admin-article-image img[src*=\\"/demo/\\"]")'),true,'Article Cloudinary simulation failed');
  const imagePoint = await evaluate('const image=document.querySelector(".admin-article-image img[src*=\\"/demo/\\"]");image.scrollIntoView({block:"center"});const rect=image.getBoundingClientRect();({x:rect.x+rect.width/2,y:rect.y+rect.height/2})');
  await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...imagePoint},sessionId);await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...imagePoint},sessionId);await pause();
  await evaluate('[...document.querySelectorAll(".admin-article-node-tools button")].find(button=>button.textContent==="Chú thích & hiển thị").click()');await pause();
  await evaluate('const input=[...document.querySelectorAll(".admin-article-popover label")].find(label=>label.textContent==="Chú thích").querySelector("input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,"Browser image caption");input.dispatchEvent(new Event("input",{bubbles:true}));');await pause();
  await evaluate('const select=document.querySelector(".admin-article-popover select");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(select,"wide");select.dispatchEvent(new Event("change",{bubbles:true}));');await pause();await press('Escape','Escape',27);
  assert.equal(await evaluate('!![...document.querySelectorAll(".admin-article-image[data-display=wide] figcaption")].find(caption=>caption.textContent==="Browser image caption")'),true,'Image caption/display edit failed');
  await evaluate('const p=document.querySelector(".admin-article-document p");const range=document.createRange();range.selectNodeContents(p);range.collapse(false);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);document.querySelector(".admin-article-document").focus();');
  await press('Enter','Enter',13);await call('Input.insertText',{text:'/'},sessionId);await pause();
  await evaluate('[...document.querySelectorAll(".admin-article-command button")].find(button=>button.textContent==="CTA").click()');await pause();
  await evaluate('[...document.querySelectorAll(".admin-article-cta button")].find(b=>b.title==="Chỉnh lời kêu gọi").click()');await pause();
  await evaluate('const input=document.querySelector(".admin-article-dialog input");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,"Browser CTA title");input.dispatchEvent(new Event("input",{bubbles:true}));');await pause();
  await evaluate('const input=[...document.querySelectorAll(".admin-article-dialog select")].find(select=>[...select.options].some(option=>option.value==="final"));Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(input,"final");input.dispatchEvent(new Event("change",{bubbles:true}));');await pause();
  await evaluate('[...document.querySelectorAll(".admin-article-dialog button")].find(b=>b.textContent==="Áp dụng").click()');await pause();
  await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="English").click()');await pause();
  assert.equal(await evaluate('document.querySelector(".admin-article-document").textContent.includes("Browser paragraph")'),false,'VI text overwrote English');
  await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Tiếng Việt").click()');await pause();
  assert.equal(await evaluate('document.querySelector(".admin-article-document").textContent.includes("Browser paragraph")'),true,'VI draft lost during locale switch');
  await evaluate('window.failSave=true;[...document.querySelectorAll("button")].find(b=>b.textContent==="Lưu thay đổi").click()');await pause();
  assert.equal(await evaluate('!!document.querySelector(".admin-alert--error")'),true,'Failed detail save not shown');
  assert.equal(await evaluate('document.querySelector(".admin-article-document").textContent.includes("Browser paragraph")'),true,'Failed save lost draft');
  await evaluate('window.failSave=false;[...document.querySelectorAll("button")].find(b=>b.textContent==="Lưu thay đổi").click()');await pause();
  const savedDetail=await evaluate('window.detailSaved');
  const {detailSaveSchema}=require('../../Neotek Backend/dist/src/sections/validation/solution-detail.schemas.js');
  assert.equal(detailSaveSchema.safeParse(savedDetail).success,true,'Tiptap JSON fails backend validation');
  await evaluate('document.querySelector(".admin-article-document").focus()');await press('End','End',35,2);await call('Input.insertText',{text:'Undo marker'},sessionId);await press('z','KeyZ',90,2);await pause();
  assert.equal(await evaluate('document.querySelector(".admin-article-document").textContent.includes("Undo marker")'),false,'Undo failed');await press('z','KeyZ',90,10);await pause();
  assert.equal(await evaluate('document.querySelector(".admin-article-document").textContent.includes("Undo marker")'),true,'Redo failed');
  await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Lưu thay đổi").click()');await pause();
  await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Xem trang đã lưu").click()');await pause();assert.equal(await evaluate('!!document.querySelector(".admin-detail-preview .solution-article")'),true,'Saved preview missing');
  await evaluate('document.querySelector("button[aria-label=\\"Đóng bản xem\\"]").click()');await pause();
  const screenshot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false},sessionId);await writeFile('docs/solution-detail-admin-820.png',Buffer.from(screenshot.data,'base64'));
  await evaluate('const tab=[...document.querySelectorAll("button[role=tab]")].find(b=>b.textContent==="Cài đặt");tab.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,button:0}));tab.click()');await pause();
  await evaluate('const input=document.querySelector(".admin-editor-tab-panel[data-state=active] select");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(input,"DRAFT");input.dispatchEvent(new Event("change",{bubbles:true}));');await pause();
  await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Lưu thay đổi").click()');await pause();
  await navigate(`/solutions/${detailSlug}`);assert.equal(await evaluate('!!document.querySelector(".neotek-not-found")'),true,'Draft leaked publicly');
  await navigate(`/admin/solutions/${detailSlug}`);await pause();
  assert.equal(await evaluate('document.querySelector(".admin-article-document").textContent.includes("Browser paragraph")'),true,'Save/reload lost article');
  await evaluate('const tab=[...document.querySelectorAll("button[role=tab]")].find(b=>b.textContent==="Cài đặt");tab.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,button:0}));tab.click()');await pause();
  await evaluate('const input=document.querySelector(".admin-editor-tab-panel[data-state=active] select");Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set.call(input,"PUBLISHED");input.dispatchEvent(new Event("change",{bubbles:true}));');await pause();
  await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent==="Lưu thay đổi").click()');await pause();
  await navigate(`/solutions/${detailSlug}`);assert.equal(await evaluate('document.querySelector(".solution-article").textContent.includes("Browser paragraph")'),true,'Published page unavailable');
  assert.equal(await evaluate('!!document.querySelector(".solution-detail-final-cta .solution-article-cta")'),true,'Final page CTA missing');
  await evaluate('const page=window.fixtures.find(page=>page.slug==="nhan-su-tien-luong");const doc=page.sections.find(section=>section.key==="article").translations.find(item=>item.locale==="vi").content.doc;doc.content.push({type:"blockquote",content:[{type:"heading",attrs:{level:2,id:"nested-heading"},content:[{type:"text",text:"Nested heading"}]}]},{type:"heading",attrs:{level:2,id:"collision"},content:[{type:"text",text:"Collision"}]},{type:"heading",attrs:{level:2},content:[{type:"text",text:"Collision"}]});sessionStorage.setItem("solutionDetailFixtures",JSON.stringify(window.fixtures));');
  await navigate(`/solutions/${detailSlug}`);await pause();
  assert.equal(await evaluate('!!document.querySelector(".solution-detail-toc a[href=\\"#nested-heading\\"]")&&!!document.querySelector(".solution-article blockquote h2#nested-heading")'),true,'Nested H2 missing from TOC');
  assert.equal(await evaluate('!!document.querySelector(".solution-detail-toc a[href=\\"#collision-2\\"]")&&document.querySelectorAll(".solution-article #collision").length===1'),true,'Fallback heading anchors collide');
  console.log('PASS public/admin at 1440/1024/820, detail VI/EN at 390: existing regressions, Tiptap typing/Enter/slash/H2/block duplicate/reorder/delete/bold/list/upload/CTA/locales/atomic save validation/failure/undo/redo/saved preview, TOC/SEO/related/final CTA');
} finally {server?.close();chrome.kill();await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200}).catch(error=>console.error('Profile cleanup:',error.code))}
