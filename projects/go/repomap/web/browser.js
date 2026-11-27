"use strict";
const browserPanel = document.createElement("section");
browserPanel.className = "browser-panel";
browserPanel.innerHTML = `
 <h2>Построить карту GitHub-репозитория</h2>
 <form id="repo-form">
  <label>Ссылка на публичный репозиторий <input id="repo-url" type="url" placeholder="https://github.com/owner/repo" required></label>
  <div class="repo-actions"><button class="repo-submit" type="submit">Построить схему</button><button id="spy-example" type="button">Попробовать Spy Bot</button></div>
 </form>
 <p id="repo-status" role="status"></p>
 <p>Анализ идёт в браузере по исходникам из основной ветки. Для закрытых репозиториев используйте локальную версию.</p>`;
document.querySelector(".toolbar").before(browserPanel);
const heading = document.querySelector("header h1");
const summary = document.querySelector("header p");
summary.textContent = `Пример: ${heading.textContent} · ${summary.textContent}`;
heading.textContent = "RepoMap";
document.title = "RepoMap · карта GitHub-репозитория";
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
  throw new Error("GitHub ограничил число запросов. Попробуйте позже или запустите локальную версию.");
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
  if (!(error instanceof TypeError) && error.name !== "TimeoutError") throw error;
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
 link.href = `https://github.com/${repo}/blob/${sha}/${edge.File.split("/").map(encodeURIComponent).join("/")}#L${edge.Line}`;
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
  details.append(el("summary", "Место в исходниках"), sourceLink(repo, sha, edge, `${edge.File}:${edge.Line}`));
  item.append(details);
  return item;
 });
 document.querySelector("header h1").textContent = repo;
 document.querySelector("header p").textContent = `${files} файлов изучено · ${edges.length} связей найдено`;
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

repoForm.addEventListener("submit", async event => {
 event.preventDefault();
 const input = repoInput.value;
 for (const control of repoForm.elements) control.disabled = true;
 try {
  await buildRepository(input);
 } catch (error) {
  status.textContent = error.message;
 } finally {
  for (const control of repoForm.elements) control.disabled = false;
 }
});
function loadSpyExample() {
 repoInput.value = "https://github.com/mainstarkov/spy-bot";
 repoForm.requestSubmit();
}
browserPanel.querySelector("#spy-example").addEventListener("click", loadSpyExample);
if (new URLSearchParams(location.search).get("demo") === "spy") loadSpyExample();
