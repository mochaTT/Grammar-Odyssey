const DAILY_GOAL=50, SAVE_KEY='grammarOdysseySave';
const AREA_NAMES=["はじまりの島","緑の森","湖の町","雪の山","太陽の丘","星降る谷","虹の岬","深緑の森","青い湖畔","古の遺跡","風の高原","満月の丘","霧の谷","黄金の平原","静寂の森","波音の浜","氷結の峰","光の回廊","夢見の丘","終わりなき草原","蒼穹の塔","銀河の橋","刻の遺跡","世界の果て"];
const MASCOT_LINES={home:["今日もがんばろう！","一つずつ覚えていこう！","キミの世界を育てよう！"],ok:["やったね！","その調子！","覚えてきたね！"],ng:["だいじょうぶ、次いこう！","もう一度確認しよう！"]};
const SUBDESC={compose:'英作文用の暗唱例文。和文を見て英文を言ってみよう',grammar:'時制・助動詞・関係詞など、文法の定番問題',usage:'動詞・名詞・前置詞などの語法',idiom:'動詞・形容詞・副詞などを含む熟語'};
const $=id=>document.getElementById(id);
let state=null, session=null;

function defaultState(){return{stats:{},exp:0,coins:0,todayCount:0,todayDate:new Date().toDateString(),totalStudied:0,totalMastered:0,sub:'grammar',active:{}}}
function load(){
  try{const r=localStorage.getItem(SAVE_KEY);state=r?JSON.parse(r):defaultState()}catch(e){state=defaultState()}
  if(!state.active)state.active={};
  if(state.todayDate!==new Date().toDateString()){state.todayDate=new Date().toDateString();state.todayCount=0}
  save();
}
function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(state))}catch(e){}}
const level=()=>Math.floor(state.exp/100)+1, expForNext=()=>level()*100;
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const esc=t=>String(t).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function toast(m){const t=$('toast');t.textContent=m;t.classList.add('show');clearTimeout(toast._t);toast._t=setTimeout(()=>t.classList.remove('show'),1800)}

const items=()=>DATA[state.sub].items;
const chapters=()=>[...new Set(items().map(i=>i.c))];
const stageItems=s=>items().filter(i=>i.c===chapters()[s]);
const key=i=>state.sub+':'+i.u;
const stat=i=>state.stats[key(i)];
const activeStage=()=>Math.min(state.active[state.sub]||0,chapters().length-1);
const stageMastered=s=>stageItems(s).reduce((n,i)=>n+((stat(i)||{}).mastered?1:0),0);
const areaName=s=>AREA_NAMES[s%AREA_NAMES.length];

function renderWorldCard(elId,badge,ratio){
  const hills=ratio>=.5?"⛰️🏔️⛰️":"⛰️";
  const trees=ratio>=.25?(ratio>=.75?"🌳🌲🌳🌲🌳":"🌳 🌲 🌳"):"🌱 🌱";
  const city=ratio>=1?"🏰🏘️🏠🏘️🏰":ratio>=.5?"🏠 🏡 🏠":ratio>0?"⛺":"";
  $(elId).innerHTML=`<div class="sun"></div><div class="cloud c1"></div><div class="cloud c2"></div>
    <div class="title">Grammar Odyssey</div><div class="hillrow">${hills}</div>
    <div class="hillrow" style="bottom:56px;">${trees}</div><div class="cityrow">${city}</div>
    <div class="badge">${badge}</div>`;
}
function showScreen(name){
  if(name==='study'&&!session){toast('ホームの「学習をはじめる」から始めてね');return}
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $('screen-'+name).classList.add('active');
  document.querySelectorAll('nav button').forEach(b=>b.classList.toggle('active',b.dataset.scr===name));
  if(name==='home')renderHome();if(name==='world')renderWorld();if(name==='menu')renderMenu();
}
function renderTopStat(p){
  $(p+'Lv').textContent='Lv.'+level();
  $(p+'ExpBar').style.width=Math.min(100,100*state.exp/expForNext())+'%';
  $(p+'Diamond').textContent=state.totalMastered;$(p+'Coin').textContent=state.coins;
}
function renderHome(){
  const s=activeStage();renderTopStat('home');
  renderWorldCard('homeWorld',areaName(s)+' ・ '+chapters()[s],stageMastered(s)/stageItems(s).length);
  $('startBtn').innerHTML='📖 続きから学習 <span style="font-size:12px;font-weight:700;display:block;opacity:.9">'+esc(chapters()[s])+'（'+stageItems(s).length+'問）</span>';
  $('homeToday').textContent=Math.min(state.todayCount,DAILY_GOAL)+' / '+DAILY_GOAL+'問';
  $('homeTodayBar').style.width=Math.min(100,100*state.todayCount/DAILY_GOAL)+'%';
  $('homeMascotLine').textContent=pick(MASCOT_LINES.home);
  $('subSeg').innerHTML=Object.keys(DATA).map(k=>`<button class="${k===state.sub?'active':''}" onclick="setSub('${k}')">${DATA[k].name}</button>`).join('');
  $('homeSubDesc').textContent=SUBDESC[state.sub]+'（全'+items().length+'問）';
  renderWeak('homeWeakList',10);
}
function setSub(k){state.sub=k;save();renderHome()}
function selectStage(i){state.active[state.sub]=i;save();startSession()}
function setWorldSub(k){state.sub=k;save();renderWorld()}
function renderWorld(){
  const s=activeStage();
  $('worldSeg').innerHTML=Object.keys(DATA).map(k=>`<button class="${k===state.sub?'active':''}" onclick="setWorldSub('${k}')">${DATA[k].name}</button>`).join('');
  renderWorldCard('worldBig',areaName(s),stageMastered(s)/stageItems(s).length);
  $('worldSubTitle').textContent=DATA[state.sub].name+'のエリア';
  const list=$('stageList');list.innerHTML='';
  chapters().forEach((c,i)=>{
    const total=stageItems(i).length,cnt=stageMastered(i);
    const d=document.createElement('div');
    d.className='stagecard'+(cnt>=total?' done':'')+(i===s?' current':'');
    d.innerHTML=`<div class="num">${i+1}</div><div style="flex:1"><b>${areaName(i)}</b><div class="small">${esc(c)}　${cnt} / ${total} 問 定着</div></div>`;
    d.onclick=()=>selectStage(i);list.appendChild(d);
  });
}
function weakList(){return items().filter(i=>{const s=stat(i);return s&&s.hist.slice(-1)==='X'})}
function renderWeak(id,limit){
  const w=weakList().sort((a,b)=>stat(b).i-stat(a).i).slice(0,limit),el=$(id);
  el.innerHTML=w.length?w.map(i=>`<div class="weak"><span>${esc(i.jp.replace(/\n/g,' ').slice(0,26))}</span><span class="badge">×${stat(i).i}</span></div>`).join(''):'<div class="small">まだありません</div>';
}
function renderMenu(){
  $('menuTotal').textContent=state.totalStudied+' 問';
  $('menuMastered').textContent=state.totalMastered+' / '+Object.keys(DATA).reduce((n,k)=>n+DATA[k].items.length,0);
  $('menuLevel').textContent=level();
}
function resetGame(){
  if(confirm('本当にすべての学習データを削除しますか？この操作は取り消せません。')){state=defaultState();save();session=null;showScreen('home');toast('データをリセットしました')}
}

// ---- study ----
function startSession(){
  const s=activeStage(),list=stageItems(s);
  session={stage:s,round:1,queue:shuffle(list.slice()),review:[],total:list.length,weak:false,rev:false};
  showScreen('study');nextQuestion();
}
function startWeakSession(){
  const w=weakList();if(!w.length){toast('間違えた問題はまだありません');return}
  session={stage:activeStage(),round:1,queue:shuffle(w.slice()),review:[],total:w.length,weak:true,rev:false};
  showScreen('study');nextQuestion();
}
function stageLabel(){
  return session.weak?`復習-${session.round} ｜ ${DATA[state.sub].name}`:`STAGE ${session.stage+1}-${session.round} ｜ ${areaName(session.stage)}`;
}
function nextQuestion(){
  if(!session)return showScreen('home');
  if(!session.queue.length){
    if(session.review.length){session.round++;session.queue=shuffle(session.review);session.review=[];toast('間違えた問題をもう一度！')}
    else return finishSession();
  }
  session.cur=session.queue.shift();
  $('studyStage').textContent=stageLabel();$('studyDiamond').textContent=state.totalMastered;
  const pending=session.queue.length+session.review.length+1;
  $('qbarInner').style.width=Math.max(0,100*(session.total-pending)/session.total)+'%';
  renderCard(false);
}
function fmtQ(q){
  return esc(q).replace(/\{h:(.)\}/g,'<i class="bl">$1</i>').replace(/\{n:(\d+)\}/g,(_,n)=>`<i class="bl" style="min-width:${n*2.4}em">&nbsp;</i>`).replace(/\{\}/g,'<i class="bl">&nbsp;</i>');
}
const fmtE=l=>'<p>'+l.trim().replace(/^(F\s?\d+)\s*/,'<span class="ref">$1</span>')+'</p>';
function renderCard(rev){
  const it=session.cur,c=$('studyCard');session.rev=rev;
  c.removeAttribute('data-d');c.style.cssText='';
  const cmp=state.sub==='compose';
  let h=`<div class="meta">${DATA[state.sub].name} ・ ${cmp?'':'第'+it.k+'回 ・ '}${esc(it.c)} ・ No.${it.id}</div><div class="jp"${cmp?' style="font-size:20px;line-height:1.8"':''}>${esc(it.jp)}</div>`;
  h+=rev?`<div class="en">${it.a}</div>`+(it.al||[]).map(a=>`<div class="alt">＝ ${a}</div>`).join('')+(it.e.length?`<div class="ex">${it.e.map(fmtE).join('')}</div>`:'')
        :(it.q?`<div class="en">${fmtQ(it.q)}</div><div class="tap small">タップして答えを見る</div>`:`<div class="tap small">英語で言ってみよう。タップして答えを見る</div>`);
  c.innerHTML=h;c.scrollTop=0;
  $('ngBtn').disabled=!rev;$('okBtn').disabled=!rev;
}
function bindSwipe(){
  const c=$('studyCard');let x0=0,dx=0,down=false,mv=false;
  c.onpointerdown=e=>{if(!session)return;down=true;mv=false;x0=e.clientX;dx=0;c.style.animation='none';c.style.transition='none'};
  c.onpointermove=e=>{if(!down||!session)return;dx=e.clientX-x0;if(Math.abs(dx)>10)mv=true;
    if(mv&&session.rev){try{c.setPointerCapture(e.pointerId)}catch(_){}
      c.style.transform=`translateX(${dx}px) rotate(${dx/25}deg)`;
      if(dx>50)c.dataset.d='ok';else if(dx<-50)c.dataset.d='ng';else c.removeAttribute('data-d')}};
  const end=()=>{if(!down)return;down=false;if(!session)return;
    if(!mv&&!session.rev)return renderCard(true);
    if(mv&&session.rev&&Math.abs(dx)>90)return answer(dx>0);
    c.style.transition='transform .15s';c.style.transform='';c.removeAttribute('data-d')};
  c.onpointerup=end;c.onpointercancel=end;
}
function answer(ok){
  if(!session||!session.rev||session.busy)return;session.busy=true;
  const it=session.cur,k=key(it),c=$('studyCard');
  if(!session.weak)state.active[state.sub]=session.stage;
  session.snap={state:JSON.stringify(state),queue:session.queue.slice(),review:session.review.slice(),round:session.round,cur:it};
  const st=state.stats[k]=state.stats[k]||{c:0,i:0,hist:'',mastered:false};
  let exp=0,coin=0,mastered=false;
  if(ok){st.c++;st.hist=(st.hist+'O').slice(-5);exp=10;coin=5}
  else{st.i++;st.hist=(st.hist+'X').slice(-5);session.review.push(it)}
  if(!st.mastered&&st.hist.slice(-3)==='OOO'){st.mastered=true;mastered=true;state.totalMastered++;exp+=30}
  state.exp+=exp;state.coins+=coin;state.todayCount++;state.totalStudied++;save();
  if(mastered)toast('💎 定着しました！');
  $('studyDiamond').textContent=state.totalMastered;
  c.style.animation='none';c.style.transition='transform .2s,opacity .2s';
  c.style.transform=`translateX(${ok?'':'-'}120%) rotate(${ok?20:-20}deg)`;c.style.opacity=0;
  session.rev=false;$('ngBtn').disabled=true;$('okBtn').disabled=true;
  setTimeout(()=>{if(session){session.busy=false;nextQuestion()}},200);
}
function undo(){
  if(!session||!session.snap||session.busy){toast('戻せる回答がありません');return}
  const s=session.snap;state=JSON.parse(s.state);save();
  session.queue=s.queue;session.review=s.review;session.round=s.round;session.cur=s.cur;session.snap=null;
  $('studyDiamond').textContent=state.totalMastered;
  renderCard(true);
}
function finishSession(){
  const s=session.stage,cleared=!session.weak&&stageMastered(s)>=stageItems(s).length;
  if(cleared&&s<chapters().length-1)state.active[state.sub]=s+1;
  session=null;save();showScreen('home');
  toast(cleared?'🌟 このエリアを制覇しました！':'おつかれさま！');
}
document.addEventListener('keydown',e=>{
  if(!session||!$('screen-study').classList.contains('active'))return;
  if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!session.rev)renderCard(true)}
  else if(e.key==='ArrowRight')answer(true);else if(e.key==='ArrowLeft')answer(false);
});
document.addEventListener('DOMContentLoaded',()=>{load();bindSwipe();showScreen('home')});
