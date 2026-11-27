"use strict";

const select = (selector, root = document) => root.querySelector(selector);
const selectAll = (selector, root = document) => Array.from(root.querySelectorAll(selector));
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

function checkoutPipeline() {
  const labels = {
    camera: "The store camera supplies the query. This frame includes a hand, the shelf and a tub of Creamy Tomato soup.",
    catalog: "The study ranks one description per product. The two soup names are abbreviated here. Size, flavor and packaging can distinguish entries from the same brand.",
    image: "SigLIP2 encodes the entire image into one vector. The probe in the paper tests which variant that vector identifies on its own.",
    text: "The text tower encodes each catalog description once. Every photo is compared with the same set of 409 text vectors.",
    score: "Each image and text vector has unit length. Their dot product gives the cosine score used to rank the catalog.",
    match: "Chicken Noodle ranks first for this Creamy Tomato photo. A checkout system that accepted this match would add the wrong soup to the basket."
  };
  const buttons = selectAll("[data-pipe]");
  for (const button of buttons) {
    button.addEventListener("click", () => {
      for (const node of buttons) node.setAttribute("aria-pressed", String(node === button));
      select("#pipe-detail").textContent = labels[button.dataset.pipe];
    });
  }
}

function filmChapters() {
  const film = select("#explainer"), picker = select("#film-chapter");
  const times = [...picker.options].map(option => Number(option.value));
  let pending;
  const seek = () => {
    if (pending === undefined) return;
    film.currentTime = pending;
    pending = undefined;
  };
  picker.addEventListener("change", () => {
    pending = Number(picker.value);
    if (film.readyState >= 1) seek();
    else film.load();
  });
  film.addEventListener("loadedmetadata", seek);
  film.addEventListener("timeupdate", () => {
    if (pending !== undefined) return;
    const next = times.findIndex(time => time > film.currentTime);
    picker.selectedIndex = next === -1 ? times.length-1 : Math.max(0, next-1);
  });
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

checkoutPipeline();
filmChapters();
retrieval();
rankSweep();
citation();
