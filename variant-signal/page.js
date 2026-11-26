"use strict";

const select = (selector, root = document) => root.querySelector(selector);
const selectAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));
const svgNS = "http://www.w3.org/2000/svg";

function svgElement(parent, tag, attributes, label) {
  const node = document.createElementNS(svgNS, tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  if (label !== undefined) node.textContent = label;
  parent.append(node);
  return node;
}

const steps = [
  ["One point per variant", "Each small dot is a photo from a seen brand. Average the normalized image features for a single variant, such as one flavor of soup. Its photos now have one center.", "Two brands each have three clusters of photos. A larger marker gives each variant’s mean."],
  ["Remove the brand mean", "For each brand, average its variant centers. Subtract that mean from every center in the brand. Both brands now sit at the same origin. The arrows show the differences that remain.", "The brand means move to a shared origin. Each arrow runs from that origin to a centered variant mean."],
  ["Keep the shared directions", "Stack the centered differences and take their singular value decomposition. The leading axes capture the directions along which variants differ most. This drawing keeps two. The main experiment keeps 64.", "The centered variant markers lie on an illustrated plane. Its two axes represent the leading singular directions."],
  ["Use the axes on a new brand", "Freeze the axes. Project a held-out photo and each catalog description directly onto them. Normalize both projections and rank the descriptions by cosine. The closer directions give the higher score.", "A new photo and two texts project onto the same plane. The photo’s projected direction is closer to text A than to text B."]
];

function geometry() {
  const tabs = selectAll('.step-bar [role="tab"]');
  const points = select("#geom-points");
  const plane = select("#geom-plane");
  const overlay = select("#geom-overlay");
  const origin = [235, 132];
  const brandOffsets = [[-90, -34], [88, 32]];
  const colors = ["#962c37", "#365956"];
  const variants = [[[-1.3,-.30],[0,.60],[1.3,-.30]], [[-.85,.42],[0,-.84],[.85,.42]]];
  const cloud = [[-8,-4],[-4,6],[5,-6],[7,4]];
  let elevation = 28 * Math.PI / 180;
  // Orthographic view of the learned plane. The third coordinate is normal to it.
  const screen = ([a,b,height = 0]) => [
    origin[0] + a * 43 + b * 30,
    origin[1] + (-a * 30 + b * 43) * Math.sin(elevation) - height * Math.cos(elevation)
  ];
  const move = (p, offset) => [p[0] + offset[0], p[1] + offset[1]];
  const segment = (group, start, end, opts = {}) => svgElement(group, "line", {
    x1:start[0], y1:start[1], x2:end[0], y2:end[1], stroke:"#aaa696", "stroke-width":1.2, ...opts
  });
  const label = (at, name, color="#48493f", anchor="start") => svgElement(overlay, "text", {
    x:at[0], y:at[1], fill:color, class:"geom-label", "text-anchor":anchor
  }, name);
  const marker = (group, at, color, shape, radius) => shape === 0
    ? svgElement(group, "circle", {cx:at[0],cy:at[1],r:radius,fill:color,stroke:"#f8f7f2","stroke-width":1.25})
    : svgElement(group, "rect", {x:at[0]-radius,y:at[1]-radius,width:2*radius,height:2*radius,fill:color,stroke:"#f8f7f2","stroke-width":1.25});
  const groups = [];
  variants.forEach((brand, b) => brand.forEach((vector) => {
    const group = svgElement(points, "g", {class:"geom-image"});
    const photos = svgElement(group, "g", {opacity:.65});
    cloud.forEach((offset) => marker(photos, offset, colors[b], b, 2.8));
    marker(group, [0,0], colors[b], b, 4.4);
    groups.push({group, photos, vector, brand:b});
  }));

  let current = 0;
  function render(which, focus = false) {
    current = which;
    const camera = select("#view-angle");
    const degrees = which < 2 ? 28 : Number(camera.value);
    elevation = degrees * Math.PI / 180;
    select("#camera-control").hidden = which < 2;
    select("#angle-value").textContent = degrees + "°";
    camera.setAttribute("aria-valuetext", degrees + " degrees above the plane");
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === which));
      tab.tabIndex = i === which ? 0 : -1;
    });
    if (focus) tabs[which].focus();
    select("#geometry-stage").setAttribute("aria-labelledby", tabs[which].id);
    select("#step-title").textContent = steps[which][0];
    select("#step-body").textContent = steps[which][1];
    select("#plot-title").textContent = steps[which][0];
    select("#plot-description").textContent = steps[which][2];
    select("#step-count").textContent = (which + 1) + " of 4";
    select("#step-back").disabled = which === 0;
    select("#step-next").disabled = which === 3;
    plane.replaceChildren();
    overlay.replaceChildren();

    if (which >= 2) {
      const corners = [[-2.25,-1.65],[2.25,-1.65],[2.25,1.65],[-2.25,1.65]].map(screen);
      const polygon = corners.map(p => p.join(",")).join(" ");
      svgElement(plane, "polygon", {points:polygon,fill:"#efe4da",stroke:"#b49b8d","stroke-width":1.3});
      svgElement(plane, "polygon", {points:polygon,fill:"url(#plane-hatch)",opacity:.26});
      segment(plane, screen([-2.65,0]), screen([2.65,0]), {stroke:"#7a4a45","stroke-width":1.6});
      segment(plane, screen([0,-1.95]), screen([0,1.95]), {stroke:"#7a4a45","stroke-width":1.6});
      if (which === 2) {
        label(move(screen([2.7,0]),[2,3]), "Axis 1");
        label(move(screen([0,2.05]),[3,12]), "Axis 2");
      }
    }
    for (const item of groups) {
      const end = screen(item.vector);
      const center = which === 0 ? move(end,brandOffsets[item.brand]) : end;
      item.group.style.transform = "translate(" + center[0] + "px," + center[1] + "px)";
      item.group.style.opacity = which === 3 ? 0 : 1;
      item.photos.setAttribute("opacity", which === 0 ? ".7" : "0");
      if (which === 1 || which === 2) segment(plane,origin,end,{stroke:colors[item.brand],"stroke-width":1.4,opacity:which === 1 ? .86 : .5});
    }
    if (which === 0) {
      label([83,62],"Brand A",colors[0]);
      label([319,202],"Brand B",colors[1]);
    } else if (which === 1) {
      for (const offset of brandOffsets) {
        const before = move(origin,offset);
        segment(plane,before,origin,{"stroke-dasharray":"3 4"});
        svgElement(plane,"circle",{cx:before[0],cy:before[1],r:3.5,stroke:"#8a897f",fill:"none"});
      }
      marker(overlay,origin,"#2d2e28",0,3.5);
      label([220,186],"Shared origin","#44463c","middle");
      segment(overlay,[220,169],move(origin,[-2,5]),{stroke:"#8a897f"});
    } else if (which === 3) {
      const projections = [
        {name:"Photo",v:[1.15,.56],height:52,color:"#962c37",offset:[4,-9],anchor:"start"},
        {name:"Text A",v:[1.75,.80],height:27,color:"#365956",offset:[9,2],anchor:"start"},
        {name:"Text B",v:[-.75,.92],height:41,color:"#52544b",offset:[-9,-2],anchor:"end"}
      ];
      for (const item of projections) {
        const p = screen(item.v), above = screen([...item.v,item.height]);
        segment(overlay,above,p,{stroke:item.color,"stroke-dasharray":"3 3"});
        segment(overlay,origin,p,{stroke:item.color,"stroke-width":2});
        svgElement(overlay,"circle",{cx:above[0],cy:above[1],r:4.3,stroke:item.color,fill:"#f8f7f2","stroke-width":1.8});
        marker(overlay,p,item.color,0,4.3);
        label(move(above,item.offset), item.name,item.color,item.anchor);
      }
      label([122,205],"Fixed subspace","#745b51");
    }
  }
  tabs.forEach((tab,i) => {
    tab.addEventListener("click", () => render(i));
    tab.addEventListener("keydown", event => {
      const keys = {ArrowLeft:(i+3)%4, ArrowRight:(i+1)%4, Home:0, End:3};
      if (!Object.hasOwn(keys,event.key)) return;
      event.preventDefault();
      render(keys[event.key], true);
    });
  });
  select("#step-back").addEventListener("click", () => render(Math.max(current-1,0)));
  select("#step-next").addEventListener("click", () => render(Math.min(current+1,3)));
  select("#view-angle").addEventListener("input", () => render(current));
  render(0);
}

async function checkedResponse(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load " + url);
  return response;
}

function photoDirection(data, offsets, rank) {
  const direction = new Float64Array(rank);
  for (const offset of offsets) {
    const projected = data.subarray(offset, offset + rank);
    const norm = Math.hypot(...projected);
    for (let axis = 0; axis < rank; axis++) direction[axis] += projected[axis] / norm;
  }
  const length = Math.hypot(...direction);
  return direction.map(value => value / length);
}

function cosine(query, data, description) {
  let dot = 0, textNorm = 0;
  for (let axis=0; axis<query.length; axis++) {
    const y = data[description+axis];
    dot += query[axis]*y;
    textNorm += y*y;
  }
  return dot / Math.sqrt(textNorm);
}

async function retrieval() {
  const form = select("#retrieval-demo");
  const controls = selectAll("button,select,input", form);
  controls.forEach(control => { control.disabled = true; });
  try {
    const [catalog, bytes] = await Promise.all([
      checkedResponse("demo/catalog.json").then(response => response.json()),
      checkedResponse("demo/coordinates.f32").then(response => response.arrayBuffer())
    ]);
    const {photos, products, variants, maxRank} = catalog;
    const size = photos.length + products.length;
    const coordinates = new Float32Array(bytes);
    if (coordinates.length !== 2 * size * maxRank) throw new Error("Unexpected projection dimensions");
    const variantNames = new Map(variants.map(v => [v.catalogIndex,v.name]));
    const examples = variants.map(v => photos.map((photo,i) => photo.catalogIndex === v.catalogIndex ? i : -1).filter(i => i>=0));
    const allProducts = products.map((_,i) => i);
    const withinBrand = variants.map(v => v.catalogIndex);
    let frame = 0, contactVariant = -1;

    function render() {
      const variantIndex = select("#demo-variant").selectedIndex;
      const variant = variants[variantIndex], frames = examples[variantIndex];
      const index = frames[frame], photo = photos[index];
      const rank = Number(select("#demo-rank").value);
      const fit = Number(select('input[name="fit"]:checked').value);
      const candidates = select("#demo-gallery").value === "brand" ? withinBrand : allProducts;
      const start = fit * size * maxRank;
      const average = select("#average-photos").checked;
      const queryFrames = average ? frames : [index];
      const query = photoDirection(coordinates, queryFrames.map(i => start+i*maxRank), rank);
      const scores = candidates.map(id => ({
        id, score:cosine(query, coordinates, start + (photos.length + id) * maxRank)
      })).sort((a,b) => b.score-a.score || a.id-b.id);
      const position = scores.findIndex(row => row.id === variant.catalogIndex)+1;
      const contact = select("#contact-sheet"), image = select("#query-photo");
      image.hidden = average;
      contact.hidden = !average;
      if (average && contactVariant !== variantIndex) {
        contact.replaceChildren(...frames.map((photoIndex, i) => {
          const thumb = document.createElement("img");
          thumb.src = "assets/photos/" + photos[photoIndex].file;
          thumb.alt = variant.name + ", store photo " + (i+1);
          return thumb;
        }));
        contactVariant = variantIndex;
      }
      image.src = "assets/photos/" + photo.file;
      image.alt = "Store photo " + (frame+1) + " of Starbucks " + variant.name + " from GroceryVision.";
      select("#photo-back").disabled = select("#photo-next").disabled = average;
      select("#photo-count").textContent = average ? "Mean of all 10 photos" : "Photo " + (frame+1) + " of " + frames.length;
      select("#catalog-key").textContent = scores.length > 3 ? "Top 3 catalog matches" : "Catalog match";
      select("#rank-summary").textContent = variant.name + " ranks " + position + " of " + scores.length + (average ? " for the mean photo embedding." : " for this photo.");
      select("#top-wording").textContent = products[scores[0].id].description;
      const entries = scores.slice(0,3).map(row => {
        const item = document.createElement("li");
        if (row.id === variant.catalogIndex) item.className = "actual";
        const label = document.createElement("span"), score = document.createElement("span");
        label.textContent = variantNames.get(row.id) || products[row.id].description;
        score.className = "score";
        score.textContent = row.score.toFixed(4);
        item.append(label,score);
        return item;
      });
      select("#ranked-list").replaceChildren(...entries);
    }
    select("#demo-variant").addEventListener("change", () => { frame=0; render(); });
    selectAll('#demo-gallery,#demo-rank,#average-photos,input[name="fit"]',form).forEach(control => control.addEventListener("change", render));
    function changeFrame(delta) {
      const length = examples[select("#demo-variant").selectedIndex].length;
      frame = (frame + delta + length) % length;
      render();
    }
    select("#photo-back").addEventListener("click", () => changeFrame(-1));
    select("#photo-next").addEventListener("click", () => changeFrame(1));
    controls.forEach(control => { control.disabled = false; });
    render();
  } catch {
    select("#rank-summary").textContent = "The saved result for the first Sumatra photo is shown. Reload to use the interactive catalog.";
  }
}

async function rankSweep() {
  const controls = selectAll('.sweep-controls input,.sweep-controls select');
  try {
    const results = await checkedResponse("demo/rank-results.json").then(response => response.json());
    function render() {
      const model = select("#sweep-model").value;
      const rank = select('input[name="sweep-rank"]:checked').value;
      const values = results.ranks[model][rank];
      selectAll(".sweep-table .measure").forEach((cell,i) => {
        select("i",cell).style.setProperty("--value", values[i]+"%");
        select("span",cell).textContent = values[i].toFixed(1)+"%";
      });
      const margin = (values[0]-values[1]).toFixed(1);
      let note = "At rank "+rank+", true labels gain "+margin+" percentage points over shuffled labels on "+model+".";
      if (rank === "64") note += " Restricting the catalog to each photo’s own brand reduces that gain to "+results.margins[model]["Own brand"].toFixed(1)+" points.";
      select("#sweep-summary").textContent = note;
    }
    controls.forEach(el => el.addEventListener("change",render));
    render();
  } catch {
    controls.forEach(el => { el.disabled = true; });
    select("#sweep-summary").textContent += " The saved rank-64 results are shown.";
  }
}

function citation() {
  const button = select("#copy-citation");
  if (!navigator.clipboard || !window.isSecureContext) return;
  button.hidden = false;
  button.addEventListener("click",async () => {
    try {
      await navigator.clipboard.writeText(select("#bibtex").textContent);
      select("#copy-status").textContent = "BibTeX copied.";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(select("#bibtex"));
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      select("#copy-status").textContent = "The citation is selected. Use your device’s Copy command.";
    }
  });
}

geometry();
retrieval();
rankSweep();
citation();
