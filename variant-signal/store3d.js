// The simulated pickup and the recorded GroceryVision retrieval example are distinct views.
const products = [
  {
    key: "tomato",
    title: "Creamy Tomato",
    brand: "Campbell’s",
    x: -1.14,
    photo: "campbells_creamy_tomato.jpg",
    truth: "Campbell’s Creamy Tomato",
    matches: [["Campbell’s Chicken Noodle"], ["Campbell’s Creamy Tomato"]],
    explanation:
      "The first catalog entry has the right brand and the wrong soup. The photographed flavor ranks second in Figure 1.",
    source: "Figure 1 of the paper reports this frozen SigLIP2 ranking.",
  },
  {
    key: "sumatra",
    title: "Sumatra",
    brand: "Starbucks",
    x: 0.18,
    photo: "photos/762111622914_18.webp",
    truth: "Starbucks Sumatra",
    matches: [
      ["Starbucks Sumatra", 0.1586],
      ["Starbucks Breakfast Blend", 0.1025],
      ["Starbucks Pike Place", 0.0915],
    ],
    explanation:
      "For this photo, frozen SigLIP2 retrieves the correct coffee from the 409 catalog descriptions.",
    source:
      "Cosines use the original frozen SigLIP2-gopt-384 image and text features for this GroceryVision frame.",
  },
  {
    key: "breakfast",
    title: "Breakfast Blend",
    brand: "Starbucks",
    x: 1.02,
    photo: "photos/762111206244_45.webp",
    truth: "Starbucks Breakfast Blend",
    matches: [
      ["Starbucks Breakfast Blend", 0.1787],
      ["Starbucks Pike Place", 0.1175],
      ["Starbucks Sumatra", 0.1062],
    ],
    explanation:
      "The photographed blend ranks first. The next two descriptions belong to other coffees from the same brand.",
    source:
      "Cosines use the original frozen SigLIP2-gopt-384 image and text features for this GroceryVision frame.",
  },
];
const asset = (path) => new URL("./assets/" + path, import.meta.url).href;

async function install(root) {
  root.innerHTML = `
    <div class="vs3d-stage"><img class="vs3d-poster" width="1140" height="530" alt="A rendered grocery aisle with a shopper, shelves of soup and coffee, and an overhead camera."></div>
    <div class="vs3d-controls">
      <label>Product<select class="vs3d-product"></select></label>
      <label>View<select class="vs3d-view"><option value="aisle">Store aisle</option><option value="shelf">Product shelf</option><option value="camera">Shelf camera</option></select></label>
      <button type="button" class="vs3d-capture">Pick up and photograph</button>
    </div>
    <p class="vs3d-help">Choose a product on the shelf or in the menu. Drag to look around. With the aisle focused, use the arrow keys to turn or zoom and Enter to photograph the pickup.</p>
    <p class="vs3d-status" role="status"></p>
    <div class="vs3d-record" hidden>
      <figure><img class="vs3d-query" alt=""><figcaption></figcaption></figure>
      <div><h3>Frozen model’s catalog ranking</h3><p class="vs3d-finding"></p><table><thead></thead><tbody></tbody></table><details class="vs3d-inspection"><summary>About this ranking</summary><p></p></details></div>
    </div>`;
  const get = (selector) => root.querySelector(selector);
  const stage = get(".vs3d-stage"),
    poster = get(".vs3d-poster"),
    product = get(".vs3d-product");
  const view = get(".vs3d-view"),
    capture = get(".vs3d-capture"),
    status = get(".vs3d-status");
  const record = get(".vs3d-record");
  poster.src = asset("store-3d/aisle.webp");
  products.forEach((item, i) =>
    product.add(new Option(item.brand + " " + item.title, String(i))),
  );
  let display,
    current = 0,
    busy = false,
    revealed = false,
    waitingForScene = true;

  function showRecord() {
    const entry = products[current];
    busy = false;
    revealed = true;
    capture.disabled = false;
    view.disabled = !display;
    capture.textContent = display ? "Replay pickup" : "Show recorded match";
    status.textContent = "Recorded match for " + entry.truth + ".";
    get(".vs3d-query").src = asset(entry.photo);
    get(".vs3d-query").alt = "GroceryVision photograph of " + entry.truth;
    get("figcaption").textContent =
      "The aisle simulates pickup. This GroceryVision photo of " +
      entry.truth +
      " is the query.";
    get(".vs3d-finding").textContent = entry.explanation;
    get(".vs3d-inspection p").textContent = entry.source;
    get("details").open = false;
    const hasScore = entry.matches[0].length > 1,
      head = document.createElement("tr");
    function cell(row, kind, value, style) {
      const element = document.createElement(kind);
      element.textContent = value;
      if (style) element.className = style;
      if (kind === "th") element.scope = "col";
      row.append(element);
    }
    cell(head, "th", "Rank");
    cell(head, "th", "Catalog entry", "vs3d-row-label");
    if (hasScore) cell(head, "th", "Cosine ↑");
    get("thead").replaceChildren(head);
    get("tbody").replaceChildren(
      ...entry.matches.map((match, i) => {
        const row = document.createElement("tr");
        cell(row, "td", String(i + 1));
        cell(row, "td", match[0], "vs3d-row-label");
        if (hasScore) cell(row, "td", match[1].toFixed(4));
        return row;
      }),
    );
    record.hidden = false;
  }
  function photograph() {
    if (busy) return;
    if (!display) {
      showRecord();
      return;
    }
    busy = true;
    capture.disabled = true;
    view.disabled = true;
    capture.textContent = "Photographing…";
    status.textContent = "";
    record.hidden = true;
    display.pickup(() => {
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        stage.classList.remove("flash");
        void stage.offsetWidth;
        stage.classList.add("flash");
      }
      view.value = "camera";
      showRecord();
    });
  }
  function choose(index, fromShelf = false) {
    current = index;
    product.value = String(index);
    busy = false;
    revealed = false;
    view.disabled = !display && !waitingForScene;
    capture.disabled = false;
    capture.textContent =
      display || waitingForScene
        ? "Pick up and photograph"
        : "Show recorded match";
    record.hidden = true;
    status.textContent = fromShelf ? products[index].truth + " selected." : "";
    display?.select(index, view.value);
  }
  function unavailable() {
    waitingForScene = false;
    view.disabled = true;
    const canvas = stage.querySelector("canvas");
    if (canvas) canvas.hidden = true;
    poster.hidden = false;
    get(".vs3d-help").textContent =
      "Choose a product to inspect its GroceryVision photograph and catalog ranking.";
    display = null;
    capture.disabled = false;
    busy = false;
    capture.textContent = "Show recorded match";
  }
  capture.addEventListener("click", photograph);
  product.addEventListener("change", () => choose(Number(product.value)));
  view.addEventListener("change", () => display?.setView(view.value));
  async function start() {
    try {
      const [T, shop] = await Promise.all([
        import("../shelftaught/three-r180/three.module.min.js"),
        import("../shelftaught/shoppers.js"),
      ]);
      display = buildScene(T, shop.makeShopper, stage, {
        onSelect: (i) => choose(i, true),
        onCapture: photograph,
        onFallback: unavailable,
      });
      display.select(current, view.value);
      poster.hidden = true;
      waitingForScene = false;
      if (revealed) capture.textContent = "Replay pickup";
    } catch {
      unavailable();
    }
  }
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          start();
        }
      },
      { rootMargin: "240px 0px" },
    );
    observer.observe(root);
  } else start();
}

function buildScene(T, makeShopper, stage, hooks) {
  const canvas = document.createElement("canvas");
  const settings = {
    antialias: true,
    alpha: false,
    powerPreference: "low-power",
  };
  const context = canvas.getContext("webgl2", settings);
  if (!context) throw new Error("3D graphics are unavailable");
  const renderer = new T.WebGLRenderer({ canvas, context, ...settings });
  canvas.tabIndex = 0;
  canvas.setAttribute(
    "aria-label",
    "Interactive grocery aisle. Left and right rotate, up and down zoom, Enter photographs the selected product, and Home resets the current view.",
  );
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  stage.append(canvas);
  const scene = new T.Scene();
  scene.background = new T.Color("#eeeae2");
  scene.fog = new T.Fog("#ebe8df", 8, 19);
  const camera = new T.PerspectiveCamera(40, 1, 0.04, 35);
  const v = (x, y, z) => new T.Vector3(x, y, z);
  const solid = new T.Group();
  scene.add(solid);
  const boxGeo = new T.BoxGeometry(1, 1, 1);
  const cylGeo = new T.CylinderGeometry(1, 1, 1, 24);
  const sphereGeo = new T.SphereGeometry(1, 16, 12);
  const planeGeo = new T.PlaneGeometry(1, 1);
  const tone = (color, options = {}) =>
    new T.MeshStandardMaterial({ color, roughness: 0.75, ...options });
  const paper = tone("#fffbec"),
    white = tone("#f6f4eb"),
    steel = tone("#505550", { roughness: 0.42, metalness: 0.4 });
  const alu = tone("#a8aaa0", { roughness: 0.44, metalness: 0.54 }),
    dark = tone("#26332c"),
    oak = tone("#b99168");
  const brass = tone("#b4a067", { roughness: 0.49, metalness: 0.38 }),
    glass = tone("#95aaa2", { roughness: 0.3 });
  function mesh(parent, geo, mat, x, y, z, sx = 1, sy = 1, sz = 1) {
    const o = new T.Mesh(geo, mat);
    o.position.set(x, y, z);
    o.scale.set(sx, sy, sz);
    o.castShadow = o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  const block = (parent, mat, x, y, z, w, h, d) =>
    mesh(parent, boxGeo, mat, x, y, z, w, h, d);
  const cylinder = (parent, mat, x, y, z, r, h) =>
    mesh(parent, cylGeo, mat, x, y, z, r, h, r);
  function rod(parent, mat, a, b, r) {
    const delta = b.clone().sub(a);
    const o = cylinder(
      parent,
      mat,
      (a.x + b.x) / 2,
      (a.y + b.y) / 2,
      (a.z + b.z) / 2,
      r,
      delta.length(),
    );
    o.quaternion.setFromUnitVectors(v(0, 1, 0), delta.normalize());
    return o;
  }
  function texture(w, h, paint) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const ctx = c.getContext("2d");
    paint(ctx, w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return t;
  }
  function plane(parent, mat, x, y, z, w, h) {
    const m = mesh(parent, planeGeo, mat, x, y, z, w, h, 1);
    m.castShadow = false;
    return m;
  }
  function graphic(w, h, paint) {
    return tone("#ffffff", { map: texture(w, h, paint), roughness: 0.9 });
  }
  const labelCache = new Map();
  function sign(text, bg, ink, width = 768, height = 112) {
    const key = [text, bg, ink, width, height].join("|");
    if (labelCache.has(key)) return labelCache.get(key);
    const m = graphic(width, height, (c, w, h) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, w, h);
      c.fillStyle = ink;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.font = "600 " + Math.floor(h * 0.61) + "px Arial, sans-serif";
      c.fillText(text, w / 2, h * 0.51, w * 0.92);
    });
    labelCache.set(key, m);
    return m;
  }
  let seed = 539;
  const random = () =>
    (seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296;
  const floorTex = texture(512, 512, (c, w, h) => {
    c.fillStyle = "#d6d1c5";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 11400; i++) {
      const n = 125 + Math.floor(random() * 104);
      c.fillStyle =
        "rgba(" +
        n +
        "," +
        (n - 2) +
        "," +
        (n - 5) +
        "," +
        (0.09 + random() * 0.24) +
        ")";
      c.fillRect(
        random() * w,
        random() * h,
        1 + 2 * random(),
        1 + 2 * random(),
      );
    }
    c.strokeStyle = "#b9b5aa";
    c.lineWidth = 2;
    c.strokeRect(0, 0, w, h);
  });
  floorTex.wrapS = floorTex.wrapT = T.RepeatWrapping;
  floorTex.repeat.set(13, 13);
  const floor = plane(
    solid,
    tone("#ffffff", { map: floorTex }),
    0,
    0.002,
    0,
    10,
    10,
  );
  floor.rotation.x = -Math.PI / 2;
  block(solid, tone("#e1dcd0"), 0, -0.075, 0, 10, 0.15, 10);
  block(solid, tone("#ede9df"), 0, 1.6, -1.59, 8, 3.2, 0.12);
  block(solid, steel, 0, 0.07, -1.5, 8, 0.13, 0.05);
  const green = tone("#617d6e"),
    greenDeep = tone("#335245");
  block(solid, white, -0.15, 2.23, -1.43, 6.6, 0.08, 0.13);
  block(solid, oak, -0.15, 2.18, -1.46, 6.6, 0.045, 0.13);

  const backBoard = graphic(512, 256, (c, w, h) => {
    c.fillStyle = "#dddcd1";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#b8b7ac";
    for (let yy = 6; yy < h; yy += 12)
      for (let xx = 5; xx < w; xx += 12) {
        c.beginPath();
        c.arc(xx, yy, 0.95, 0, Math.PI * 2);
        c.fill();
      }
  });
  const shelfLeft = -2.04,
    shelfRight = 1.51;
  block(
    solid,
    backBoard,
    (shelfLeft + shelfRight) / 2,
    1.02,
    -1.37,
    shelfRight - shelfLeft,
    1.84,
    0.045,
  );
  for (const px of [shelfLeft, -0.76, 0.64, shelfRight]) {
    block(solid, alu, px, 1.025, -1.305, 0.035, 1.99, 0.05);
    for (let j = 0; j < 11; j++)
      block(solid, steel, px, 0.23 + 0.155 * j, -1.273, 0.014, 0.03, 0.005);
  }
  const levels = [0.202, 0.608, 1.026, 1.455];
  for (const y of levels) {
    block(solid, white, -0.265, y, -1.03, 3.64, 0.049, 0.68);
    block(solid, steel, -0.265, y - 0.036, -0.7, 3.65, 0.039, 0.034);
    block(solid, white, -0.265, y - 0.029, -0.681, 3.64, 0.044, 0.006);
    for (const px of [shelfLeft + 0.1, -0.68, 0.62, 1.42]) {
      const brace = block(solid, alu, px, y - 0.096, -1.17, 0.028, 0.03, 0.32);
      brace.rotation.x = -0.26;
    }
  }
  block(solid, oak, -0.265, 0.081, -1.09, 3.72, 0.16, 0.62);
  for (const sx of [shelfLeft - 0.025, shelfRight + 0.025])
    block(solid, oak, sx, 1.035, -1.04, 0.05, 1.98, 0.71);
  block(solid, greenDeep, -0.265, 1.928, -1.305, 3.65, 0.27, 0.065);
  plane(
    solid,
    sign("Soup", "#29483c", "#fbf6e9"),
    -1.36,
    1.93,
    -1.268,
    0.69,
    0.16,
  );
  plane(
    solid,
    sign("Coffee", "#29483c", "#fbf6e9"),
    0.59,
    1.93,
    -1.268,
    0.8,
    0.16,
  );
  for (const x of [-0.68, 1.38])
    block(solid, brass, x, 1.936, -1.262, 0.012, 0.15, 0.009);

  // A glazed shopfront and a second gondola put the working bay in an aisle.
  const windowFrame = tone("#72796b"),
    outdoor = tone("#d1dddd"),
    leaf = tone("#839e78");
  block(solid, white, -2.78, 0.47, -1.42, 1.31, 0.94, 0.15);
  block(solid, outdoor, -2.78, 1.72, -1.5, 1.33, 1.65, 0.04);
  for (const py of [1.31, 1.43, 1.59, 1.5, 1.39]) {
    const x = -3.36 + random() * 1.16;
    mesh(solid, sphereGeo, leaf, x, py, -1.455, 0.23, 0.19, 0.025);
  }
  for (const x of [-3.47, -2.84, -2.13])
    block(solid, windowFrame, x, 1.76, -1.4, 0.038, 1.75, 0.08);
  for (const y of [0.93, 1.79, 2.61])
    block(solid, windowFrame, -2.8, y, -1.4, 1.38, 0.037, 0.08);
  block(solid, oak, -2.8, 0.92, -1.32, 1.41, 0.05, 0.22);

  // Printed label art repeats around tins. Each coffee sack has shoulder folds and a crimp.
  const designs = {
    tomato: {
      kind: "cup",
      brand: "Campbell’s",
      name: "Creamy Tomato",
      top: "#a91f27",
      bottom: "#f1e1b5",
      accent: "#ce592d",
    },
    noodle: {
      kind: "tin",
      brand: "Campbell’s",
      name: "Chicken Noodle",
      top: "#ae2528",
      bottom: "#f4e3ac",
      accent: "#d1a347",
    },
    sumatra: {
      kind: "bag",
      brand: "STARBUCKS",
      name: "SUMATRA",
      top: "#27372d",
      bottom: "#f3f0df",
      accent: "#b99a58",
    },
    breakfast: {
      kind: "bag",
      brand: "STARBUCKS",
      name: "BREAKFAST BLEND",
      top: "#c8773e",
      bottom: "#f4f0df",
      accent: "#f0d783",
    },
    pike: {
      kind: "bag",
      brand: "STARBUCKS",
      name: "PIKE PLACE",
      top: "#785237",
      bottom: "#f4eedc",
      accent: "#dbc780",
    },
    chickpea: {
      kind: "tin",
      brand: "PANTRY",
      name: "Chickpeas",
      top: "#637c6a",
      bottom: "#efe5c7",
      accent: "#bfa269",
    },
    corn: {
      kind: "tin",
      brand: "PANTRY",
      name: "Sweet Corn",
      top: "#c1a549",
      bottom: "#f1e8c5",
      accent: "#84a062",
    },
    oat: {
      kind: "box",
      brand: "MILLHOUSE",
      name: "Rolled Oats",
      top: "#b36e43",
      bottom: "#f2e2bd",
      accent: "#b09052",
    },
    wheat: {
      kind: "box",
      brand: "FIELD & GRAIN",
      name: "Whole Wheat",
      top: "#658176",
      bottom: "#ebe5c7",
      accent: "#b6a65b",
    },
    crackers: {
      kind: "box",
      brand: "STONE MILL",
      name: "Crackers",
      top: "#9f4a40",
      bottom: "#ecdac1",
      accent: "#c3aa53",
    },
    tea: {
      kind: "box",
      brand: "LEAF",
      name: "Green Tea",
      top: "#74967a",
      bottom: "#eef0db",
      accent: "#677b46",
    },
    farro: {
      kind: "box",
      brand: "GRAINS",
      name: "Farro",
      top: "#7785a0",
      bottom: "#e8e2cc",
      accent: "#a59b6a",
    },
  };
  const wrappers = {};
  function packArt(d) {
    const bag = d.kind === "bag",
      tin = d.kind === "cup" || d.kind === "tin";
    const width = tin ? 768 : 256,
      h = 320;
    return graphic(width, h, (c, w, H) => {
      c.fillStyle = d.bottom;
      c.fillRect(0, 0, w, H);
      c.fillStyle = d.top;
      if (bag) {
        c.fillRect(0, 144, w, 145);
        c.fillStyle = "#e6e3d7";
        c.fillRect(0, 0, w, 18);
        c.fillStyle = "#3d6353";
        c.beginPath();
        c.arc(w / 2, 87, 30, 0, 2 * Math.PI);
        c.fill();
        c.fillStyle = "#f0f0db";
        c.font = "bold 34px Georgia,serif";
        c.textAlign = "center";
        c.fillText("S", w / 2, 100);
        c.fillStyle = "#264e3e";
        c.font = "bold 16px Arial,sans-serif";
        c.fillText(d.brand, w / 2, 134, w - 16);
        c.fillStyle = d.accent;
        c.save();
        c.translate(w / 2, 188);
        for (let n = 0; n < 17; n++) {
          c.rotate((2 * Math.PI) / 17);
          c.fillRect(-1, 17, 2, 18);
        }
        c.restore();
        c.fillStyle = "#fff7e3";
        c.font = "bold 25px Georgia,serif";
        c.fillText(d.name, w / 2, 236, w - 20);
        c.font = "12px Arial,sans-serif";
        c.fillText("GROUND COFFEE", w / 2, 262);
      } else if (tin) {
        c.fillRect(0, 0, w, H * 0.54);
        c.fillStyle = d.accent;
        c.fillRect(0, H * 0.53, w, 8);
        for (const x of [w * 0.25, w * 0.75]) {
          c.textAlign = "center";
          c.fillStyle = "#fff6e4";
          c.font = "italic bold 50px Georgia,serif";
          c.fillText(d.brand, x, H * 0.33, w * 0.43);
          c.fillStyle = "#a08145";
          c.beginPath();
          c.arc(x, H * 0.56, 16, 0, 7);
          c.fill();
          c.strokeStyle = "#dac386";
          c.lineWidth = 3;
          c.stroke();
          c.fillStyle = "#312d29";
          c.font = "bold 26px Georgia,serif";
          c.fillText(d.name, x, H * 0.72, w * 0.44);
          c.fillStyle = "#d6bb8d";
          c.beginPath();
          c.ellipse(x, H * 0.86, 42, 14, 0, 0, 7);
          c.fill();
          c.fillStyle = "#eee7ca";
          c.beginPath();
          c.ellipse(x, H * 0.85, 41, 11, 0, 0, 7);
          c.fill();
          c.fillStyle = d.accent;
          c.beginPath();
          c.ellipse(x, H * 0.844, 35, 8, 0, 0, 7);
          c.fill();
          c.fillStyle = d.kind === "cup" ? "#933f28" : "#c69b4b";
          for (let i = 0; i < 10; i++) {
            const a = i * 2.3;
            c.fillRect(x + Math.sin(a) * 24, H * 0.84 + Math.cos(a) * 3, 4, 2);
          }
          c.fillStyle = "#75694e";
          c.font = "9px Arial,sans-serif";
          c.fillText("SOUP", x, H * 0.96);
          c.fillStyle = "#544e42";
          for (let k = 0; k < 13; k++)
            c.fillRect(x + w * 0.21, H * 0.62 + k * 3, 14 + (k % 4) * 4, 1.3);
          for (let k = 0; k < 15; k++)
            c.fillRect(x + w * 0.23 + k * 1.6, H * 0.77, k % 2 ? 1 : 0.5, 15);
        }
      } else {
        c.fillRect(0, 0, w, 50);
        c.fillRect(0, 268, w, 52);
        c.textAlign = "center";
        c.fillStyle = "#fff8e5";
        c.font = "bold 19px Arial,sans-serif";
        c.fillText(d.brand, w / 2, 33, w - 18);
        c.fillStyle = d.top;
        c.font = "bold 38px Georgia,serif";
        c.fillText(d.name, w / 2, 124, w - 21);
        c.save();
        c.translate(w / 2, 210);
        c.strokeStyle = d.accent;
        c.lineWidth = 3;
        c.beginPath();
        c.moveTo(0, 26);
        c.lineTo(0, -47);
        c.stroke();
        for (let k = 0; k < 4; k++)
          for (const dir of [-1, 1]) {
            c.fillStyle = d.accent;
            c.beginPath();
            c.ellipse(dir * 11, 7 - k * 12, 15, 6, dir * -0.62, 0, 7);
            c.fill();
          }
        c.restore();
      }
    });
  }
  for (const [key, d] of Object.entries(designs)) {
    wrappers[key] = packArt(d);
    if (d.kind === "cup" || d.kind === "tin") {
      const map = wrappers[key].map;
      map.wrapS = T.RepeatWrapping;
      map.offset.x = 0.25;
    }
  }
  function bagGeometry() {
    // Four slightly tapered sections; side gussets and pinched top give a sack its shape.
    const positions = [],
      uvs = [],
      indices = [],
      groups = [];
    const levels = [
      [0, 0.079, 0.047],
      [0.04, 0.091, 0.055],
      [0.211, 0.098, 0.054],
      [0.28, 0.082, 0.016],
      [0.288, 0.082, 0.013],
    ];
    function quad(a, b, c, d, y0, y1, material) {
      const offset = positions.length / 3;
      positions.push(...a, ...b, ...c, ...d);
      uvs.push(0, y0, 1, y0, 1, y1, 0, y1);
      indices.push(
        offset,
        offset + 1,
        offset + 2,
        offset,
        offset + 2,
        offset + 3,
      );
      groups.push([indices.length - 6, 6, material]);
    }
    const ring = ([y, w, d]) => [
      [-w, y, d],
      [w, y, d],
      [w, y, -d],
      [-w, y, -d],
    ];
    for (let k = 0; k < levels.length - 1; k++) {
      const a = ring(levels[k]),
        b = ring(levels[k + 1]);
      for (let j = 0; j < 4; j++) {
        quad(
          a[j],
          a[(j + 1) % 4],
          b[(j + 1) % 4],
          b[j],
          levels[k][0] / 0.288,
          levels[k + 1][0] / 0.288,
          j === 0 ? 0 : 1,
        );
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    groups.forEach(([s, n, m]) => g.addGroup(s, n, m));
    g.computeVertexNormals();
    return g;
  }
  const bagGeo = bagGeometry(),
    cupGeo = new T.CylinderGeometry(0.102, 0.085, 0.186, 28, 1, true);
  const coffeeMats = {};
  for (const key of ["sumatra", "breakfast", "pike"])
    coffeeMats[key] = [wrappers[key], paper];
  const folded = tone("#d8d6c7"),
    canLid = tone("#a9aaa1", { roughness: 0.38, metalness: 0.6 }),
    cupLid = tone("#982220");
  function makePack(parent, key, x, y, z, angle = 0) {
    const d = designs[key],
      g = new T.Group();
    parent.add(g);
    g.position.set(x, y, z);
    g.rotation.y = angle;
    if (d.kind === "tin" || d.kind === "cup") {
      const cup = d.kind === "cup",
        rr = cup ? 0.102 : 0.079,
        H = cup ? 0.186 : 0.208;
      if (cup) mesh(g, cupGeo, wrappers[key], 0, H / 2, 0);
      else mesh(g, cylGeo, wrappers[key], 0, H / 2, 0, rr, H, rr);
      cylinder(
        g,
        cup ? cupLid : canLid,
        0,
        H + 0.001,
        0,
        rr + 0.005,
        cup ? 0.017 : 0.008,
      );
      cylinder(
        g,
        cup ? cupLid : canLid,
        0,
        cup ? 0.008 : 0.004,
        0,
        cup ? 0.085 : rr + 0.002,
        0.008,
      );
      if (!cup) cylinder(g, canLid, 0, H + 0.006, 0, rr * 0.84, 0.003);
    } else if (d.kind === "bag") {
      mesh(g, bagGeo, coffeeMats[key], 0, 0, 0);
      block(g, folded, 0, 0.29, 0, 0.169, 0.009, 0.027);
    } else {
      block(g, paper, 0, 0.145, 0, 0.166, 0.29, 0.083);
      plane(g, wrappers[key], 0, 0.145, 0.042, 0.166, 0.29);
    }
    return g;
  }
  const shelfRows = [
    [
      "wheat",
      "wheat",
      "oat",
      "oat",
      "farro",
      "crackers",
      "tea",
      "tea",
      "oat",
      "farro",
      "wheat",
      "wheat",
      "tea",
      "oat",
      "oat",
    ],
    [
      "corn",
      "corn",
      "chickpea",
      "chickpea",
      "noodle",
      "noodle",
      "corn",
      "corn",
      "oat",
      "oat",
      "crackers",
      "tea",
      "oat",
      "oat",
      "farro",
    ],
    [
      "chickpea",
      "noodle",
      "noodle",
      "tomato",
      "tomato",
      "noodle",
      "chickpea",
      "pike",
      "sumatra",
      "sumatra",
      "pike",
      "breakfast",
      "breakfast",
      "pike",
      "sumatra",
    ],
    [
      "oat",
      "crackers",
      "crackers",
      "wheat",
      "wheat",
      "tea",
      "tea",
      "tea",
      "breakfast",
      "breakfast",
      "sumatra",
      "sumatra",
      "pike",
      "pike",
      "pike",
    ],
  ];
  for (let level = 0; level < levels.length; level++) {
    for (let slot = 0; slot < 15; slot++) {
      const x = -1.86 + slot * 0.225,
        y = levels[level] + 0.025;
      for (let row = 0; row < 2; row++) {
        if (
          level === 2 &&
          row === 0 &&
          products.some((item) => Math.abs(x - item.x) < 0.155)
        )
          continue;
        const key = shelfRows[level][slot],
          z = row === 0 ? -0.852 : -1.14;
        makePack(
          solid,
          key,
          x + (random() - 0.5) * 0.017,
          y,
          z + (random() - 0.5) * 0.014,
          (random() - 0.5) * 0.105,
        );
      }
      if (slot % 2 === 0 && level !== 2) {
        const bar = block(
          solid,
          paper,
          x,
          levels[level] - 0.02,
          -0.675,
          0.14,
          0.029,
          0.007,
        );
        for (const offset of [-0.046, -0.017, 0.002])
          block(
            solid,
            steel,
            bar.position.x + offset,
            bar.position.y,
            -0.67,
            0.014,
            0.003,
            0.002,
          );
      }
    }
  }
  const heroY = levels[2] + 0.025,
    heroZ = -0.839;
  const pickZones = [],
    hero = [];
  const clearHit = new T.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    colorWrite: false,
  });
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const g = makePack(scene, p.key, p.x, heroY, heroZ, i === 0 ? 0.01 : -0.02);
    hero.push(g);
    const shelfTag = plane(
      solid,
      sign(p.title, "#f5eee0", "#272b25", 512, 106),
      p.x,
      levels[2] - 0.017,
      -0.674,
      0.29,
      0.058,
    );
    const zone = mesh(
      scene,
      boxGeo,
      clearHit,
      p.x,
      heroY + 0.094,
      -0.82,
      0.39,
      0.33,
      0.34,
    );
    zone.castShadow = zone.receiveShadow = false;
    zone.userData.item = i;
    pickZones.push(zone);
    // Shelf tags and the product directly above them share one selection target.
    shelfTag.userData.item = i;
  }
  const pointer = new T.Group();
  scene.add(pointer);
  const pointerInk = tone("#292c27", { roughness: 0.6 });
  for (const side of [-1, 1]) {
    block(pointer, pointerInk, side * 0.117, 0.017, 0, 0.013, 0.032, 0.011);
    block(pointer, pointerInk, side * 0.103, 0.004, 0, 0.035, 0.009, 0.017);
  }
  // A small bagging counter and display identify the checkout end of the aisle.
  const counter = new T.Group();
  counter.position.set(2.04, 0, -0.63);
  counter.rotation.y = -0.52;
  solid.add(counter);
  block(counter, greenDeep, 0, 0.49, 0, 0.68, 0.93, 0.63);
  block(counter, oak, 0, 0.97, 0, 0.74, 0.065, 0.7);
  for (let j = 0; j < 7; j++)
    block(counter, green, 0.29 - j * 0.095, 0.51, 0.321, 0.012, 0.78, 0.014);
  block(counter, steel, 0.1, 1.13, -0.15, 0.054, 0.28, 0.055);
  const screenBody = new T.Group();
  screenBody.position.set(0.1, 1.34, -0.11);
  screenBody.rotation.x = -0.18;
  counter.add(screenBody);
  block(screenBody, steel, 0, 0, 0, 0.48, 0.3, 0.05);
  const till = graphic(512, 320, (c, w, h) => {
    c.fillStyle = "#e8eee6";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#31534c";
    c.fillRect(0, 0, w, 65);
    c.fillStyle = "#fff";
    c.font = "600 32px Arial,sans-serif";
    c.fillText("Checkout", 22, 44);
    c.fillStyle = "#44655b";
    c.font = "24px Arial,sans-serif";
    c.fillText("Your basket", 24, 113);
    c.strokeStyle = "#b6c3b9";
    c.lineWidth = 2;
    for (const y of [146, 194, 244]) {
      c.beginPath();
      c.moveTo(24, y);
      c.lineTo(w - 24, y);
      c.stroke();
    }
  });
  plane(screenBody, till, 0, 0, 0.028, 0.435, 0.254);
  block(counter, glass, -0.15, 1.01, 0.07, 0.18, 0.011, 0.27);
  // Low produce bins mark the other side of the shop without obstructing the camera.
  const produce = new T.Group();
  solid.add(produce);
  produce.position.set(-2.61, 0, -0.56);
  produce.rotation.y = 0.2;
  block(produce, greenDeep, 0, 0.35, 0.0, 0.77, 0.7, 0.53);
  const fruitMats = ["#a6543b", "#c87840", "#a2a258", "#d0a446"].map((c) =>
    tone(c, { roughness: 0.76 }),
  );
  for (let tier = 0; tier < 2; tier++) {
    const y = 0.72 + tier * 0.18,
      z = 0.12 - tier * 0.32;
    block(produce, oak, 0, y, z, 0.79, 0.07, 0.32);
    for (const side of [-1, 1])
      block(produce, oak, side * 0.388, y + 0.075, z, 0.024, 0.16, 0.33);
    block(produce, oak, 0, y + 0.065, z + 0.14, 0.79, 0.075, 0.025);
    for (let i = 0; i < 11; i++) {
      const x = ((i % 6) - 2.5) * 0.104 + (random() - 0.5) * 0.026;
      mesh(
        produce,
        sphereGeo,
        fruitMats[(tier * 2 + (i % 2)) % 4],
        x,
        y + 0.071 + (i % 3) * 0.005,
        z + (i < 6 ? 0.045 : -0.05),
        0.057,
        0.055,
        0.058,
      );
    }
  }
  const lens = v(1.48, 2.12, 0.4);
  const mount = new T.Group();
  solid.add(mount);
  rod(mount, alu, v(1.57, 2.22, -1.4), v(1.57, 2.22, 0.35), 0.021);
  rod(mount, alu, v(1.57, 2.22, 0.35), lens, 0.025);
  block(mount, steel, 1.57, 2.22, -1.395, 0.14, 0.14, 0.04);
  const housing = new T.Group();
  housing.position.copy(lens);
  housing.lookAt(v(-0.32, 1.16, -0.83));
  scene.add(housing);
  block(housing, white, 0, 0, 0, 0.16, 0.115, 0.2);
  block(housing, steel, 0, -0.004, 0.103, 0.129, 0.088, 0.022);
  const barrel = cylinder(housing, steel, 0, -0.003, 0.126, 0.033, 0.047);
  barrel.rotation.x = Math.PI / 2;
  const glassLens = cylinder(housing, glass, 0, -0.003, 0.151, 0.024, 0.008);
  glassLens.rotation.x = Math.PI / 2;
  // Geometry and materials shared by stationary groceries draw in batches.
  solid.updateMatrixWorld(true);
  const batches = new Map();
  solid.traverse((o) => {
    if (!o.isMesh) return;
    const materialKey = Array.isArray(o.material)
      ? o.material.map((m) => m.uuid).join("/")
      : o.material.uuid;
    const key = o.geometry.uuid + materialKey + Number(o.castShadow);
    if (!batches.has(key))
      batches.set(key, {
        geometry: o.geometry,
        material: o.material,
        cast: o.castShadow,
        matrices: [],
      });
    batches.get(key).matrices.push(o.matrixWorld.clone());
  });
  scene.remove(solid);
  for (const { geometry, material, cast, matrices } of batches.values()) {
    const batch = new T.InstancedMesh(geometry, material, matrices.length);
    matrices.forEach((mat, i) => batch.setMatrixAt(i, mat));
    batch.castShadow = cast;
    batch.receiveShadow = true;
    scene.add(batch);
  }
  const shopper = makeShopper(scene, 0);
  const hemi = new T.HemisphereLight("#fff7e8", "#c0c6bd", 1.55);
  scene.add(hemi);
  const sun = new T.DirectionalLight("#fff2d9", 2.35);
  sun.position.set(-3.6, 6.3, 3.1);
  sun.target.position.set(-0.3, 0.4, -0.83);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.bias = -0.0007;
  sun.shadow.normalBias = 0.012;
  Object.assign(sun.shadow.camera, {
    left: -3.5,
    right: 3.5,
    top: 3,
    bottom: -3,
    near: 0.4,
    far: 13,
  });
  scene.add(sun, sun.target);
  const fill = new T.DirectionalLight("#e6eeef", 0.72);
  fill.position.set(3, 3, 2);
  scene.add(fill);

  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const smooth = (x) => {
    x = Math.max(0, Math.min(x, 1));
    return x * x * (3 - 2 * x);
  };
  const mix = (a, b, t) => a + (b - a) * t;
  let selected = 0,
    activeView = "aisle",
    yaw = 0.37,
    pitch = 0.14,
    zoom = 1,
    progress = 0;
  let transition = null,
    pickup = null,
    frame = 0,
    visible = true,
    lost = false;
  const aim = v(0, 0, 0),
    desired = v(0, 0, 0),
    goalAim = v(0, 0, 0);
  function restPose() {
    for (let i = 0; i < hero.length; i++) {
      const item = hero[i];
      item.position.set(products[i].x, heroY, heroZ);
      item.rotation.set(0, i === 0 ? 0.01 : -0.02, 0);
    }
  }
  function pose(t) {
    const item = hero[selected],
      px = products[selected].x;
    const reach = smooth(t / 0.44),
      hold = smooth((t - 0.4) / 0.46);
    item.position.set(
      px + 0.015 * hold,
      heroY + 0.118 * hold,
      heroZ + 0.235 * hold,
    );
    item.rotation.set(-0.045 * hold, -0.085 * hold, -0.043 * hold);
    shopper.root.position.set(px - 0.36, 0, -0.22);
    shopper.root.rotation.y = 2.75;
    shopper.root.updateMatrixWorld(true);
    item.updateMatrixWorld(true);
    const at = (x, y, z) => item.localToWorld(v(x, y, z));
    const from = (x, y, z) => shopper.root.localToWorld(v(x, y, z));
    // Approach the near side of the package before lifting it clear of the shelf.
    const wrist = at(-0.071, selected === 0 ? 0.105 : 0.14, 0.049);
    const right = from(-0.205, 0.89, 0.11).lerp(wrist, reach);
    right.y += Math.sin(Math.PI * reach) * 0.065;
    const support = smooth((t - 0.3) / 0.45);
    const left = from(0.205, 0.91, 0.095).lerp(at(0.045, 0.01, 0.023), support);
    const hip = v(0, 0.873 - 0.013 * reach, 0.012 * reach);
    const feet = [v(-0.11, 0.085, 0.084), v(0.114, 0.085, -0.082)];
    shopper.pose({
      stance: { hip, ankles: feet, twist: -0.03 * reach },
      lean: 0.028 + 0.055 * reach,
      right,
      left,
      grasp: reach,
    });
    shopper.head.rotation.set(0.18 + 0.15 * reach, -0.16, 0);
    pointer.position.set(px, heroY - 0.008, -0.69);
  }
  function framing(mode) {
    if (mode === "camera") {
      desired.copy(lens);
      const target = hero[selected].position;
      goalAim.set(target.x, target.y + 0.12, target.z);
      const tightness = stage.clientWidth < 560 ? 0.91 : 0.8;
      // A crop of the fixed sensor view changes its field of view, preserving the lens position.
      return {
        position: desired.clone(),
        target: goalAim.clone(),
        fov: 26 * zoom * tightness,
      };
    }
    const isShelf = mode === "shelf";
    const aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
    const radius = (isShelf ? 2.25 : 4.6) * zoom * (aspect < 1.5 ? 1.13 : 1);
    goalAim.set(
      isShelf ? products[selected].x - 0.05 : 0.1,
      isShelf ? 1.2 : 1.16,
      isShelf ? -0.93 : -1.0,
    );
    const elev = pitch + (isShelf ? 0.055 : 0.04);
    desired.set(
      goalAim.x + radius * Math.sin(yaw) * Math.cos(elev),
      goalAim.y + radius * Math.sin(elev),
      goalAim.z + radius * Math.cos(yaw) * Math.cos(elev),
    );
    return {
      position: desired.clone(),
      target: goalAim.clone(),
      fov: isShelf ? 32 : aspect < 1.5 ? 47 : 38,
    };
  }
  function applyFrame(p) {
    camera.position.copy(p.position);
    aim.copy(p.target);
    camera.lookAt(aim);
    if (Math.abs(camera.fov - p.fov) > 0.005) {
      camera.fov = p.fov;
      camera.updateProjectionMatrix();
    }
    housing.visible = activeView !== "camera";
  }
  function render(time = performance.now()) {
    frame = 0;
    if (lost) return;
    if (pickup) {
      progress = Math.min(1, (time - pickup.since) / 2250);
      pose(progress);
      if (progress >= 0.53 && !pickup.moved) {
        pickup.moved = true;
        setView("camera", true);
      }
    }
    const next = framing(activeView);
    if (transition) {
      const t = smooth((time - transition.since) / transition.duration);
      applyFrame({
        position: transition.position.clone().lerp(next.position, t),
        target: transition.target.clone().lerp(next.target, t),
        fov: mix(transition.fov, next.fov, t),
      });
      if (t >= 1) transition = null;
    } else applyFrame(next);
    renderer.render(scene, camera);
    if (pickup && progress >= 1) {
      const done = pickup.done;
      pickup = null;
      done();
    }
    if (transition || pickup) schedule();
  }
  function schedule() {
    if (!frame && visible && !lost) frame = requestAnimationFrame(render);
  }
  function setView(mode, animate = true) {
    if (mode !== activeView) {
      yaw = mode === "shelf" ? 0.18 : 0.37;
      pitch = 0.14;
      zoom = 1;
    }
    activeView = mode;
    if (animate && visible && !reduced.matches) {
      transition = {
        since: performance.now(),
        duration: 470,
        position: camera.position.clone(),
        target: aim.clone(),
        fov: camera.fov,
      };
    } else transition = null;
    schedule();
  }
  function resize() {
    const w = stage.clientWidth,
      h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    schedule();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  const sight = new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) schedule();
    },
    { rootMargin: "170px" },
  );
  sight.observe(stage);
  restPose();
  pose(0);
  resize();
  applyFrame(framing("aisle"));
  renderer.render(scene, camera);
  const ray = new T.Raycaster(),
    pointerPoint = new T.Vector2();
  function itemUnder(e) {
    const r = canvas.getBoundingClientRect();
    pointerPoint.set(
      (2 * (e.clientX - r.left)) / r.width - 1,
      1 - (2 * (e.clientY - r.top)) / r.height,
    );
    ray.setFromCamera(pointerPoint, camera);
    return ray.intersectObjects(pickZones, false)[0]?.object.userData.item;
  }
  let drag = null;
  function turn(dx, dy) {
    if (activeView === "camera") return;
    yaw = Math.max(-0.68, Math.min(0.91, yaw + dx));
    pitch = Math.max(-0.07, Math.min(0.48, pitch + dy));
    transition = null;
    schedule();
  }
  canvas.addEventListener("pointerdown", (e) => {
    if (pickup || (e.button !== 0 && e.pointerType === "mouse")) return;
    drag = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      moved: false,
    };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) {
      if (e.pointerType === "mouse")
        canvas.style.cursor = itemUnder(e) !== undefined ? "pointer" : "grab";
      return;
    }
    const dx = e.clientX - drag.lastX,
      dy = e.clientY - drag.lastY;
    if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 5)
      drag.moved = true;
    if (drag.moved) {
      turn(-dx * 0.006, dy * 0.003);
      canvas.style.cursor = "grabbing";
    }
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    if (canvas.hasPointerCapture(e.pointerId))
      canvas.releasePointerCapture(e.pointerId);
    if (!moved) {
      const index = itemUnder(e);
      if (index !== undefined) hooks.onSelect(index);
    }
    canvas.style.cursor = "grab";
  });
  canvas.addEventListener("pointercancel", () => {
    drag = null;
  });
  canvas.addEventListener("keydown", (e) => {
    if (pickup) return;
    switch (e.key) {
      case "ArrowLeft":
        turn(-0.1, 0);
        break;
      case "ArrowRight":
        turn(0.1, 0);
        break;
      case "ArrowUp":
        zoom = Math.max(0.62, zoom - 0.1);
        transition = null;
        schedule();
        break;
      case "ArrowDown":
        zoom = Math.min(1.55, zoom + 0.1);
        transition = null;
        schedule();
        break;
      case "Home":
        yaw = activeView === "shelf" ? 0.18 : 0.37;
        pitch = 0.14;
        zoom = 1;
        setView(activeView, true);
        break;
      case "Enter":
      case " ":
        hooks.onCapture();
        break;
      default:
        return;
    }
    e.preventDefault();
  });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    resizeObserver.disconnect();
    sight.disconnect();
    hooks.onFallback();
  });
  return {
    select(index, mode) {
      pickup = null;
      progress = 0;
      selected = index;
      restPose();
      pose(0);
      setView(mode, false);
    },
    setView,
    pickup(done) {
      transition = null;
      restPose();
      pose(0);
      if (reduced.matches) {
        progress = 1;
        pose(1);
        setView("camera", false);
        done();
        schedule();
        return;
      }
      setView("aisle", true);
      pickup = { since: performance.now(), done, moved: false };
      schedule();
    },
  };
}
const root = document.getElementById("checkout-lab");
if (root) install(root);
