"use strict";
const browserPanel = document.createElement("section");
browserPanel.className = "browser-panel";
browserPanel.innerHTML = `
 <h2>Построить карту проекта</h2>
 <form id="repo-form">
  <label>Ссылка на GitHub-репозиторий или сайт <input id="repo-url" type="url" placeholder="https://github.com/vasypypkin/exemple" required></label>
  <div class="repo-actions"><button class="repo-submit" type="submit">Построить схему</button><a class="repo-example" href="?demo=spy">Пример бота</a><a class="repo-example" href="?demo=site">Пример сайта</a><a class="repo-example" href="start.html">Скачать и запустить</a></div>
 </form>
 <p id="repo-status" role="status"></p>
 <p>Для репозитория карта строится по исходникам. По адресу сайта RepoMap покажет ссылки стартовой страницы, если браузеру доступен её HTML.</p>`;
document.querySelector(".toolbar").before(browserPanel);
const heading = document.querySelector("header h1");
const summary = document.querySelector("header p");
summary.textContent = `Пример: ${heading.textContent} · ${summary.textContent}`;
heading.textContent = "RepoMap";
document.title = "RepoMap · карта проектов";
const repoForm = browserPanel.querySelector("form");
const repoInput = browserPanel.querySelector("input");
const status = browserPanel.querySelector("#repo-status");
let engine;
const showGraph = createRepoGraph();

function parseRepository(input) {
 const url = new URL(input.trim());
 const match = url.pathname.match(/^\/([A-Za-z0-9-]{1,39})\/([A-Za-z0-9_.-]{1,100})\/?$/);
 if (url.origin !== "https://github.com" || url.username || url.password || !match) {
  throw new Error("Вставьте адрес репозитория в формате https://github.com/владелец/репозиторий.");
 }
 const name = match[2].replace(/\.git$/, "");
 if (!name || name === "." || name === "..") throw new Error("Укажите имя репозитория.");
 return `${match[1]}/${name}`;
}

async function request(url, timeout = 12000) {
 const response = await fetch(url, { credentials: "omit", signal: AbortSignal.timeout(timeout) });
 if (response.status === 403 || response.status === 429) {
  const body = await response.json().catch(() => ({}));
  const rateLimited = response.status === 429 || response.headers.get("x-ratelimit-remaining") === "0"
   || response.headers.has("retry-after") || /rate limit/i.test(body.message || "");
  const error = new Error(rateLimited
   ? "Сервис ограничил число запросов. Попробуйте позже или запустите локальную версию."
   : "Сервис не разрешил доступ к этому репозиторию.");
  if (rateLimited) error.name = "RateLimitError";
  throw error;
 }
 if (response.status === 404) throw new Error("Репозиторий или файл недоступен. Проверьте ссылку и публичность репозитория.");
 if (!response.ok) throw new Error(`GitHub вернул HTTP ${response.status}.`);
 return response;
}

async function startEngine() {
 if (engine) return engine;
 engine = (async () => {
  const runtime = new Go();
  const response = await fetch("repomap.wasm?v=tree-1");
  if (!response.ok) throw new Error("Не удалось загрузить анализатор RepoMap.");
  const { instance } = await WebAssembly.instantiate(await response.arrayBuffer(), runtime.importObject);
  void runtime.run(instance);
  if (typeof globalThis.repomapAnalyzeSource !== "function") throw new Error("Анализатор не запустился.");
  return globalThis.repomapAnalyzeSource;
 })().catch(error => { engine = undefined; throw error; });
 return engine;
}

async function repositoryTree(repo) {
 const api = `https://api.github.com/repos/${repo}`;
 try {
  const metadata = await (await request(api, 4500)).json();
  const commit = await (await request(`${api}/commits/${encodeURIComponent(metadata.default_branch)}`, 4500)).json();
  const tree = await (await request(`${api}/git/trees/${commit.sha}?recursive=1`, 4500)).json();
  return { items: tree.tree.filter(file => file.type === "blob" && /^100/.test(file.mode)), ref: commit.sha, partial: tree.truncated, cached: false };
 } catch (error) {
  if (!(error instanceof TypeError) && !["TimeoutError", "RateLimitError"].includes(error.name)) throw error;
  const listing = await (await request(`https://data.jsdelivr.com/v1/package/gh/${repo}@HEAD/flat`)).json();
  return { items: listing.files.map(file => ({ path: file.name.replace(/^\//, ""), size: file.size, hash: file.hash })), ref: "HEAD", partial: false, cached: true };
 }
}

async function listSources(repo) {
 const tree = await repositoryTree(repo);
 const candidates = tree.items.filter(file =>
  /\.(?:go|html?|m?js|tsx?|py)$/i.test(file.path)
  && !/(?:^|\/)(?:node_modules|vendor|dist|coverage|\.venv|testdata)\//i.test(file.path)
  && !/(?:_test\.go|\.min\.js)$/i.test(file.path));
 const files = [];
 let budget = 4 * 1024 * 1024;
 for (const item of candidates) {
  if (files.length === 100) break;
  if (item.size > 256 * 1024 || item.size > budget) continue;
  budget -= item.size;
  files.push(item);
 }
 return { files, total: candidates.length, ref: tree.ref, cached: tree.cached, partial: tree.partial || files.length < candidates.length };
}

async function sourceText(repo, tree, file) {
 const encoded = file.path.split("/").map(encodeURIComponent).join("/");
 if (!tree.cached) {
  return (await request(`https://raw.githubusercontent.com/${repo}/${tree.ref}/${encoded}`)).text();
 }
 const response = await request(`https://cdn.jsdelivr.net/gh/${repo}@HEAD/${encoded}`);
 const data = await response.arrayBuffer();
 const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
 if (btoa(String.fromCharCode(...digest)) !== file.hash) throw new Error("Версии файла и списка не совпали.");
 return new TextDecoder().decode(data);
}
function el(tag, text, className) {
 const node = document.createElement(tag);
 if (text) node.textContent = text;
 if (className) node.className = className;
 return node;
}
function sourceLink(repo, sha, edge, label) {
 const link = el("a", label);
 link.href = edge.PageURL || `https://github.com/${repo}/blob/${sha}/${edge.File.split("/").map(encodeURIComponent).join("/")}#L${edge.Line}`;
 return link;
}
function renderMap(repo, sha, edges, flows, files) {
 const callbacks = new Map();
 for (const edge of edges) {
  if (edge.Label === "Callback" && !callbacks.has(edge.From)) callbacks.set(edge.From, edge);
 }
 showGraph(repo, sha, edges, flows, callbacks);
 const items = edges.map(edge => {
  const item = el("article", "", "flow");
  item.dataset.kind = edge.Kind;
  const nodes = el("div", "", "nodes");
  const arrow = el("div", "", "edge");
  arrow.append(el("span", edge.Label));
  const shape = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  shape.setAttribute("viewBox", "0 0 100 11");
  shape.setAttribute("aria-hidden", "true");
  const line = document.createElementNS(shape.namespaceURI, "path");
  line.setAttribute("d", "M2,5.5 H96 M90,1 L97,5.5 L90,10");
  shape.append(line);
  arrow.append(shape);
  nodes.append(el("div", edge.From, "node"), arrow, el("div", edge.To, "node"));
  item.append(nodes);
  const handler = edge.Label === "Кнопка" && callbacks.get(edge.To.split(":")[0]);
  if (handler) {
   const target = el("p", "", "handler");
   target.append(document.createTextNode("↳ Обработчик: "), sourceLink(repo, sha, handler, handler.To));
   item.append(target);
  }
  const details = el("details");
  details.append(el("summary", edge.PageURL ? "Открыть страницу" : "Место в исходниках"),
   sourceLink(repo, sha, edge, edge.PageURL ? "Перейти ↗" : `${edge.File}:${edge.Line}`));
  item.append(details);
  return item;
 });
 document.querySelector("header h1").textContent = repo;
 document.querySelector("header p").textContent = `${sha ? files + " файлов изучено" : "Стартовая страница"} · ${edges.length} связей найдено`;
 document.title = `${repo} · RepoMap`;
 document.querySelector("#map").replaceChildren(...items);
 document.dispatchEvent(new Event("repomap:changed"));
 document.querySelector(`button[data-kind="${edges.some(edge => edge.Kind === "bot") ? "bot" : "all"}"]`).click();
}

async function buildRepository(input) {
 const repo = parseRepository(input);
 status.textContent = "Читаю дерево GitHub и загружаю анализатор…";
 const [tree, analyze] = await Promise.all([listSources(repo), startEngine()]);
 const results = Array.from({ length: tree.files.length }, () => ({}));
 let cursor = 0, loaded = 0, failed = 0;
 await Promise.all(Array.from({ length: Math.min(6, tree.files.length) }, async () => {
  while (cursor < tree.files.length) {
   const index = cursor++;
   const file = tree.files[index];
   try {
    results[index] = JSON.parse(analyze(file.path, await sourceText(repo, tree, file)));
    loaded++;
   } catch {
    failed++;
   }
   status.textContent = `Загружаю исходники: ${loaded + failed} из ${tree.files.length}…`;
  }
 }));
 if (failed && !loaded) throw new Error("Не удалось загрузить исходники. Проверьте подключение к GitHub.");
 const unique = new Set();
 const edges = results.flatMap(item => item.Edges || []).filter(edge => {
  const key = JSON.stringify([edge.Kind, edge.Label, edge.From, edge.To]);
  if (unique.has(key)) return false;
  unique.add(key);
  return true;
 });
 const flows = results.flatMap(item => item.Flows || []);
 renderMap(repo, tree.ref, edges, flows, loaded);
 status.textContent = (tree.cached ? "Готово · снимок HEAD из кэша jsDelivr. Ссылки ведут в текущую основную ветку." : `Готово · ревизия ${tree.ref.slice(0, 8)}.`)
  + (tree.partial ? ` Часть файлов пропущена из-за ограничений размера или количества (кандидатов: ${tree.total}).` : "")
  + (failed ? ` Не удалось прочитать файлов: ${failed}.` : "");
}

async function buildWebsite(url) {
 status.textContent = "Загружаю стартовую страницу…";
 const local = url.origin === location.origin && ["127.0.0.1","localhost"].includes(url.hostname);
 if ((!local && url.protocol !== "https:") || url.username || url.password) {
  throw new Error("Для сайта укажите публичную HTTPS-ссылку без логина и пароля.");
 }
 let response;
 try {
  response = await fetch(url, {credentials:"omit",signal:AbortSignal.timeout(8000)});
 } catch {
  throw new Error("Браузер не смог прочитать сайт. Если сайт закрывает доступ к HTML из других доменов, вставьте ссылку на его GitHub-репозиторий.");
 }
 if (!response.ok) throw new Error(`Сайт вернул HTTP ${response.status}.`);
 if (!/^text\/html\b/i.test(response.headers.get("content-type") || "")) {
  throw new Error("По этому адресу нет HTML-страницы.");
 }
 const reader = response.body.getReader();
 const decoder = new TextDecoder();
 let html = "", bytes = 0;
 while (true) {
  const {value,done} = await reader.read();
  if (done) break;
  bytes += value.length;
  if (bytes > 512 * 1024) {
   await reader.cancel();
   throw new Error("HTML страницы превышает 512 КБ. Попробуйте ссылку на репозиторий.");
  }
  html += decoder.decode(value,{stream:true});
 }
 html += decoder.decode();
 const page = new URL(response.url);
 const documentFragment = document.createElement("template");
 documentFragment.innerHTML = html;
 const pathLabel = address => address.pathname + address.search;
 const links = new Map();
 const base = documentFragment.content.querySelector("base[href]")?.getAttribute("href");
 let linkBase = page;
 if (base) {
  try { linkBase = new URL(base,page); } catch {}
 }
 for (const anchor of documentFragment.content.querySelectorAll("a[href]:not([download])")) {
  if (links.size === 120) break;
  const href = anchor.getAttribute("href").trim();
  if (!href || href.startsWith("#")) continue;
  let target;
  try { target = new URL(href,linkBase); } catch { continue; }
  if (target.origin !== page.origin || target.username || target.password ||
      pathLabel(target) === pathLabel(page)) continue;
  const key = pathLabel(target);
  if (links.has(key)) continue;
  target.hash = "";
  links.set(key,{Kind:"site",Label:"Переход",From:pathLabel(page),To:key,
   File:"",Line:0,PageURL:target.href});
 }
 const edges = [...links.values()];
 renderMap(page.host, null, edges, [], 1);
 status.textContent = edges.length
  ? "Показаны внутренние ссылки из HTML стартовой страницы. Переходы, созданные JavaScript, могут отсутствовать."
  : "В HTML этой страницы внутренних ссылок не найдено.";
}

async function runAnalysis(input) {
 for (const control of repoForm.elements) control.disabled = true;
 try {
  const url = new URL(input.trim());
  if (url.hostname === "github.com") await buildRepository(input);
  else await buildWebsite(url);
 } catch (error) {
  status.textContent = error instanceof TypeError ? "Проверьте адрес или подключение к сети." : error.message;
 } finally {
  for (const control of repoForm.elements) control.disabled = false;
 }
}
repoForm.addEventListener("submit", event => {
 event.preventDefault();
 void runAnalysis(repoInput.value);
});
const demo = new URLSearchParams(location.search).get("demo");
if (demo === "spy") {
 void runAnalysis("https://github.com/mainstarkov/spy-bot");
} else if (demo === "site") {
 void runAnalysis(new URL("../",location.href).href);
}
