const svg = document.querySelector("#geometry-plot");
const stage = document.querySelector("#geometry-stage");
const background = svg.querySelector("#plot-background");
const marks = svg.querySelector("#plot-marks");
const labels = svg.querySelector("#plot-labels");
const tabs = [...document.querySelectorAll('.step-bar [role="tab"]')];
const tilt = document.querySelector("#view-angle");
const product = document.querySelector("#transfer-product");
const tau = Math.PI / 180;
const colors = ["#121212", "#606060"];
const steps = [
  ["Mean image features per product", "Each small mark represents one store photo. Each large mark is the mean image vector of ten photos of one variety. Circles mark Blue Diamond almonds and squares mark Ocean Spray juice."],
  ["Center each product on its brand mean", "For each brand, average its variety vectors and subtract that average from each variety. Both brand averages now lie at zero. Each arrow shows the difference between one variety and its own brand average."],
  ["Estimate the directions of greatest variation", "Each dot is a training variety after subtracting its brand average. We use singular value decomposition to find the directions along which these dots spread out most. The plane shows the first two directions. We used 64 to rank catalog descriptions."],
  ["Project a product from a new brand", "Select a Starbucks roast. The two solid lines show one photo vector and its written description projected onto the plane. The axes were learned entirely from other brands’ photos. The retrieval test applies the same projection to every candidate description."]
];
let data, centroids, centers, active = 0, yaw = 33, elevation = 29, queued = false;
let centerProgress = 0, shiftAnimation = 0;
const average = points => [0,1,2].map(axis => points.reduce((sum,p) => sum+p[axis],0)/points.length);
const centerVariant = (p, center) => p.map((v,i) => v-centerProgress*center[i]);

function add(parent, tag, attributes, text) {
  const element = document.createElementNS("http://www.w3.org/2000/svg",tag);
  for (const [name,value] of Object.entries(attributes)) element.setAttribute(name,value);
  if (text !== undefined) element.textContent = text;
  parent.append(element);
  return element;
}

function project([x,y,z], scale) {
  const a=yaw*tau, e=elevation*tau;
  const horizontal=x*Math.cos(a)+y*Math.sin(a);
  const depth=-x*Math.sin(a)+y*Math.cos(a);
  return [250+horizontal*scale,150+(depth*Math.sin(e)-z*Math.cos(e))*scale,depth*Math.cos(e)+z*Math.sin(e)];
}

function line(layer, p, q, attrs={}) {
  return add(layer,"line",{x1:p[0],y1:p[1],x2:q[0],y2:q[1],stroke:"#aaa","stroke-width":1.2,...attrs});
}

function dot(p, radius, kind, large=false) {
  const style={fill:kind===1?"white":colors[0],stroke:colors[kind],"stroke-width":large?1.9:1.1};
  if (kind===1) return add(marks,"rect",{x:p[0]-radius,y:p[1]-radius,width:radius*2,height:radius*2,...style});
  return add(marks,"circle",{cx:p[0],cy:p[1],r:radius,...style});
}

function annotate(p, text, dx, dy) {
  const x=Math.max(8,Math.min(492,p[0]+dx)), y=Math.max(15,Math.min(290,p[1]+dy));
  line(labels,p,[x,y+(dy<0?3:-9)],{stroke:"#8b8b8b","stroke-width":.9});
  add(labels,"text",{x,y,fill:"#252525",class:"geom-label","text-anchor":dx<0?"end":"start"},text);
}

function plane(extent, scale) {
  const corners=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>project([x*extent,y*extent,0],scale));
  add(background,"polygon",{points:corners.map(p=>p.slice(0,2).join(",")).join(" "),fill:"#f4f4f4",stroke:"#9f9f9f","stroke-width":1.1});
  for (let i=-3; i<=3;i++) {
    const v=i*extent/4;
    const style={stroke:i===0?"#777":"#dbdbdb","stroke-width":i===0?1.3:.7};
    line(background,project([-extent,v,0],scale),project([extent,v,0],scale),style);
    line(background,project([v,-extent,0],scale),project([v,extent,0],scale),style);
  }
}

function draw() {
  if (!data) return;
  background.replaceChildren();marks.replaceChildren();labels.replaceChildren();
  const origin=[250,150];
  if (active<=1) {
    const scale=425;
    const points=[];
    data.brands.forEach((brand, b) => {
      brand.photos.forEach((photos, i) => {
        const center=project(centerVariant(centroids[b][i],centers[b]),scale);
        if (active===0) {
          for (const p of photos) points.push({p:project(centerVariant(p,centers[b]),scale),r:2.3,b,large:false});
        } else {
          line(background,origin,center,{stroke:colors[b],"stroke-width":1.3,"stroke-dasharray":b?"4 3":"none"});
        }
        points.push({p:center,r:5.2,b,large:true});
      });
    });
    points.sort((a,b)=>Number(a.large)-Number(b.large)||a.p[2]-b.p[2]);
    for (const point of points) dot(point.p,point.r,point.b,point.large);
    if (active===0) {
      data.brands.forEach((b,i)=>annotate(project(centers[i],scale),b.name,i===0?-34:34,i===0?-29:29));
    } else {
      add(marks,"circle",{cx:250,cy:150,r:2.7,fill:"#222"});
      annotate(origin,"Brand means",15,47);
    }
  } else if (active===2) {
    const scale=410, extent=.33;
    plane(extent,scale);
    const pts=data.differences.map(p=>project(p,scale)).sort((a,b)=>a[2]-b[2]);
    for (const p of pts) add(marks,"circle",{cx:p[0],cy:p[1],r:2.1,fill:"#383838",opacity:.64});
    annotate(project([extent,0,0],scale),"Axis 1",13,-12);
    annotate(project([0,extent,0],scale),"Axis 2",12,21);
  } else {
    const held=data.heldOut[product.selectedIndex], scale=1250, extent=.112;
    plane(extent,scale);
    for (const [i,key] of ["image","text"].entries()) {
      const v=held[key],p=project(v,scale),q=project([v[0],v[1],0],scale);
      line(marks,p,q,{stroke:colors[i],"stroke-dasharray":"3 3"});
      line(marks,origin,q,{stroke:colors[i],"stroke-width":2.5});
      add(marks,"circle",{cx:p[0],cy:p[1],r:3.3,fill:"#fff",stroke:colors[i],"stroke-width":1.2});
      dot(q,4.2,i,true);
      annotate(p,key==="image"?"Photo":"Catalog text",i===0?13:-18,i===0?-16:26);
    }
    add(marks,"circle",{cx:250,cy:150,r:2.5,fill:"#111"});
  }
}

function scheduleDraw() {
  if (queued) return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;draw();});
}

function camera(y, e) {
  yaw=(y+360)%360;
  elevation=Math.max(5,Math.min(80,e));
  tilt.value=Math.round(elevation);
  const title=Math.round(elevation)+" degrees above the fitted plane";
  tilt.setAttribute("aria-valuetext",title);
  document.querySelector("#angle-value").textContent=Math.round(elevation)+"°";
  scheduleDraw();
}

function showStep(index, focusTab=false) {
  const previous=active,start=centerProgress,target=index===0?0:1;
  active=index;
  cancelAnimationFrame(shiftAnimation);
  tabs.forEach((t,i)=>{t.setAttribute("aria-selected",String(i===index));t.tabIndex=i===index?0:-1;});
  if(focusTab) tabs[index].focus();
  stage.setAttribute("aria-labelledby",tabs[index].id);
  document.querySelector("#step-title").textContent=steps[index][0];
  document.querySelector("#step-body").textContent=steps[index][1];
  svg.querySelector("title").textContent=steps[index][0];
  svg.querySelector("desc").textContent=steps[index][1];
  document.querySelector("#step-count").textContent=(index+1)+" of 4";
  document.querySelector("#step-back").disabled=index===0;
  document.querySelector("#step-next").disabled=index===3;
  document.querySelector(".held-out-choice").hidden=index!==3;
  if(previous<=1 && index<=1 && start!==target && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const began=performance.now();
    function shift(now) {
      const t=Math.min(1,(now-began)/420);
      centerProgress=start+(target-start)*(t*t*(3-2*t));
      draw();
      if(t<1) shiftAnimation=requestAnimationFrame(shift);
    }
    shiftAnimation=requestAnimationFrame(shift);
  } else {
    centerProgress=target;
    scheduleDraw();
  }
}

tabs.forEach((tab,i)=>{
  tab.addEventListener("click",()=>showStep(i));
  tab.addEventListener("keydown",event=>{
    const keys={ArrowLeft:(i+3)%4,ArrowRight:(i+1)%4,Home:0,End:3};
    if(!Object.hasOwn(keys,event.key))return;
    event.preventDefault();
    showStep(keys[event.key],true);
  });
});
document.querySelector("#step-back").addEventListener("click",()=>showStep(Math.max(0,active-1)));
document.querySelector("#step-next").addEventListener("click",()=>showStep(Math.min(3,active+1)));
document.querySelector("#reset-view").addEventListener("click",()=>camera(33,29));
tilt.addEventListener("input",()=>camera(yaw,Number(tilt.value)));
product.addEventListener("change",scheduleDraw);

let drag;
svg.addEventListener("pointerdown",event=>{
  if(!event.isPrimary || event.button!==0)return;
  svg.setPointerCapture(event.pointerId);
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,yaw,elevation};
  svg.classList.add("dragging");
});
svg.addEventListener("pointermove",event=>{
  if(!drag || drag.id!==event.pointerId)return;
  camera(drag.yaw+(event.clientX-drag.x)*.48,drag.elevation-(event.clientY-drag.y)*.36);
});
function endDrag(){drag=undefined;svg.classList.remove("dragging");}
svg.addEventListener("lostpointercapture",endDrag);
svg.addEventListener("pointercancel",endDrag);
svg.addEventListener("keydown",event=>{
  const views={ArrowLeft:[yaw-8,elevation],ArrowRight:[yaw+8,elevation],ArrowUp:[yaw,elevation+5],ArrowDown:[yaw,elevation-5],Home:[33,29]};
  if(!Object.hasOwn(views,event.key))return;
  event.preventDefault();
  camera(...views[event.key]);
});

showStep(0);
try {
  const response=await fetch("assets/subspace-view.json");
  if(!response.ok)throw Error();
  data=await response.json();
  centroids=data.brands.map(brand=>brand.photos.map(average));
  centers=centroids.map(average);
  draw();
} catch {
  add(labels,"text",{x:250,y:147,"text-anchor":"middle",fill:"#222"},"Reload to see the embedding plot.");
}
