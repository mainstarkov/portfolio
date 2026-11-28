const entries = new Map();
function add(id, input, hint, run, actions = {}) { entries.set(id, {input,hint,run,actions}); }
const lines = value => value.trim().split(/\r?\n/).filter(Boolean);
const words = value => value.trim().split(/\s+/).filter(Boolean);
function count(values) {const result=Object.create(null);for(const value of values) result[value]=(result[value]??0)+1;return result;}
function need(ok,text){if(!ok)throw Error(text);}
async function hash(text){
 const bytes=new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text)));
 return Array.from(bytes,x=>x.toString(16).padStart(2,"0")).join("");
}
function csv(text){
 const rows=[];let row=[],word="",quoted=false;
 const clean=text.trimEnd().replace(/\r\n/g,"\n");
 for(let i=0;i<=clean.length;i++){
  const c=clean[i];
  if(c===undefined){row.push(word);rows.push(row);break;}
  if(c==='"'){if(quoted&&clean[i+1]==='"'){word+='"';i++;}else quoted=!quoted;}
  else if(!quoted&&(c===","||c==="\n")){row.push(word);word="";if(c==="\n"){rows.push(row);row=[];}}
  else word+=c;
 }
 need(!quoted,"Закройте кавычки CSV.");return rows;
}
const quote=value=>{const s=String(value??"");return /[",\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s;};
const csvText=rows=>rows.map(row=>row.map(quote).join(",")).join("\n");
add("go-csv-columns","name city\nname,age,city\nAda,30,London","Первая строка — имена колонок через пробел, ниже — CSV.",text=>{const at=text.indexOf("\n"),names=words(text.slice(0,at)),[head,...rows]=csv(text.slice(at+1));const i=names.map(n=>head.indexOf(n));need(i.length&&i.every(x=>x>=0),"Колонка не найдена");return csvText([names,...rows.map(row=>i.map(x=>row[x]))]);});
add("go-dir-weight","docs/README.md 600\ndocs/api.md 400\nsrc/main.go 1000","Укажите путь и размер в байтах на строку.",text=>{const sizes=Object.create(null);for(const l of lines(text)){const m=l.match(/^(.+) (\d+)$/);need(m,"Формат: путь и байты");const group=m[1].includes("/")?m[1].split("/")[0]:".";sizes[group]=(sizes[group]??0)+Number(m[2]);}return Object.entries(sizes).sort((a,b)=>b[1]-a[1]).map(([name,n])=>`${n} bytes  ${name}`).join("\n");});
add("go-file-fingerprint","hello","Введите текст. Демо вычисляет SHA-256 его байтов UTF-8, как утилита для файла.",hash);
add("go-text-tally","Привет, мир!\nHello world","Введите текст для подсчёта строк, слов и символов Unicode.",text=>`lines=${text?text.split("\n").length-Number(text.endsWith("\n")):0} words=${words(text).length} characters=${[...text].length}`);
add("go-timer-board","3","Введите длительность от 1 до 60 секунд.",async(text,s,show)=>{let n=Number(text);need(Number.isInteger(n)&&n>=1&&n<=60,"Укажите целое число от 1 до 60");while(n){show(`${n--} секунд осталось`);await new Promise(resolve=>setTimeout(resolve,1000));}return "Done";});
add("go-url-batch","https://example.org/\nhttps://example.net/\nhttps://example.org/docs","По одному HTTP(S)-адресу на строку. Комментарии начинаются с #.",text=>count(lines(text).filter(x=>!x.trim().startsWith("#")).map(x=>{const url=new URL(x);need(/^https?:$/.test(url.protocol),"Ожидается HTTP(S)");return url.hostname;})));
add("jsonbridge",'[{"name":"Ада","city":"Лондон"},{"name":"Грейс","city":"Нью-Йорк"}]',"Введите массив объектов JSON или CSV с заголовком.",text=>{if(text.trim().startsWith("[")){const rows=JSON.parse(text);need(rows.every(x=>x&&typeof x==="object"&&!Array.isArray(x)),"Нужен массив объектов");const columns=[...new Set(rows.flatMap(Object.keys))];return csvText([columns,...rows.map(row=>columns.map(key=>row[key]))]);}const [head,...rows]=csv(text);return rows.map(row=>Object.fromEntries(head.map((key,index)=>[key,row[index]??""])));});
add("node-decision-bot","Чай\nКофе\nКакао","Укажите разные варианты по одному на строку.",text=>{const options=[...new Set(lines(text).map(x=>x.trim()))];need(options.length>1,"Нужно минимум два варианта");return "Выбираю: "+options[Math.floor(Math.random()*options.length)];});
add("node-dev-port","3000","Демо TCP-проверки с учебным набором открытых портов 3000 и 8080.",text=>{const p=Number(text);need(Number.isInteger(p)&&p>0&&p<65536,"Некорректный порт");return `127.0.0.1:${p} ${[3000,8080].includes(p)?"is listening":"is unavailable (ECONNREFUSED)"}`;},{"Закрытый порт":"3001"});
add("node-query-card","tag=go&tag=rust&q=hello+world","Введите строку параметров URL.",text=>{const result=Object.create(null);for(const [key,value] of new URLSearchParams(text.trim())) result[key]=key in result?[result[key],value].flat():value;return result;});
add("py-focus-pick","30\ntask,minutes,impact\nОтветить на письмо,10,4\nРазобрать задачу,45,5\nПроверить README,15,3","Первая строка — бюджет в минутах, далее CSV с задачами.",text=>{const i=text.indexOf("\n"),budget=Number(text.slice(0,i)),[,...rows]=csv(text.slice(i+1));const options=rows.filter(x=>+x[1]>0&&+x[1]<=budget).sort((a,b)=>b[2]/b[1]-a[2]/a[1]);return options[0]?.[0]??"No task fits the time budget";});
add("py-markdown-index","notes/first.md | Первая заметка\nnotes/go.md | Ссылки по Go","Укажите путь и заголовок через |. Демо выводит оглавление Markdown.",text=>"# Notes index\n\n"+lines(text).map(l=>{const [p,title]=l.split("|").map(s=>s.trim());return `- [${title||p}](${encodeURI(p)})`;}).join("\n"));
add("py-rss-digest","<rss><channel><item><title>Первый релиз</title><link>https://example.org</link></item></channel></rss>","Вставьте RSS/Atom XML. Демо извлечёт заголовки и ссылки.",text=>{const doc=new DOMParser().parseFromString(text,"application/xml");need(!doc.querySelector("parsererror"),"Некорректный XML");return [...doc.querySelectorAll("item,entry")].slice(0,10).map(x=>`- ${x.querySelector("title")?.textContent??"Untitled"} — ${x.querySelector("link")?.getAttribute("href")??x.querySelector("link")?.textContent??""}`).join("\n");});
add("py-srt-shift","1500\n1\n00:00:01,000 --> 00:00:02,000\nПривет","Первая строка — смещение в миллисекундах, ниже — SRT.",text=>{const i=text.indexOf("\n"),delta=Number(text.slice(0,i));need(Number.isInteger(delta),"Укажите целое смещение");return text.slice(i+1).replace(/^(\d\d:\d\d:\d\d,\d{3})(\s+-->\s+)(\d\d:\d\d:\d\d,\d{3})/gm,(_m,a,arrow,b)=>[a,b].map(t=>{const [h,m,s,ms]=t.split(/[:,]/).map(Number);const shifted=Math.max(0,((h*60+m)*60+s)*1000+ms+delta);const hours=Math.floor(shifted/3600000).toString().padStart(2,"0");return hours+new Date(shifted%3600000).toISOString().slice(13,23).replace(".",",").padStart(10,":");}).join(arrow));});
add("py-subscription-ledger","name,amount,period\nMusic,15,monthly\nHosting,60,yearly","Введите CSV. Используйте одну валюту.",text=>{const [,...rows]=csv(text);let total=0;for(const [,amount,period]of rows){need(["monthly","yearly"].includes(period)&&Number(amount)>=0,"Некорректная строка");total+=Math.round(Number(amount)*100)*(period==="monthly"?12:1);}return `Total: ${(total/100).toFixed(2)}/year (${(total/1200).toFixed(2)}/month)`;});
add("rs-line-dedupe","pear\napple\npear","Введите строки с повторами.",text=>[...new Set(text.split(/\r?\n/))].join("\n"));
add("rs-log-count","INFO started\nWARN retrying\nINFO ready\nERROR failed","Укажите уровень в начале каждой строки журнала.",text=>Object.assign({INFO:0,WARN:0,ERROR:0,OTHER:0},count(lines(text).map(x=>{const n=words(x)[0];return ["INFO","WARN","ERROR"].includes(n)?n:"OTHER";}))));
add("rs-palette-contrast","#202020 #ffffff","Введите два шестизначных HEX-цвета.",text=>{const c=words(text);need(c.length===2&&c.every(x=>/^#?[0-9a-f]{6}$/i.test(x)),"Нужны два HEX-цвета");const l=c.map(x=>x.replace("#","").match(/../g).reduce((v,p,i)=>{const s=parseInt(p,16)/255;return v+[.2126,.7152,.0722][i]*(s<=.04045?s/12.92:((s+.055)/1.055)**2.4);},0));return ((Math.max(...l)+.05)/(Math.min(...l)+.05)).toFixed(2)+":1";});
add("rs-pomodoro-plan","3 25 5","Раунды, фокус и перерыв в минутах.",text=>{const [n,f,r]=words(text).map(Number);need([n,f,r].every(Number.isInteger)&&n>0&&n<=100&&f>0&&r>=0,"Укажите три допустимых числа");return Array.from({length:n},(_,i)=>`Focus ${i+1}: ${i*(f+r)}–${i*(f+r)+f} min`).join("\n");});
add("rs-unit-counter","1572864","Укажите число байтов.",text=>{let n=Number(text),i=0;need(Number.isSafeInteger(n)&&n>=0,"Введите целое число байтов");while(n>=1024&&i<6){n/=1024;i++;}return (i?n.toFixed(2):n)+" "+["B","KiB","MiB","GiB","TiB","PiB","EiB"][i];});
add("rs-week-grid","Прогулка\nЧтение","По одной привычке на строку.",text=>"| Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun |\n|"+Array(8).fill(" --- ").join("|")+"|\n"+lines(text).map(x=>`| ${x.replaceAll("|","\\|")} |   |   |   |   |   |   |   |`).join("\n"));
function body(value){return JSON.parse(value);}
add("go-event-inbox",'{"id":"demo-1","type":"order.created"}',"Отправьте событие дважды, затем измените type. Состояние живёт в демо.",(text,state)=>{const v=body(text);need(typeof v.id==="string"&&typeof v.type==="string"&&v.id.trim()&&v.type.trim(),"Нужны id и type");state.events??=new Map();const existing=state.events.get(v.id);if(existing) return existing.type===v.type?"HTTP 200 · повтор принят":"HTTP 409 · ID уже связан с другим типом";state.events.set(v.id,v);if(state.events.size>100)state.events.delete(state.events.keys().next().value);return "HTTP 201\n"+JSON.stringify([...state.events.values()],null,2);},{"Конфликт ID":'{"id":"demo-1","type":"order.cancelled"}'});
add("go-expiring-links",'{"url":"https://example.org","ttl":60}',"Создайте ссылку, затем вставьте её путь, чтобы проверить перенаправление.",(text,state)=>{state.links??=new Map();if(text.startsWith("/r/")) {const link=state.links.get(text.trim());return link&&Date.now()<link.until?"HTTP 302\nLocation: "+link.url:"HTTP 404";}const v=body(text);const url=new URL(v.url);need(/^https?:$/.test(url.protocol)&&!url.username&&!url.password&&Number.isInteger(v.ttl)&&v.ttl>=1&&v.ttl<=86400,"Нужен HTTP(S)-адрес и TTL от 1 до 86400");const path="/r/"+String(state.links.size+1);state.links.set(path,{url:url.href,until:Date.now()+v.ttl*1000});return "HTTP 201\n"+JSON.stringify({path});},{"Проверить первую ссылку":"/r/1"});
add("go-job-queue",'{"text":"hello"}',"Отправьте текст, затем запросите задачу по её ID.",async(text,state)=>{state.jobs??=[];if(/^\s*\d+\s*$/.test(text)){const result=state.jobs[Number(text)-1];return result?{id:Number(text),status:"done",sha256:result}:"HTTP 404";}const v=body(text);need(typeof v.text==="string"&&v.text.length,"Нужен непустой текст");state.jobs.push(await hash(v.text));return "HTTP 202\n"+JSON.stringify({id:state.jobs.length,status:"queued"});},{"Проверить задачу 1":"1"});
add("go-room-booking",'{"room":"Atlas","start":"2026-12-01T10:00:00Z","end":"2026-12-01T11:00:00Z"}',"Попробуйте забронировать комнату дважды или открыть список заявок.",(text,state)=>{state.bookings??=[];if(text.trim()==="GET")return state.bookings;const v=body(text);const start=Date.parse(v.start),end=Date.parse(v.end);need(typeof v.room==="string"&&v.room.trim()&&Number.isFinite(start)&&end>start,"Некорректная комната или интервал");if(state.bookings.some(x=>x.room.toLowerCase()===v.room.trim().toLowerCase()&&start<Date.parse(x.end)&&Date.parse(x.start)<end))return "HTTP 409 · пересечение интервалов";state.bookings.push({...v,room:v.room.trim()});return "HTTP 201 · бронь создана";},{"Список заявок":"GET"});
add("go-stock-counter",'{"sku":"coffee","delta":12}',"Положительное число пополняет остаток, отрицательное списывает.",(text,state)=>{state.stock??=Object.create(null);if(text.trim()==="GET")return state.stock;const v=body(text);need(typeof v.sku==="string"&&v.sku.trim()&&Number.isInteger(v.delta)&&v.delta,"Нужны SKU и ненулевое целое число");const sku=v.sku.trim(),next=(state.stock[sku]??0)+v.delta;if(next<0)return "HTTP 409 · недостаточно товара";state.stock[sku]=next;return { [sku]:next };},{"Списать 5":'{"sku":"coffee","delta":-5}',"Остатки":"GET"});
add("go-choice-poll",'{"voter":"demo-1","option":"Go"}',"Попробуйте голос от одного участника дважды.",(text,state)=>{state.votes??=new Map();if(text.trim()==="GET")return Object.assign({Go:0,Python:0,Rust:0},count(state.votes.values()));const v=body(text);need(typeof v.voter==="string"&&v.voter.trim()&&["Go","Python","Rust"].includes(v.option),"Нужен участник и вариант Go, Python или Rust");if(state.votes.has(v.voter.trim()))return "HTTP 409 · участник уже голосовал";state.votes.set(v.voter.trim(),v.option);return "HTTP 201 · голос принят";},{"Результаты":"GET"});
add("passforge","24","Введите длину от 8 до 128. Демо генерирует пароль локально.",text=>{const n=Number(text);need(Number.isInteger(n)&&n>=8&&n<=128,"Длина от 8 до 128");const chars="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*_-+=?~";const a=new Uint32Array(n);crypto.getRandomValues(a);return [...a].map(x=>chars[x%chars.length]).join("");});
add("taskflow","add Проверить README","Команды: add описание, list, done ID, remove ID.",(text,state)=>{state.tasks??=[];state.next??=1;const [cmd,...parts]=words(text);if(cmd==="add"){need(parts.length,"Добавьте описание");state.tasks.push({id:state.next++,title:parts.join(" "),done:false});}else if(cmd==="done"||cmd==="remove"){const id=Number(parts[0]);const item=state.tasks.find(t=>t.id===id);need(item,"Нет задачи с таким ID");if(cmd==="done")item.done=true;else state.tasks=state.tasks.filter(t=>t!==item);}else need(cmd==="list","Неизвестная команда");return state.tasks.map(t=>`${t.done?"✔":"○"} #${t.id} ${t.title}`).join("\n")||"Список пуст";},{"Список":"list","Завершить первую":"done 1"});
add("tidybox","photo.jpg\nreport.pdf\narchive.zip\nnotes.txt","Напишите имена файлов. Демо покажет план перемещения без доступа к диску.",text=>lines(text).map(f=>{const x=f.split(".").pop().toLowerCase();const kind=/^(png|jpg|jpeg|webp|gif)$/.test(x)?"Images":/^(pdf|doc|docx|txt)$/.test(x)?"Documents":/^(zip|rar|gz)$/.test(x)?"Archives":"Other";return f+" → "+kind+"/"+f;}).join("\n"));
add("uptime-check","https://example.com\nhttps://example.net","Тестовые HTTP-ответы. Добавьте URL, чтобы проверить формат отчёта.",text=>lines(text).map(x=>{const url=new URL(x);return {url:url.href,status:url.hostname==="example.com"?200:503,ms:url.hostname==="example.com"?24:85,simulated:true};}));
function dnsTarget(text) {
 const input = text.trim();
 const ipv4 = input.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
 if (ipv4) {
  const octets = ipv4.slice(1).map(Number);
  need(octets.every(n => n <= 255), "Некорректный IPv4.");
  return { label: octets.join("."), name: octets.reverse().join(".") + ".in-addr.arpa", types:["PTR"] };
 }
 if (input.includes(":") && !input.includes("://")) {
  const canonical = new URL("http://[" + input.replace(/^\[|\]$/g,"") + "]").hostname.slice(1,-1);
  const [left, right] = canonical.split("::");
  const head = left.split(":").filter(Boolean), tail = (right || "").split(":").filter(Boolean);
  const groups = right === undefined ? head : [...head,...Array(8-head.length-tail.length).fill("0"),...tail];
  return {label:canonical,name:[...groups.map(x=>x.padStart(4,"0")).join("")].reverse().join(".")+".ip6.arpa",types:["PTR"]};
 }
 need(input && !/[\s@?#/\\%]/.test(input), "Введите домен или IP без пути, порта и параметров.");
 const name = new URL("https://" + input).hostname.replace(/\.$/,"").toLowerCase();
 need(name.length <= 253 && name.includes(".") && /^[a-z]/.test(name.split(".").at(-1)) &&
  name.split(".").every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(label)),
  "Введите корректный домен, например mos.ru.");
 return {label:name,name,types:["A","AAAA","MX","NS","TXT","CAA"]};
}
async function lookupDNS(text) {
 const {label,name,types} = dnsTarget(text);
 const groups = await Promise.allSettled(types.map(async type => {
  const url = new URL("https://dns.google/resolve");
  url.search = new URLSearchParams({name,type});
  const response = await fetch(url,{credentials:"omit",signal:AbortSignal.timeout(8000)});
  if (!response.ok) throw Error("DNS API вернул HTTP " + response.status);
  return response.json();
 }));
 if (groups.every(result=>result.status==="rejected")) throw Error("DNS-сервис недоступен. Повторите запрос позже.");
 const codes = {1:"A",5:"CNAME",12:"PTR",15:"MX",16:"TXT",28:"AAAA",2:"NS",257:"CAA"};
 const sections = types.map((type,index)=>{
  const group=groups[index];
  if(group.status==="rejected") return type+" · запрос не выполнен";
  const answer=group.value;
  if(answer.Status===3) return type+" · имя не найдено (NXDOMAIN)";
  if(answer.Status!==0) return type+" · ошибка DNS (код "+answer.Status+")";
  if(!answer.Answer?.length)return type+" · записей нет";
  return type+"\n"+answer.Answer.map(row=>"  "+(codes[row.type]||row.type)+"  "+row.data+"  (TTL "+row.TTL+" с)").join("\n");
 });
 return label+" · DNS\nИсточник: Google Public DNS\n\n"+sections.join("\n\n");
}
add("netscout","mos.ru","Введите домен, IPv4 или IPv6. Показывает фактические DNS-записи или обратный PTR.",lookupDNS,{"Домен":"mos.ru","Обратный DNS":"8.8.8.8"});
add("weathernow","Moscow","Учебный прогноз. Для Москвы, Лондона и Токио есть разные тестовые данные.",text=>{const data={moscow:[-3,"облачно"],london:[8,"дождь"],tokyo:[14,"ясно"]};const weather=data[text.trim().toLowerCase()];need(weather,"Попробуйте Moscow, London или Tokyo");return `${text.trim()} · ${weather[0]} °C · ${weather[1]}\n`+Array.from({length:5},(_,i)=>`День ${i+1}: ${weather[0]+(i%3)} °C`).join("\n");});
add("site-mirror-kit","https://example.com/","Демонстрация манифеста на учебных данных. Укажите адрес, чтобы увидеть пример структуры архива.",text=>{const url=new URL(text);need(/^https?:$/.test(url.protocol),"Нужен HTTP(S)-адрес");return {entry:url.href,files:[{url:url.href,path:"files/index.html",status:200}],snapshots:["snapshots/001.html"],preview:"http://127.0.0.1:4173"};});
add("ridex-local","register demo","Демонстрационный сценарий аккаунта. Используйте register имя, login имя, profile или logout. Пароль вводить не нужно.",(text,state)=>{const [cmd,name]=words(text);state.accounts??=new Set();switch(cmd){case "register":need(name,"Укажите имя");need(!state.accounts.has(name),"Имя уже занято");state.accounts.add(name);state.user=name;return "Аккаунт создан. Открыт профиль: "+name;case "login":need(state.accounts.has(name),"Аккаунт не найден");state.user=name;return "Вход выполнен";case "profile":return state.user?"Профиль: "+state.user:"Сначала войдите";case "logout":state.user="";return "Вы вышли";default:throw Error("Неизвестная команда");}},{"Профиль":"profile","Выйти":"logout","Войти":"login demo"});

const id = new URLSearchParams(location.search).get("project");
const demo = entries.get(id);
const form = document.querySelector("#input");
const field = form.querySelector("textarea");
const result = document.querySelector("#result");
const reset = document.querySelector("#reset");
let state = {};
function show(value){result.textContent = typeof value==="string"?value:JSON.stringify(value,null,2);}
if(demo){
 field.value=demo.input;
 document.querySelector("#hint").textContent=demo.hint+(id==="netscout"?" Введённый адрес передаётся Google Public DNS.":" Действия выполняются в браузерном демо.");
 document.querySelector("#title").textContent=id;
 for(const [label,value] of Object.entries(demo.actions)){
  const button=document.createElement("button");
  button.textContent=label;button.onclick=()=>{field.value=value;form.requestSubmit();};
  document.querySelector(".scenarios").append(button);
 }
 form.onsubmit=async event=>{
  event.preventDefault();
  const controls=[...document.querySelectorAll(".console button, .console textarea")];
  for(const control of controls) control.disabled=true;
  try{show(await demo.run(field.value,state,show));}catch(error){show(error.message);}
  finally{for(const control of controls)control.disabled=false;}
 };
 reset.onclick=()=>{state={};field.value=demo.input;show("Демо сброшено.");};
 fetch("../projects.json").then(response=>response.json()).then(items=>{
  const project=items.find(item=>item.name===id);if(!project)return;
  document.querySelector("#title").textContent=project.title;
  document.querySelector("#intro").textContent=project.description;
  document.querySelector("#guide").href=new URL(project.demo,new URL("../",location.href)).href;
 }).catch(()=>{});
}else{
 form.hidden=true;reset.hidden=true;show("Откройте проект из каталога, чтобы загрузить его входные данные.");
}
