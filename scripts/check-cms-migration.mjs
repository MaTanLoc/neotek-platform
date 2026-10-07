/* global process, console, setTimeout, clearTimeout */
import { build } from 'esbuild'
import { spawn } from 'node:child_process'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { pairBilingualItems } from '../src/admin/utils/bilingualItems.js'

const originalVi = [{ key: 'one', title: 'VI one' }, { key: 'old-two', title: 'VI two' }]
const originalEn = [{ key: 'different', title: 'EN two' }, { key: 'one', title: 'EN one' }]
const originalSnapshot = JSON.stringify([originalVi, originalEn])
const exactPairs = pairBilingualItems(originalVi, originalEn)
assert.equal(exactPairs[0].en.title, 'EN one')
assert.equal(exactPairs[1].en, undefined, 'Positional fallback must not steal an exact match')
assert.equal(JSON.stringify([originalVi, originalEn]), originalSnapshot)

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
try {
  const { targetId } = await call('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await call('Target.attachToTarget', { targetId, flatten: true })
  const evaluate = async expression => {
    const result = await call('Runtime.evaluate', { expression: "{\n" + expression + "\n}", awaitPromise: true, returnByValue: true }, sessionId)
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text)
    return result.result.value
  }
  const bundle = await build({ write: false, outdir: 'dist', external: ['/assets/*'], bundle: true, format: 'iife', jsx: 'automatic', define: { 'import.meta.env': '{}' }, stdin: { resolveDir: process.cwd(), loader: 'jsx', contents: `
    import React, {useState} from 'react'; import {createRoot} from 'react-dom/client'; import {flushSync} from 'react-dom';
    import {MemoryRouter} from 'react-router-dom';
    import {resolveEditor} from './src/admin/config/sectionRegistry';
    import {ConfirmProvider} from './src/admin/app/ConfirmProvider';
    import {backendApiAdapter} from './src/services/content/adapters/backendApiAdapter';
    import './src/admin/styles/admin.css'; import './src/styles/neotek-tokens.css';
    window.contentAdapter = backendApiAdapter;
    function App() {
      const [value,setValue]=useState(window.fixture.vi),[paired,setPaired]=useState(window.fixture.en);
      const Editor=resolveEditor(window.fixture);
      window.data={vi:value,en:paired}; window.flush=flushSync;
      return <MemoryRouter><ConfirmProvider><Editor sectionKey={window.fixture.sectionKey} pageSlug={window.fixture.pageSlug} moduleOptions={window.fixture.moduleOptions || []} groupOptions={window.fixture.groupOptions || []} value={value} pairedValue={paired} locale="vi" onChange={setValue} onPairedChange={setPaired} pending={false} dirty={true} onSave={()=>{}} onDiscard={()=>{}} /></ConfirmProvider></MemoryRouter>
    }
    const root=createRoot(document.getElementById('root')); window.mount=()=>flushSync(()=>root.render(<App key={window.serial} />));
  ` }, plugins: [{name:'contexts',setup(plugin) {
    plugin.onResolve({filter:/(?:useAuth|cmsContext)$/},()=>({path:'context',namespace:'fixture'}));
    plugin.onLoad({filter:/.*/,namespace:'fixture'},()=>({contents:'export const useAuth=()=>({csrfToken:"csrf",user:{role:"ADMIN"}}); export const useCms=()=>({locale:"vi",dirty:{current:false}});'}));
  }}] })
  await evaluate(`document.body.innerHTML='<div id="root"></div>';window.serial=0;crypto.randomUUID ||= () => 'fixture-' + Math.random().toString(16).slice(2);`)
  await evaluate(bundle.outputFiles.find(file=>file.path.endsWith('.js')).text)
  await evaluate('const style=document.createElement("style");style.textContent='+JSON.stringify(bundle.outputFiles.find(file=>file.path.endsWith('.css')).text)+';document.head.append(style);')
  const setup=async(type,vi,en=structuredClone(vi),pageSlug='home',moduleOptions=[],groupOptions=[])=>{await evaluate('window.fixture='+JSON.stringify({type,sectionKey:'hero',pageSlug,vi,en,moduleOptions,groupOptions})+';window.serial++;window.mount();')}
  const click=async(text)=>{await evaluate('window.flush(()=>{const buttons=[...document.querySelectorAll("button")];const b=buttons.find(b=>b.textContent.trim()==='+JSON.stringify(text)+')||buttons.find(b=>b.getAttribute("aria-label")==='+JSON.stringify(text)+');if(!b)throw Error("Missing button "+'+JSON.stringify(text)+');if(b.getAttribute("role")==="tab")b.dispatchEvent(new MouseEvent("mousedown",{bubbles:true,button:0}));b.click()})')}
  const change=async(selector,value)=>{await evaluate('window.flush(()=>{const input=document.querySelector('+JSON.stringify(selector)+');Object.getOwnPropertyDescriptor(input.tagName==="TEXTAREA"?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,"value").set.call(input,'+JSON.stringify(value)+');input.dispatchEvent(new Event("input",{bubbles:true}));input.dispatchEvent(new Event("change",{bubbles:true}));})')}
  const data=()=>evaluate('window.data')
  const validate=async type=>{const result=await data();validateSectionContent(type,result.vi);validateSectionContent(type,result.en);return result}
  const legacyVi={items:Array.from({length:5},(_,i)=>({key:'vi-'+i,title:'VI '+i,description:'VI description'}))}
  const legacyEn={items:Array.from({length:5},(_,i)=>({key:'en-'+i,title:'EN '+i,description:'EN description'}))}
  await setup('why',legacyVi,legacyEn)
  assert.equal(await evaluate('document.querySelectorAll(".admin-editor-items > .admin-editor-tabs > .admin-editor-tab-rail [role=tab]").length'),5)
  assert.equal(await evaluate('document.querySelectorAll(".admin-editor-items .admin-bilingual-panel").length'),1)
  assert.equal(await evaluate('document.querySelectorAll(".admin-editor-items .admin-language-panel textarea")[1].value'),'EN 0')
  await change('.admin-editor-items .admin-language-panel textarea','Edited VI')
  let pairing=await validate('why');assert.equal(pairing.vi.items[0].title,'Edited VI');assert.equal(pairing.en.items[0].title,'EN 0');assert.equal(pairing.vi.items[0].key,'vi-0');assert.equal(pairing.en.items[0].key,'en-0')
  assert.equal(await evaluate('getComputedStyle(document.querySelector(".admin-media-dropzone")).aspectRatio'),'1 / 1')
  const faq={items:[{key:'faq-1',question:'VI',answer:'<p>Answer</p>'}]}
  await setup('faq',faq,{items:[{key:'faq-1',question:'EN',answer:'<p>English</p>'}]})
  await click('Thêm mục cho VI và EN')
  let result=await validate('faq');assert.equal(result.vi.items.length,2);assert.equal(result.vi.items[1].key,result.en.items[1].key)
  await click('Xóa');assert.equal(await evaluate('!!document.querySelector("[role=alertdialog]")'),true)
  await click('Hủy');assert.equal((await data()).vi.items.length,2)
  await click('Xóa');await click('Xác nhận');await evaluate('new Promise(resolve=>setTimeout(resolve,30))');result=await validate('faq');assert.equal(result.vi.items.length,1);assert.equal(result.en.items.length,1)
  await setup('faq',{items:[{question:'Legacy VI',answer:'A'}]},{items:[{question:'Legacy EN',answer:'A'}]})
  await click('Thêm mục cho VI và EN');result=await validate('faq');assert(result.vi.items[0].key);assert.equal(result.vi.items[0].key,result.en.items[0].key)
  await evaluate('window.flush(()=>{const editor=document.querySelector(".admin-collection-card [contenteditable]");editor.innerHTML="<p>Link text</p>";editor.dispatchEvent(new InputEvent("input",{bubbles:true}));})')
  await evaluate('window.prompt=()=>{throw Error("Native prompt used")};const editor=document.querySelector(".admin-collection-card [contenteditable]");editor.focus();const range=document.createRange();range.selectNodeContents(editor);const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);[...document.querySelectorAll("button")].find(b=>b.getAttribute("aria-label")==="Thêm liên kết").click();')
  assert.equal(await evaluate('!!document.querySelector("[role=dialog]")'),true)
  await change('[role=dialog] input','/solutions');await click('Thêm liên kết');await evaluate('new Promise(resolve=>setTimeout(resolve,30))');result=await validate('faq');assert(result.vi.items[1].answer.includes('href="/solutions"'), JSON.stringify(result.vi.items))
  const hero={slides:[{key:'slide-1',headline:'VI hero',showContent:true,desktopImage:'',primaryCta:{label:'VI label',url:'/old'},secondaryCta:{label:'Other',url:''}}]}
  const english=structuredClone(hero);english.slides[0].headline='EN hero';english.slides[0].primaryCta.label='EN label'
  await setup('hero',hero,english)
  await click('Nút hành động');await change('input[placeholder]', '/new').catch(async()=>{
    await evaluate('window.flush(()=>{const inputs=[...document.querySelectorAll("input")];const input=inputs.find(i=>i.value==="/old");Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set.call(input,"/new");input.dispatchEvent(new Event("input",{bubbles:true}));})')
  })
  result=await validate('hero');assert.equal(result.vi.slides[0].primaryCta.label,'VI label');assert.equal(result.en.slides[0].primaryCta.label,'EN label');assert.equal(result.en.slides[0].primaryCta.url,'/new')
  await click('Cài đặt');await evaluate('document.querySelector("[role=combobox]").click()');assert.equal(await evaluate('!!document.querySelector("[role=listbox]")'),true)
  await evaluate('document.querySelector("[role=listbox]").dispatchEvent(new KeyboardEvent("keydown",{key:"ArrowDown",bubbles:true}));document.querySelector("[role=listbox]").dispatchEvent(new KeyboardEvent("keydown",{key:"Escape",bubbles:true}));')
  await setup('hero',hero,english,'solutions');assert.equal(await evaluate('document.querySelectorAll(".solutions-hero").length'),2);assert.equal(await evaluate('!!document.querySelector(".admin-hero-preview-scene")'),false)
  await setup('trustedLogos',{title:'Logos',items:[{key:'logo',alt:'Logo',url:'',width:150,scale:1}]})
  assert.equal(await evaluate('document.querySelectorAll(".admin-media-dropzone").length'),1)
  assert.equal(await evaluate('document.querySelectorAll("details, pre, .admin-item-identity").length'),0)
  await evaluate(`window.fetch=async()=>{throw Error('Rejected file reached network')};const zone=document.querySelector('.admin-media-dropzone');const bad=new DataTransfer();bad.items.add(new File(['text'],'bad.txt',{type:'text/plain'}));zone.dispatchEvent(new DragEvent('dragenter',{bubbles:true,dataTransfer:bad}));`)
  assert.equal(await evaluate('document.querySelector(".admin-media-field").classList.contains("is-dragging")'),true)
  await evaluate(`const zone=document.querySelector('.admin-media-dropzone');const bad=new DataTransfer();bad.items.add(new File(['text'],'bad.txt',{type:'text/plain'}));zone.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:bad}));`)
  assert.equal(await evaluate('document.querySelector(".admin-media-field").classList.contains("has-error")'),true)
  await evaluate(`const big=new DataTransfer();big.items.add(new File([new Uint8Array(10*1024*1024+1)],'big.png',{type:'image/png'}));document.querySelector('.admin-media-dropzone').dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:big}));`)
  assert.equal(await evaluate('document.querySelector(".admin-media-error").textContent.includes("10 MB")'),true)
  await evaluate(`window.fetch=async(url,options)=>{
    if(String(url).includes('upload-signature')) { window.signCount=(window.signCount||0)+1; if(options.headers['x-csrf-token']!=='csrf') throw Error('CSRF missing'); await new Promise(resolve=>setTimeout(resolve,100)); return new Response(JSON.stringify({uploadUrl:'https://api.cloudinary.com/v1_1/test-cloud/image/upload',apiKey:'test-key',signature:'signed',params:{timestamp:'1',public_id:'neotek/cms/test'}})) }
    if(options.credentials!=='omit'||!options.body.get('file'))throw Error('Invalid upload');return new Response(JSON.stringify({secure_url:'https://res.cloudinary.com/test-cloud/image/upload/test.png',public_id:'neotek/cms/test'}))
  };const transfer=new DataTransfer();transfer.items.add(new File(['image'],'logo.png',{type:'image/png'}));const zone=document.querySelector('.admin-media-dropzone');zone.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:transfer}));zone.dispatchEvent(new DragEvent('drop',{bubbles:true,dataTransfer:transfer}));`)
  await evaluate('new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{if(window.data.vi.items[0].url){clearInterval(timer);resolve()}else if(++n>40){clearInterval(timer);reject(Error("Upload failed"))}},50)})')
  result=await validate('trustedLogos');assert.equal(result.vi.items[0].url,result.en.items[0].url)
  assert.equal(await evaluate('window.signCount'),1,'Duplicate drop triggered a second upload')
  await evaluate(`{
    window.fetch=async()=>new Response('',{status:503});const input=document.querySelector('input[type=file]');const transfer=new DataTransfer();transfer.items.add(new File(['image'],'logo.png',{type:'image/png'}));input.files=transfer.files;input.dispatchEvent(new Event('change',{bubbles:true}));
  }`)
  await evaluate('new Promise((resolve,reject)=>{let n=0;const timer=setInterval(()=>{if(document.querySelector(".admin-media-field [role=alert]")){clearInterval(timer);resolve()}else if(++n>40){clearInterval(timer);reject(Error("Upload error missing"))}},50)})')
  assert.equal(await evaluate('document.querySelector(".admin-media-field").getAttribute("aria-busy")'),'false')
  assert.equal((await data()).vi.items[0].url,result.vi.items[0].url)
  await click('Gỡ ảnh');await click('Xác nhận');await evaluate('new Promise(resolve=>setTimeout(resolve,30))');result=await validate('trustedLogos');assert.equal(result.vi.items[0].url,'');assert.equal(result.en.items[0].url,'')
  await change('input[type=number]', '190');result=await validate('trustedLogos');assert.equal(result.vi.items[0].width,190);assert.equal(result.en.items[0].width,190)
  await change('input[type=range]','1.5');result=await validate('trustedLogos');assert.equal(result.en.items[0].scale,1.5)
  await evaluate('new Promise(resolve=>setTimeout(resolve,100))');
  assert.equal(await evaluate('document.querySelector(".admin-trusted-preview .trusted-by-logo-item").style.getPropertyValue("--logo-scale")'),'1.5')
  await setup('testimonials',{items:[{key:'person',name:'VI customer',quote:'Quote',image:'https://res.cloudinary.com/test-cloud/image/upload/test.png'}]},{items:[{key:'person',name:'EN customer',quote:'English quote',image:'https://res.cloudinary.com/test-cloud/image/upload/test.png'}]})
  await click('Chỉnh ảnh');await change('input[aria-label="Phóng to ảnh đại diện"]','1.5');assert.equal((await data()).vi.items[0].zoom,undefined);await click('Hủy');assert.equal((await data()).vi.items[0].zoom,undefined);await click('Chỉnh ảnh');await change('input[aria-label="Phóng to ảnh đại diện"]','1.5');assert.equal(await evaluate('document.querySelectorAll("[role=dialog] .admin-image-position").length'),0);result=await validate('testimonials');assert.equal(result.en.items[0].name,'EN customer')
  await evaluate('const frame=document.querySelector("[role=dialog] .admin-avatar-frame"),rect=frame.getBoundingClientRect();window.dragStart={x:rect.x+rect.width/2,y:rect.y+rect.height/2};')
  const dragStart=await evaluate('window.dragStart')
  await call('Input.dispatchMouseEvent',{type:'mousePressed',x:dragStart.x,y:dragStart.y,button:'left',clickCount:1},sessionId)
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:dragStart.x+30,y:dragStart.y+15,button:'left',buttons:1},sessionId)
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:dragStart.x+30,y:dragStart.y+15,button:'left',clickCount:1},sessionId)
  await click('Áp dụng ảnh');result=await validate('testimonials');assert.equal(result.vi.items[0].zoom,1.5);assert(result.vi.items[0].focalX<50);assert(result.vi.items[0].focalY<50);assert.equal(result.vi.items[0].focalX,result.en.items[0].focalX)
  assert.equal(await evaluate('document.querySelector(".admin-portrait-summary img").style.transform'),'scale(1.5)')
  await setup('solutionOverview',{title:'Overview',items:[{key:'overview',title:'Group',description:'Several sentences',image:'',imagePosition:'72% center',modules:[{key:'crm',title:'CRM',icon:'Boxes',url:'/solutions'}]}]})
  assert.equal(await evaluate('document.querySelectorAll("textarea").length'),6)
  assert.equal(await evaluate('document.querySelectorAll(".admin-image-position input")[0].value'),'72')
  assert.equal(await evaluate('document.querySelectorAll(".admin-image-position input")[1].value'),'50')
  assert.equal((await data()).vi.items[0].imagePosition,'72% center')
  await change('.admin-image-position input', '68')
  result=await validate('solutionOverview');assert.equal(result.vi.items[0].imagePosition,'68% 50%');assert.equal(result.en.items[0].imagePosition,'68% 50%')
  await setup('hero',{slides:[{...hero.slides[0],imagePosition:'72% center'}]})
  await click('Cài đặt')
  assert.equal(await evaluate('document.querySelector(".admin-image-position input").value'),'72')
  await change('.admin-image-position input','60');result=await validate('hero');assert.equal(result.en.slides[0].imagePosition,'60% 50%')
  await setup('hero',hero)
  await click('Cài đặt')
  await evaluate('document.querySelector(".admin-image-position [role=combobox]").click()')
  await evaluate('const option=[...document.querySelectorAll("[role=option]")].at(-1);option.focus();option.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));')
  assert.equal(await evaluate('document.querySelector(".admin-image-position input").value'),'50')
  result=await validate('hero');assert.equal(result.vi.slides[0].imagePosition,'50% 50%')
  await setup('solutionClusters',{items:[{key:'business',title:'Business',image:''},{key:'crm',title:'CRM',clusterKey:'business'}]})
  assert.equal(await evaluate('document.querySelector(".admin-collection-heading").getAttribute("aria-expanded")'),'true');
  await click('CRM');assert.equal(await evaluate('document.querySelector(".admin-collection-heading").getAttribute("aria-expanded")'),'false');
  await click('CRM');assert.equal(await evaluate('document.querySelector(".admin-collection-heading").getAttribute("aria-expanded")'),'true','First child must reopen directly');
  await click('Thêm mục cho VI và EN');result=await validate('solutionClusters');assert.equal(result.vi.items[2].clusterKey,'business');assert.equal(result.vi.items[2].key,result.en.items[2].key)
  await setup('solutionClusters',{items:[{key:'business',title:'Business',image:''},{key:'crm',title:'CRM',clusterKey:'business'},{key:'sales',title:'Sales',clusterKey:'business'}]});
  await click('CRM');await click('CRM');await click('Sales');await click('CRM');
  await click('\u0110\u01b0a m\u1ee5c xu\u1ed1ng');result=await validate('solutionClusters');assert.equal(result.vi.items[2].key,'crm');assert.equal(result.en.items[2].key,'crm');
  assert.equal(await evaluate('[...document.querySelectorAll(".admin-collection-card")].find(card=>card.querySelector("strong").textContent==="CRM").querySelector("button").getAttribute("aria-expanded")'),'true','Reordering must preserve open record key');
  await setup('solutionGroups',{items:[{key:'business',title:'VI group',modules:['crm']}]},{items:[{key:'business',title:'EN group',modules:['crm']}]},'solutions',[{key:'crm',title:'CRM'},{key:'sales',title:'Sales'}])
  assert.equal(await evaluate('document.querySelectorAll(".admin-module-checklist input").length'),2)
  await evaluate('window.flush(()=>document.querySelectorAll(".admin-module-checklist input")[1].click())')
  result=await validate('solutionGroups');assert.deepEqual(result.vi.items[0].modules,['crm','sales']);assert.deepEqual(result.en.items[0].modules,['crm','sales']);assert.equal(result.en.items[0].title,'EN group')
  assert.equal(await evaluate('!!document.querySelector(".admin-media-dropzone")'),true)
  await setup('solutionModules',{items:[{key:'crm',title:'VI module',bullets:['VI bullet']}]},{items:[{key:'crm',title:'EN module',bullets:['EN bullet']}]},'solutions')
  await change('.admin-list-input input','  Feature one  ')
  await evaluate('window.flush(()=>document.querySelector(".admin-list-input input").dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true})))')
  result=await validate('solutionModules');assert.deepEqual(result.vi.items[0].bullets,['VI bullet','Feature one']);assert.deepEqual(result.en.items[0].bullets,['EN bullet'])
  await change('.admin-list-input input','Feature one');await click('Thêm tính năng');assert.equal((await data()).vi.items[0].bullets.length,2)
  await click('Xóa tính năng: VI bullet');assert.deepEqual((await data()).vi.items[0].bullets,['Feature one'])
  await change('.admin-navigation-row input','Details VI');assert.equal((await data()).en.items[0].ctaLabel,undefined);
  await change('input[pattern]','crm');result=await validate('solutionModules');assert.equal(result.en.items[0].slug,'crm');assert.equal(result.vi.items[0].key,'crm')
  assert.equal(await evaluate('document.querySelectorAll(".admin-media-dropzone").length'),2)
  assert.equal(await evaluate('document.querySelector(".admin-media-field").classList.contains("admin-media-field--compact")'),false)
  await setup('solutionModules',{items:[{key:'crm',title:'CRM',bullets:[]},{key:'sales',title:'Sales',bullets:[]},{key:'orphan',title:'Orphan',bullets:[]}]},undefined,'solutions',[],[{key:'business',eyebrow:'Business',modules:['crm']},{key:'supply',eyebrow:'Supply',modules:['sales','crm']}])
  assert.equal(await evaluate('document.querySelectorAll(".admin-editor-items")[1].querySelectorAll(":scope > .admin-editor-tabs > .admin-editor-tab-rail [role=tab]").length'),1)
  await change('.admin-language-panel textarea','Shared CRM');
  await click('Supply');assert.equal(await evaluate('document.querySelectorAll(".admin-editor-items")[1].querySelectorAll(":scope > .admin-editor-tabs > .admin-editor-tab-rail [role=tab]").length'),2)
  await click('Shared CRM');assert.equal(await evaluate('document.querySelector(".admin-language-panel textarea").value'),'Shared CRM');
  await click('Chưa phân nhóm');assert.equal(await evaluate('document.querySelector(".admin-language-panel textarea").value'),'Orphan');assert.equal((await data()).vi.items.length,3)
  await setup('proofMetrics',{items:[{key:'metric',label:'VI metric',value:50}],actions:[{key:'action',label:'VI CTA',url:'/solutions',variant:'primary'}]},{items:[{key:'metric',label:'EN metric',value:50}],actions:[{key:'action',label:'EN CTA',url:'/solutions',variant:'primary'}]})
  await click('Nút hành động');assert.equal(await evaluate('document.querySelectorAll(".admin-navigation-row").length'),1)
  await change('.admin-navigation-row label:last-of-type input','/booking');result=await validate('proofMetrics');assert.equal(result.en.actions[0].url,'/booking');assert.equal(result.en.actions[0].label,'EN CTA')
  await setup('cta',{items:[{title:'VI CTA',primary:{label:'VI',url:'/register'},secondary:{}}]},{items:[{title:'EN CTA',primary:{label:'EN',url:'/register'},secondary:{}}]});await validate('cta');assert.equal(await evaluate('document.querySelectorAll(".cta-actions").length'),0)
  assert.equal(await evaluate('document.querySelectorAll(".admin-editor-fields [role=tab]").length'),0);
  await evaluate('document.querySelector(".admin-navigation-row [role=combobox]").focus();document.querySelector(".admin-navigation-row [role=combobox]").dispatchEvent(new KeyboardEvent("keydown",{key:" ",bubbles:true}));');
  await evaluate('const option=[...document.querySelectorAll("[role=option]")].at(-1);option.focus();option.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));');
  result=await validate('cta');assert.equal(result.vi.items[0].primary.variant,'ghost');assert.equal(result.en.items[0].primary.variant,'ghost');
  await evaluate('window.flush(()=>document.querySelector(".admin-navigation-enabled input").click())');result=await validate('cta');assert.equal(result.vi.items[0].primary.enabled,false);assert.equal(result.en.items[0].primary.enabled,false);
  await evaluate('window.fixture.sectionKey="footerCta";window.serial++;window.mount();');assert.equal(await evaluate('document.querySelectorAll(".admin-navigation-row").length'),1);assert.equal(await evaluate('document.querySelectorAll(".admin-draft-preview").length'),0);
  await evaluate(`window.fetchCount=0;window.fetch=async()=>{window.fetchCount++;return new Response(JSON.stringify({slug:'home',sections:[{key:'cta',content:{items:[{title:'CTA',primary:{label:'Go',url:'/register',enabled:false,variant:'ghost'},secondary:{}}]}}]}))};Promise.all([window.contentAdapter.getHomePage('en'),window.contentAdapter.getHomePage('en')]).then(results=>{window.contentResults=results});`)
  await evaluate('new Promise(resolve=>setTimeout(resolve,50))');
  assert.equal(await evaluate('window.fetchCount'),1)
  assert.equal(await evaluate('window.contentResults[0].ctaSection.primaryUrl'),'/en/register');assert.equal(await evaluate('window.contentResults[0].ctaSection.showPrimaryCta'),false);assert.equal(await evaluate('window.contentResults[0].ctaSection.primaryVariant'),'ghost')
  await evaluate(`window.contentAdapter.getHomePage('vi').then(result=>{window.viResult=result});`)
  assert.equal(await evaluate('window.fetchCount'),2)
  assert.equal(await evaluate('window.viResult.ctaSection.primaryUrl'),'/register')
  console.log('PASS browser: bilingual creation/deletion, AlertDialog cancel/confirm, Hero CTA labels/shared URL, Radix Select keyboard, page-specific Hero preview, signed media upload, logo sizing, parent-child cluster hierarchy, inline CTA actions, portrait dialog cancel/apply')
} finally { chrome.kill(); await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200}).catch(error=>console.error("Profile cleanup:",error.code)) }
