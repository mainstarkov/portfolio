"use strict";

function installDiagramCanvas(section, viewport, content) {
 const minimumScale = .1;
 const zoomOut = section.querySelector("#diagram-minus");
 const zoomMenu = section.querySelector("#diagram-zoom");
 const minimap = section.querySelector("#diagram-minimap");
 const thumbnail = minimap.querySelector("canvas");
 const stage = content.parentElement;
 const ctx = thumbnail.getContext("2d");
 let scale = 1;
 let frame = 0;
 let mapInfo;
 let geometryDirty = true;
 let drag;
 let space = false;
 let pinch;
 const limits = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));

 function refresh(remeasure = true) {
  if (remeasure) geometryDirty = true;
  if (!frame) frame = requestAnimationFrame(drawMiniature);
 }
 function measure() {
  return [content.offsetWidth, content.offsetHeight];
 }
 function sizeStage() {
  const [width,height] = measure();
  stage.style.width = `${Math.ceil(width*scale)}px`;
  stage.style.height = `${Math.ceil(height*scale)}px`;
 }
 function setZoom(wanted, x = viewport.clientWidth / 2, y = viewport.clientHeight / 2) {
  const next = limits(wanted, minimumScale, 3);
  const ratio = next / scale;
  const viewportLeft = viewport.getBoundingClientRect().left;
  const oldMargin = stage.getBoundingClientRect().left - viewportLeft + viewport.scrollLeft;
  const localX = viewport.scrollLeft + x - oldMargin;
  const top = (viewport.scrollTop + y) * ratio - y;
  content.style.transform = `scale(${next})`;
  content.dataset.zoom = String(next);
  scale = next;
  zoomOut.disabled = next <= minimumScale;
  sizeStage();
  const percent = Math.round(next * 100);
  let option = [...zoomMenu.options].find(item => !item.dataset.custom && Number(item.value) === next);
  if (!option) {
   option = zoomMenu.querySelector("[data-custom]") || new Option();
   option.dataset.custom = "true";
   option.value = String(next);
   option.textContent = `${percent}%`;
   if (!option.parentNode) zoomMenu.add(option);
  }
  zoomMenu.value = option.value;
  const margin = stage.getBoundingClientRect().left - viewportLeft + viewport.scrollLeft;
  viewport.scrollTo({left:localX * ratio + margin - x, top});
  refresh();
 }
 function reset() {
  setZoom(1, 0, 0);
  viewport.scrollTo({left:0,top:0});
 }
 function fit() {
  const [width,height] = measure();
  if (!width || !height) return;
  const ratio = Math.min(
   (viewport.clientWidth - 16) / width,
   (viewport.clientHeight - 16) / height
  );
  setZoom(Math.min(1, ratio), 0, 0);
  viewport.scrollTo({left:0,top:0});
 }
 function pointerInViewport(x, y) {
  const box = viewport.getBoundingClientRect();
  return [x - box.left, y - box.top];
 }

 zoomMenu.addEventListener("change", () => setZoom(Number(zoomMenu.value)));
 zoomOut.addEventListener("click", () => setZoom(scale / 1.25));
 section.querySelector("#diagram-plus").addEventListener("click", () => setZoom(scale * 1.25));
 section.querySelector("#diagram-fit").addEventListener("click", fit);
 viewport.addEventListener("wheel", event => {
  if (!event.ctrlKey && !event.metaKey) return;
  event.preventDefault();
  const [x,y] = pointerInViewport(event.clientX,event.clientY);
  setZoom(scale * Math.exp(limits(-event.deltaY, -150, 150) / 280), x, y);
 }, {passive:false});

 window.addEventListener("keydown", event => {
  const activeCanvas = event.target === viewport;
  const hoveredCanvas = viewport.matches(":hover") && !document.activeElement?.closest("button,input,textarea,select,a,[contenteditable]");
  if (!activeCanvas && !hoveredCanvas) return;
  if (event.code === "Space") {
   event.preventDefault();
   space = true;
   viewport.classList.add("canvas-pan-ready");
  } else if (event.key === "0") {
   event.preventDefault();
   fit();
  } else if (["+", "=", "-"].includes(event.key)) {
   event.preventDefault();
   setZoom(event.key === "-" ? scale / 1.25 : scale * 1.25);
  }
 });
 function endSpace() {
  space = false;
  viewport.classList.remove("canvas-pan-ready");
 }
 window.addEventListener("keyup", event => { if (event.code === "Space") endSpace(); });
 window.addEventListener("blur", endSpace);

 viewport.addEventListener("pointerdown", event => {
  if (event.pointerType !== "mouse") return;
  const background = !event.target.closest(".diagram-card");
  if (event.button !== 1 && !(event.button === 0 && (background || space))) return;
  event.preventDefault();
  viewport.focus({preventScroll:true});
  viewport.setPointerCapture(event.pointerId);
  drag = {id:event.pointerId, x:event.clientX, y:event.clientY, top:viewport.scrollTop, left:viewport.scrollLeft};
  viewport.classList.add("canvas-panning");
 });
 viewport.addEventListener("pointermove", event => {
  if (drag?.id !== event.pointerId) return;
  viewport.scrollTo({left:drag.left + drag.x - event.clientX,top:drag.top + drag.y - event.clientY});
 });
 viewport.addEventListener("lostpointercapture", () => {
  drag = undefined;
  viewport.classList.remove("canvas-panning");
 });
 viewport.addEventListener("auxclick", event => { if (event.button === 1) event.preventDefault(); });

 function pinchPoints(touches) {
  const [a,b] = touches;
  return {distance:Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),
   x:(a.clientX+b.clientX)/2, y:(a.clientY+b.clientY)/2};
 }
 viewport.addEventListener("touchstart", event => {
  pinch = event.touches.length === 2 ? pinchPoints(event.touches) : null;
 }, {passive:true});
 viewport.addEventListener("touchmove", event => {
  if (!pinch || !pinch.distance || event.touches.length !== 2 || !event.cancelable) return;
  event.preventDefault();
  const current = pinchPoints(event.touches);
  const [x,y] = pointerInViewport(current.x,current.y);
  setZoom(scale * current.distance / pinch.distance,x,y);
  pinch = current;
 }, {passive:false});

 function drawMiniature() {
  frame = 0;
  if (!ctx || !viewport.clientWidth) return;
  const width = thumbnail.clientWidth;
  const height = thumbnail.clientHeight;
  if (!width || !height) return;
  const dpr = window.devicePixelRatio || 1;
  if (thumbnail.width !== Math.round(width*dpr) || thumbnail.height !== Math.round(height*dpr)) {
   thumbnail.width = Math.round(width*dpr);
   thumbnail.height = Math.round(height*dpr);
   geometryDirty = true;
  }
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,width,height);
  if (geometryDirty || !mapInfo) {
   sizeStage();
   const world = stage.getBoundingClientRect();
   const view = viewport.getBoundingClientRect();
   const originX = view.left - viewport.scrollLeft;
   const originY = view.top - viewport.scrollTop;
   const worldWidth = Math.max(viewport.clientWidth, world.right - originX);
   const worldHeight = Math.max(viewport.clientHeight, world.bottom - originY);
   const ratio = Math.min((width-12)/worldWidth,(height-12)/worldHeight);
   const left = (width-worldWidth*ratio)/2;
   const top = (height-worldHeight*ratio)/2;
   const points = [];
   const cards = content.querySelectorAll(".diagram-card");
   const stride = Math.max(1,Math.ceil(cards.length/1200));
   for (let index=0;index<cards.length;index+=stride) {
    const card = cards[index];
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    points.push({
     color: card.dataset.type === "condition" ? "#ab82c2" : card.dataset.type === "branch" ? "#5baf99" : "#c9a487",
     x:left+(rect.left-originX)*ratio, y:top+(rect.top-originY)*ratio,
     width:Math.max(1,rect.width*ratio), height:Math.max(1,rect.height*ratio),
    });
   }
   mapInfo = {ratio,left,top,points};
   geometryDirty = false;
  }
  const {ratio,left,top,points} = mapInfo;
  for (const point of points) {
   ctx.fillStyle = point.color;
   ctx.fillRect(point.x,point.y,point.width,point.height);
  }
  const x = left+viewport.scrollLeft*ratio, y = top+viewport.scrollTop*ratio;
  const boxWidth = viewport.clientWidth*ratio, boxHeight = viewport.clientHeight*ratio;
  ctx.fillStyle = "#ffb88426";
  ctx.strokeStyle = "#ffb884";
  ctx.fillRect(x,y,boxWidth,boxHeight);
  ctx.strokeRect(x,y,boxWidth,boxHeight);
 }
 minimap.addEventListener("click", event => {
  if (!mapInfo || !event.detail) { fit(); return; }
  const box = thumbnail.getBoundingClientRect();
  const {ratio,left,top} = mapInfo;
  viewport.scrollTo({
   left:(event.clientX-box.left-left)/ratio-viewport.clientWidth/2,
   top:(event.clientY-box.top-top)/ratio-viewport.clientHeight/2
  });
 });
 new ResizeObserver(refresh).observe(viewport);
 new MutationObserver(refresh).observe(content, {childList:true,subtree:true,attributes:true,attributeFilter:["hidden"]});
 viewport.addEventListener("scroll",() => refresh(false),{passive:true});
 return {fit,reset,refresh};
}
