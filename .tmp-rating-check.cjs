const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const dir=path.join(process.cwd(),'.tmp-rating-check');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'report.jsonl'),'');const log=v=>fs.appendFileSync(path.join(dir,'report.jsonl'),JSON.stringify(v)+'\n');
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless','--disable-gpu','--no-first-run','--no-default-browser-check','--remote-debugging-port=9235',`--user-data-dir=${dir}/profile`,'about:blank'],{windowsHide:true,stdio:'ignore'});
const pause=ms=>new Promise(r=>setTimeout(r,ms));let ws,id=0;const pending=new Map(),errors=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params}))});
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value}
(async()=>{
 let tabs;for(let i=0;i<100;i++){try{tabs=await(await fetch('http://127.0.0.1:9235/json/list')).json();break}catch{await pause(100)}}if(!tabs)throw Error('Chrome unavailable');
 ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r,{once:true}));
 ws.addEventListener('message',({data})=>{const m=JSON.parse(data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(JSON.stringify(m.error))):p.resolve(m.result)}else if(m.method==='Runtime.exceptionThrown'||m.method==='Network.loadingFailed')errors.push(m)});
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
 for(const [label,width,height]of[['desktop',1440,1000],['mobile',390,844]]){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:width<600});await send('Page.navigate',{url:`file:///${process.cwd().replaceAll('\\','/')}/index/index.html`});
  for(let i=0;i<100;i++){if(await evaluate('document.readyState==="complete"&&!!document.querySelector(".moments-footer")'))break;await pause(100)}
  await evaluate(`(async()=>{document.documentElement.style.scrollBehavior='auto';await document.fonts.ready;window.scrollTo(0,document.querySelector('.memori-achievements').offsetTop-220);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))})()`);
  const result=await evaluate(`(()=>{const f=document.querySelector('.moments-footer'),s=f.closest('section'),g=s.querySelector('.achievement-grid'),a=f.querySelector('a'),r=f.getBoundingClientRect();return{parent:s.className,count:document.querySelectorAll('.moments-footer').length,afterCards:r.top>=g.getBoundingClientRect().bottom,sections:[...document.querySelectorAll('main > section')].map(e=>e.className),viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,footer:{left:r.left,right:r.right},rating:f.querySelector('strong').textContent,note:f.querySelector('.moments-image-note').textContent,link:{text:a.textContent.trim(),href:a.href,target:a.target,rel:a.rel},oldLocation:!!document.querySelector('.memori-moments .moments-footer')}})()`);
  log({label,result});if(result.parent!=='memori-achievements'||result.count!==1||!result.afterCards||result.oldLocation||result.documentWidth>width||result.footer.left<0||result.footer.right>width)throw Error('Rating block layout failed');
  const clip=await evaluate(`(()=>{const e=document.querySelector('.memori-achievements');return{x:0,y:e.offsetTop,width:innerWidth,height:e.offsetHeight,scale:1}})()`);const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});fs.writeFileSync(path.join(dir,label+'.png'),Buffer.from(shot.data,'base64'));
 }
 log({errors});
})().catch(e=>{log({error:e.stack});process.exitCode=1}).finally(async()=>{if(ws){try{await send('Browser.close')}catch{}ws.close()}chrome.kill()});
