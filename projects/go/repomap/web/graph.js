"use strict";

function createRepoGraph() {
 const section = document.createElement("section");
 section.className = "diagram";
 section.id = "repo-diagram";
 section.hidden = true;
 section.innerHTML = `<header class="diagram-head">
  <div><h2>Схема проекта</h2><p id="diagram-summary"></p></div>
  <div class="diagram-tools">
   <div class="diagram-modes" aria-label="Режим схемы">
   <button type="button" data-diagram="overview" aria-pressed="true">Связи</button>
   <button type="button" data-diagram="conditions" aria-pressed="false">Условия</button></div>
   <div class="diagram-scale" aria-label="Управление масштабом">
    <button type="button" id="diagram-minus" aria-label="Уменьшить масштаб">−</button>
    <label class="diagram-zoom"><span class="diagram-sr">Масштаб</span><select id="diagram-zoom" aria-label="Масштаб"><option value=".1">10%</option><option value=".25">25%</option><option value=".5">50%</option><option value=".65">65%</option><option value=".8">80%</option><option value="1" selected>100%</option><option value="1.25">125%</option><option value="1.5">150%</option><option value="2">200%</option></select></label>
    <button type="button" id="diagram-plus" aria-label="Увеличить масштаб">+</button>
   </div>
   <button type="button" id="diagram-fit">Вписать</button>
   <button type="button" id="diagram-full">На весь экран</button>
  </div></header>
  <div class="diagram-navigation">
   <label id="diagram-jump-label" hidden>Перейти к разделу <select id="diagram-jump"><option value="">Выбрать раздел</option></select></label>
   <label id="diagram-handler-label" hidden>Функция <select id="diagram-handler"></select></label>
   <div class="diagram-disclosure-tools" hidden>
    <button type="button" id="diagram-all" aria-pressed="false">Все ветки</button>
    <button type="button" id="diagram-collapse" disabled>Свернуть ветки</button>
   </div>
   <button type="button" id="diagram-top">↑ К началу схемы</button>
  </div>
  <div class="diagram-workspace">
   <div class="diagram-scroll" tabindex="0" aria-label="Прокручиваемая схема">
    <div class="diagram-stage"><div id="diagram-content"></div></div>
   </div>
   <button type="button" id="diagram-minimap" aria-label="Мини-карта схемы" title="Щёлкните по мини-карте для перехода"><canvas aria-hidden="true"></canvas></button>
  </div>
  <p class="diagram-hint"><span>Перетаскивание за фон · Ctrl / ⌘ + колесо для масштаба</span><span>Свайп для перемещения · два пальца для масштаба</span></p>`;
 const toolbar = document.querySelector(".toolbar");
 toolbar.before(section);
 toolbar.id = "repo-connections";
 const menu = document.createElement("nav");
 menu.className = "repo-navigation";
 menu.setAttribute("aria-label", "Навигация по RepoMap");
 menu.hidden = true;
 menu.innerHTML = '<a href="#repo-form">Репозиторий</a><a href="#repo-diagram">Схема</a><a href="#repo-connections">Список связей</a>';
 section.before(menu);
 const menuLinks = [...menu.querySelectorAll("a")];
 function markLocation() {
  for (const link of menuLinks) {
   if (link.hash === location.hash) link.setAttribute("aria-current", "location");
   else link.removeAttribute("aria-current");
  }
 }
 window.addEventListener("hashchange", markLocation);
 markLocation();
 const list = document.querySelector("#map");
 list.classList.add("repo-connection-scroll");
 list.tabIndex = 0;
 const viewport = section.querySelector(".diagram-scroll");
 keepScrollInside(viewport);
 keepScrollInside(list);
 const content = section.querySelector("#diagram-content");
 const canvas = installDiagramCanvas(section, viewport, content);
 const allBranches = section.querySelector("#diagram-all");
 const collapseBranches = section.querySelector("#diagram-collapse");
 const disclosureTools = section.querySelector(".diagram-disclosure-tools");
 const openToggle = '.diagram-toggle[aria-expanded="true"]';
 function visibleExpanded() {
  return [...content.querySelectorAll(openToggle)].some(button => !button.closest("[hidden]"));
 }
 function updateDisclosures() {
  collapseBranches.disabled = !visibleExpanded();
  const closed = content.querySelector('.diagram-card[data-type="button"] .diagram-toggle[aria-expanded="false"]');
  if (closed) allBranches.setAttribute("aria-pressed", "false");
 }
 allBranches.addEventListener("click", () => {
  for (const button of content.querySelectorAll('.diagram-card[data-type="button"] .diagram-toggle[aria-expanded="false"]')) {
   button.click();
  }
  content.classList.add("diagram-wide-tree");
  allBranches.setAttribute("aria-pressed", "true");
  canvas.fit();
 });
 collapseBranches.addEventListener("click", () => {
  for (const button of [...content.querySelectorAll(openToggle)].reverse()) button.click();
  content.classList.remove("diagram-wide-tree");
  allBranches.setAttribute("aria-pressed", "false");
  canvas.reset();
 });
 const handler = section.querySelector("#diagram-handler");
 const handlerLabel = section.querySelector("#diagram-handler-label");
 const jump = section.querySelector("#diagram-jump");
 const jumpLabel = section.querySelector("#diagram-jump-label");
 const toTop = () => viewport.scrollTo({top:0,left:0});
 section.querySelector("#diagram-top").addEventListener("click", toTop);
 jump.addEventListener("change", () => {
  if (!jump.value) return;
  const group = content.querySelector(`[data-group-index="${jump.value}"]`);
  if (group) showInViewport(group, false);
  jump.value = "";
 });
 function showInViewport(element, center) {
  const top = viewport.scrollTop + element.getBoundingClientRect().top - viewport.getBoundingClientRect().top;
  viewport.scrollTo({top:top - (center ? viewport.clientHeight / 3 : 12),left:0});
 }
 const modes = [...section.querySelectorAll("[data-diagram]")];
 const fullscreen = section.querySelector("#diagram-full");
 fullscreen.hidden = !document.fullscreenEnabled;
 fullscreen.addEventListener("click", async () => {
  try {
   if (document.fullscreenElement === section) await document.exitFullscreen();
   else await section.requestFullscreen();
  } catch {
   fullscreen.hidden = true;
  }
 });
 document.addEventListener("fullscreenchange", () => {
  fullscreen.textContent = document.fullscreenElement === section ? "Выйти из полноэкранного режима" : "На весь экран";
 });
 let data, mode = "overview", buttonID = 0;

 function node(text, type, children = [], link = null, action = null) {
  const item = el("li", "", "diagram-node");
  const card = el("div", "", "diagram-card");
  card.dataset.type = type;
  card.append(el("span", text, "diagram-text"));
  if (link) card.append(link);
  if (action) {
   const button = el("button", "Условия ↗");
   button.type = "button";
   button.addEventListener("click", action);
   card.append(button);
  }
  item.append(card);
  if (children.length) {
   const list = el("ul", "", "diagram-children");
   list.append(...children);
   item.append(list);
  }
  return item;
 }
 function source(edge, label = `↗ ${edge.File}:${edge.Line}`) {
  const link = sourceLink(data.repo, data.ref, edge, label);
  link.className = "diagram-source";
  link.target = "_blank";
  link.rel = "noopener";
  return link;
 }
 function sequence(steps, continuation) {
  let next = continuation;
  return [...(steps || [])].reverse().map(step => {
   const cursor = {step, next};
   next = cursor;
   return cursor;
  }).reverse();
 }
 function callbackSteps(steps, target, continuation = null) {
  for (const {step, next} of sequence(steps, continuation)) {
   if (step.Line === target) return {steps:[step], next};
   for (const branch of step.Branches || []) {
    if (branch.Line === target) {
     const otherBranches = step.Branches.filter(item => item !== branch);
     if (!otherBranches.some(item => item.Label === "default")) {
      otherBranches.push({Label:"Нет совпадения", Steps:[]});
     }
     return {
      steps: [{
       ...step, Kind:"condition", Line:target, Text:`${step.Text} → case ${branch.Label}?`,
       Branches: [
        {Label:"Да", Steps:branch.Steps},
        {Label:"Нет", Steps:[{...step, Text:"Другие варианты этого switch", Branches:otherBranches}]},
       ],
      }],
      next,
     };
    }
    const nested = callbackSteps(branch.Steps, target, next);
    if (nested) return {
     steps:[{...step, Branches:step.Branches.map(item => item === branch
      ? {...item, Steps:nested.steps, Next:nested.next} : item)}],
     next,
    };
   }
  }
  return null;
 }
 function callbackTree(edge) {
  const match = edge.Label === "Кнопка" && data.callbacks.get(edge.To.split(":")[0]);
  if (!match) return node(edge.To, "value", [], source(edge));
  const flow = data.flows.find(item =>
   item.File === match.File && item.Line <= match.Line && item.End >= match.Line);
  const focused = flow && callbackSteps(flow.Steps, match.Line);
  const children = focused ? conditionTree(flow, focused.steps, focused.next)
   : [node("Подробности этой ветки в исходниках", "value")];
  return node(edge.To, "value", [
   node(match.To, "action", children, source(match))
  ]);
 }
 function expandableNode(text, type, link, render) {
  const item = node(text, type, [], link);
  const card = item.firstElementChild;
  card.classList.add("diagram-disclosure");
  const disclosure = el("button", text, "diagram-toggle");
  disclosure.type = "button";
  disclosure.setAttribute("aria-expanded", "false");
  card.firstElementChild.replaceWith(disclosure);
  const children = el("ul", "", "diagram-children");
  children.id = `diagram-steps-${++buttonID}`;
  children.hidden = true;
  disclosure.setAttribute("aria-controls", children.id);
  item.append(children);
  disclosure.addEventListener("click", () => {
   const opening = children.hidden;
   if (opening && !children.firstChild) children.append(...render());
   children.hidden = !opening;
   disclosure.setAttribute("aria-expanded", String(opening));
   updateDisclosures();
  });
  card.addEventListener("click", event => {
   if (!event.target.closest("button,a")) disclosure.click();
  });
  disclosure.addEventListener("keydown", event => {
   const expanded = disclosure.getAttribute("aria-expanded") === "true";
   if ((event.key === "ArrowRight" && !expanded) || (event.key === "ArrowLeft" && expanded)) {
    event.preventDefault();
    disclosure.click();
   }
  });
  return item;
 }
 function expandableButton(edge) {
  return expandableNode(edge.From, "button", source(edge), () => [callbackTree(edge)]);
 }
 function group(label, children, layout = "") {
  if (!children.length) return [];
  const item = node(label, "group", children);
  if (layout) item.lastElementChild.classList.add(layout);
  return [item];
 }
 function websiteTree(links) {
  const byPage = new Map();
  for (const edge of links) {
   if (!byPage.has(edge.From)) byPage.set(edge.From, []);
   byPage.get(edge.From).push(edge);
  }
  const reached = new Set();
  let remaining = 160;
  function walk(page, incoming, ancestors) {
   remaining--;
   if (ancestors.has(page)) return node(`${page} · повтор`, "value", [], source(incoming));
   if (reached.has(page)) return node(`${page} · ветка выше`, "value", [], source(incoming));
   reached.add(page);
   const children = [];
   const nextAncestors = new Set([...ancestors, page]);
   for (const edge of byPage.get(page) || []) {
    if (remaining <= 0 || ancestors.size >= 12) {
     children.push(node("Остальные переходы см. в списке связей", "value"));
     break;
    }
    children.push(walk(edge.To, edge, nextAncestors));
   }
   return node(page, "value", children, incoming ? source(incoming) : null);
  }
  const targets = new Set(links.map(edge => edge.To));
  const pages = [...byPage.keys()].sort((a,b) => Number(targets.has(a)) - Number(targets.has(b)) || a.localeCompare(b));
  const roots = [];
  for (const page of pages) {
   if (remaining <= 0) break;
   if (!reached.has(page)) roots.push(walk(page,null,new Set()));
  }
  return roots;
 }
 function overview() {
  const {edges} = data;
  const bot = edges.filter(edge => edge.Kind === "bot");
  const commands = bot.filter(edge => edge.Label === "Команда");
  const buttons = bot.filter(edge => ["Кнопка","Ссылка Telegram"].includes(edge.Label));
  const api = edges.filter(edge => edge.Kind === "api");
  const site = edges.filter(edge => edge.Kind === "site");
  const cap = (items, convert) => [
   ...items.slice(0,120).map(convert),
   ...(items.length > 120 ? [node(`Ещё ${items.length - 120} в списке связей`, "value")] : [])
  ];
  return [
   ...group("Telegram", [
    ...group("Команды", cap(commands, edge => {
     const detected = data.flows.flatMap((flow,index) => flow.File === edge.File && flow.Name === edge.To ? [index] : []);
     const action = detected.length ? () => showConditions(detected[0]) : null;
     return edge.From === "Telegram" ? node(edge.To, "value", [], source(edge))
      : node(edge.From, "value", [node(edge.To, "action", [], source(edge), action)]);
    })),
    ...group("Кнопки", cap(buttons, expandableButton), "diagram-button-grid"),
    ...group("Другие callback", cap(bot.filter(edge => edge.Label === "Callback" &&
     !buttons.some(button => button.To.split(":")[0] === edge.From)),
     edge => node(edge.From,"value",[node(edge.To,"action",[],source(edge))]))),
   ]),
   ...group("HTTP API", cap(api, edge => node(edge.From,"value",[node(edge.To,"action",[],source(edge))]))),
   ...group("Страницы", websiteTree(site)),
  ];
 }
 function exits(steps) {
  return (steps || []).some(step => step.Kind === "exit" ||
   (step.Kind === "condition" && step.Branches.every(branch => exits(branch.Steps))));
 }
 function flowSource(flow, line) {
  return source({File:flow.File,Line:line}, `↗ строка ${line}`);
 }
 function nextStep(flow, cursor) {
  if (!cursor) return node("Конец показанной ветки", "value");
  const {step, next} = cursor;
  return expandableNode(`Дальше: ${step.Text}`, "next", flowSource(flow, step.Line), () => {
   const items = [conditionNode(flow, cursor)];
   if (step.Kind !== "exit" && !step.Branches?.length) items.push(nextStep(flow, next));
   return items;
  });
 }
 function conditionNode(flow, {step, next}) {
  const children = (step.Branches || []).map(branch => {
   const branchNext = branch.Next === undefined ? next : branch.Next;
   const branchSteps = conditionTree(flow, branch.Steps, branchNext);
   if (!exits(branch.Steps)) branchSteps.push(nextStep(flow, branchNext));
   const item = node(branch.Label,"branch",branchSteps,branch.Line ? flowSource(flow, branch.Line) : null);
   if (branch.Line) item.dataset.line = branch.Line;
   return item;
  });
  const item = node(step.Text,step.Kind,children,flowSource(flow, step.Line));
  item.dataset.line = step.Line;
  return item;
 }
 function conditionTree(flow, steps, continuation = null) {
  return sequence(steps, continuation).map(cursor => conditionNode(flow, cursor));
 }
 function showConditions(index, line) {
  handler.value = String(index);
  mode = "conditions";
  paint();
  handler.focus({preventScroll:true});
  if (line) {
   const target = content.querySelector(`[data-line="${line}"] > .diagram-card`);
   if (target) {
    target.classList.add("diagram-highlight");
    showInViewport(target, true);
   }
  }
 }
 function paint() {
  if (!data) return;
  const flow = data.flows[Number(handler.value)];
  const conditions = mode === "conditions";
  for (const button of modes) button.setAttribute("aria-pressed", String(mode === button.dataset.diagram));
  handlerLabel.hidden = !conditions || !flow;
  const tree = el("ul", "", "diagram-tree");
  if (conditions && flow) {
   tree.append(node(flow.Name,"root",conditionTree(flow,flow.Steps),source(flow)));
  } else if (!conditions) {
   const groups = overview();
   if (groups.length) tree.append(node(data.repo,"root",groups));
  }
  content.replaceChildren(tree.childElementCount ? tree : el("p", conditions ? "В поддерживаемых исходниках условия не найдены." : "Связей для схемы не найдено."));
  const groups = conditions ? [] : [...tree.querySelectorAll('.diagram-card[data-type="group"]')];
  jump.replaceChildren(new Option("Выбрать раздел", ""), ...groups.map((group,index) => {
   group.dataset.groupIndex = String(index);
   return new Option(group.querySelector(".diagram-text").textContent, String(index));
  }));
  jumpLabel.hidden = groups.length === 0;
  const hasButtons = !conditions && Boolean(tree.querySelector('.diagram-card[data-type="button"]'));
  allBranches.hidden = !hasButtons;
  disclosureTools.hidden = !hasButtons && !tree.querySelector(".diagram-toggle");
  allBranches.setAttribute("aria-pressed", "false");
  collapseBranches.disabled = true;
  content.classList.remove("diagram-wide-tree");
  toTop();
  canvas.refresh();
  section.querySelector("#diagram-summary").textContent = conditions && flow
   ? `${flow.File}:${flow.Line} · сверху вниз в порядке исходника${flow.Limited ? " · показаны первые 180 элементов" : ""}`
   : "Нажмите на кнопку бота, чтобы раскрыть её условия прямо в дереве.";
 }
 modes.forEach(button => button.addEventListener("click", () => { mode = button.dataset.diagram; paint(); }));
 handler.addEventListener("change", paint);
 return (repo, ref, edges, flows, callbacks) => {
  const priority = flow => /callback|handle|dispatch|route|message|process/i.test(flow.Name) ? 0 : 1;
  flows.sort((a,b) => priority(a) - priority(b) || Number(!/callback/i.test(a.Name)) - Number(!/callback/i.test(b.Name)) || a.File.localeCompare(b.File) || a.Line - b.Line);
  data = {repo, ref, edges, flows, callbacks};
  handler.replaceChildren(...flows.map((flow,index) => new Option(`${flow.Name} · ${flow.File}:${flow.Line}`, String(index))));
  mode = "overview";
  section.hidden = false;
  menu.hidden = false;
  list.scrollTop = 0;
  canvas.reset();
  paint();
 };
}

function keepScrollInside(panel) {
 function canScroll(delta, position, maximum) {
  return maximum > 1 && (delta < 0 ? position > 1 : delta > 0 && position < maximum - 1);
 }
 function atEdge(x, y) {
  return !(canScroll(y, panel.scrollTop, panel.scrollHeight - panel.clientHeight) ||
   canScroll(x, panel.scrollLeft, panel.scrollWidth - panel.clientWidth));
 }
 panel.addEventListener("wheel", event => {
  if (!event.ctrlKey && !event.metaKey && event.cancelable &&
      atEdge(event.shiftKey ? event.deltaX || event.deltaY : event.deltaX, event.shiftKey ? 0 : event.deltaY)) {
   event.preventDefault();
  }
 }, {passive:false});
 let touch;
 panel.addEventListener("touchstart", event => {
  touch = event.touches.length === 1 ? event.touches[0] : null;
 }, {passive:true});
 panel.addEventListener("touchmove", event => {
  if (!touch || event.touches.length !== 1) return;
  const point = event.touches[0];
  const x = touch.clientX - point.clientX;
  const y = touch.clientY - point.clientY;
  if (event.cancelable && (x || y) && atEdge(x, y)) event.preventDefault();
  touch = point;
 }, {passive:false});
}
