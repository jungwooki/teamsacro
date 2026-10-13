const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const elements=new Map();
function element(key){if(!elements.has(key))elements.set(key,{value:'',textContent:'',innerHTML:'',dataset:{},addEventListener(){},querySelectorAll(){return []},classList:{add(){}},scrollIntoView(){}});return elements.get(key)}
const store=new Map();
const context=vm.createContext({console,Intl,Date,localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},document:{documentElement:{dataset:{}},querySelector:s=>s==='.map'?null:element(s),addEventListener(){},querySelectorAll(){return []}},window:{scrollTo(){}},requestAnimationFrame(){},ResizeObserver:class{observe(){}disconnect(){}}});
for(const file of ['data.js','live-summary.js','benchmarks.js','dashboard.js','map-layout.js','dashboard-v2.js','player-report.js','team-config.js'])vm.runInContext(fs.readFileSync(__dirname+'/'+file,'utf8'),context,{filename:file});
vm.runInContext(`
if(TEAM_PLAYERS.length!==21||new Set(TEAM_PLAYERS.map(p=>p.code)).size!==21)throw Error('Roster count');
if(TEAM_PLAYERS.some(p=>p.team!=='경기 아크로FC U12'))throw Error('Unexpected team');
if(Object.values(LIVE_SUMMARY).reduce((n,s)=>n+Object.keys(s.players).length,0)!==21)throw Error('Snapshot count');
for(const p of TEAM_PLAYERS){if(livePlayer(p).name!==p.name)throw Error('Snapshot mismatch');}
for(const [year,count] of [['2014',3],['2015',12],['2016',6]]){
 state.year=year;state.player=null;
 if(cohort().length!==count)throw Error('Cohort count');
 const mapHtml=map();
 if((mapHtml.match(/class="quadrant q/g)||[]).length!==4)throw Error('Missing four quadrants');
 if((mapHtml.match(/class="map-player /g)||[]).length!==count)throw Error('Missing player dots');
 if(/NaN|undefined|산식 연결 대기|자료가 등록되면/.test(mapHtml))throw Error('Invalid map');
 const mean=cohort().reduce((sum,p)=>sum+livePlayer(p).availability,0)/count;
 if(Math.abs(summary().stats.availability-mean)>0.051)throw Error('Team average');
 for(const p of cohort()){
   const value=mapCoachScore(p);
   if(!Number.isFinite(value)||value<0||value>100)throw Error('Invalid map score');
 }
 for(const tab of ['summary','physical','growth','mental','idp']){
  state.tab=tab;render();
  if(/NaN|undefined|김포/.test($('#dashboard').innerHTML))throw Error('Invalid content '+year+' '+tab);
 }
 for(const filter of ['growth','risk']){state.filter=filter;render();if(/NaN|undefined/.test($('#dashboard').innerHTML))throw Error('Filter');}state.filter=null;
}
// Exercise the original map formula with synthetic test inputs, never saved.
const sample=TEAM_PLAYERS[0], sampleLive=livePlayer(sample), originalScore=sampleLive.availability;
sampleLive.availability=80;
if(Math.abs(mapCoachScore(sample)-(sample.mgi*4+48))>1e-9)throw Error('Map weighting');
if(Math.abs(mapGrowthScore(sample)-(2+sample.boneMonths/12*1.5))>1e-9)throw Error('Growth axis');
for(const [growthStage,expected] of [['Pre-PHV',2],['Stage 1',5],['Stage 2',5],['Stage 3',8],['Post-PHV',8]]){
 if(mapGrowthScore({growthStage,boneMonths:0})!==expected)throw Error('Stage base');
 if(mapGrowthScore({growthStage,boneMonths:6})!==expected+0.75)throw Error('Bone month offset');
}
for(const [x,y,sx,sy] of [[4.99,59.99,'left','bottom'],[5,60,'right','top'],[4.99,60,'left','top'],[5,59.99,'right','bottom']]){
 const pos=mapPosition(x,y);
 if(pos.sideX!==sx||pos.sideY!==sy)throw Error('Quadrant boundary');
 if((pos.x<0.5)!==(x<5)||(pos.y<=0.5)!==(y>=60))throw Error('Coordinate and quadrant disagree');
}
if(Math.abs(mapPosition(5,60).y-0.5)>1e-9)throw Error('Fixed center');
const counts={};
for(const p of TEAM_PLAYERS){const pos=mapPosition(mapGrowthScore(p),mapCoachScore(p)),key=pos.sideY+'-'+pos.sideX;counts[key]=(counts[key]||0)+1;}
console.log('Quadrant counts:',JSON.stringify(counts));
if(JSON.stringify(counts)!==JSON.stringify({'top-left':13,'top-right':5,'bottom-right':2,'bottom-left':1}))throw Error('Quadrant regression');
sampleLive.availability=originalScore;
state.year='bio';state.player=null;render();
for(const p of TEAM_PLAYERS){for(const view of ['report','idp']){state.player=p.code;state.playerView=view;render();if(/NaN|undefined|XXX/.test($('#dashboard').innerHTML))throw Error('Player '+p.code);}}
const p=TEAM_PLAYERS[0];setRecord(p,{coachMemo:'verification'});if(record(p).coachMemo!=='verification')throw Error('Memo save');
state.player=p.code;state.idpMode='choose';render();
state.draft=[{...findItem('first_touch'),status:'normal',intensity:'improve',context:IDP_CONTEXTS.technical[0]}];state.idpMode='detail';state.step=0;render();
`,context);
assert(store.size>0);
assert.deepEqual(JSON.parse(vm.runInContext('JSON.stringify(Object.values(LIVE_SUMMARY).map(s=>s.stats.availability))',context)),[83.4,78.4,74.1]);
assert(!fs.readFileSync(__dirname+'/live-summary.js','utf8').includes('recoveryReference'));
const html=fs.readFileSync(__dirname+'/index.html','utf8');
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))assert(fs.existsSync(__dirname+'/'+match[1]),'Missing asset: '+match[1]);
assert(html.includes('샘플 보드'));
for(const file of fs.readdirSync(__dirname).filter(f=>f.endsWith('.js')))new vm.Script(fs.readFileSync(__dirname+'/'+file,'utf8'),{filename:file});
assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(__dirname+'/dashboard.css')).digest('hex'), 'e28e6b25963e534cb384483bdb98d30daf889dbb9de1f8572786465fe5cea763');
console.log('PASS: original CSS unchanged; fixed quadrant boundaries and stage mapping; all 21 actual player scores and dots; source cohort averages; 15 team views; all player reports and IDPs.');
