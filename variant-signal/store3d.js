// The rendered shelf, recorded DexYCB pickup and GroceryVision retrieval examples have separate sources.
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
      "For this photo of Campbell’s Creamy Tomato, SigLIP2 ranks the text for Chicken Noodle first. The description for the photographed flavor ranks second.",
    source: "Figure 1 reports the ranking from comparing this photo with catalog text using the pretrained SigLIP2 encoders.",
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
      "For this Sumatra photo, the Sumatra description ranks first among all 409 catalog descriptions.",
    source:
      "SigLIP2-gopt-384 encoded the store photo and each written description. These scores compare their original vectors by cosine similarity, using all dimensions.",
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
      "For this Breakfast Blend photo, the Breakfast Blend description ranks first among all 409 catalog descriptions. The next two descriptions name other Starbucks roasts.",
    source:
      "SigLIP2-gopt-384 encoded the store photo and each written description. These scores compare their original vectors by cosine similarity, using all dimensions.",
  },
];
const asset = (path) => new URL("./assets/" + path, import.meta.url).href;

async function install(root) {
  root.innerHTML = `
    <div class="vs3d-tabs" role="group" aria-label="Checkout demonstration">
      <button type="button" class="vs3d-tab" data-view="shelf" aria-pressed="true" aria-controls="vs3d-shelf">Explore the shelf</button>
      <button type="button" class="vs3d-tab" data-view="pickup" aria-pressed="false" aria-controls="vs3d-pickup">Recorded product pickup</button>
    </div>
    <div id="vs3d-shelf"><div class="vs3d-stage"><img class="vs3d-poster" width="1140" height="530" alt="A grocery shelf stocked with soup and coffee, viewed from the checkout aisle."></div>
    <div class="vs3d-controls">
      <label>Product<select class="vs3d-product"></select></label>
      <label>View<select class="vs3d-view"><option value="aisle">Store aisle</option><option value="shelf">Product shelf</option><option value="camera">Shelf camera</option></select></label>
      <button type="button" class="vs3d-capture">Photograph the product</button>
    </div>
    <p class="vs3d-help">Choose a product on the shelf or in the menu. Drag to look around. Use the arrow keys to turn or zoom and Enter to photograph the product.</p>
    <p class="vs3d-status" role="status"></p>
    <div class="vs3d-record" hidden>
      <figure><img class="vs3d-query" alt=""><figcaption></figcaption></figure>
      <div><h3>Frozen model’s catalog ranking</h3><p class="vs3d-finding"></p><table><thead></thead><tbody></tbody></table><details class="vs3d-inspection"><summary>About this ranking</summary><p></p></details></div>
    </div><details class="vs3d-credits"><summary>Image credits</summary><p>Campbell’s and Starbucks labels are cropped from GroceryVision photographs. Shelf stock uses scans from the <a href="https://ycb-benchmarks.s3.amazonaws.com/index.html">YCB Object and Model Set</a>. The interior photograph and wood texture are from <a href="https://polyhaven.com/">Poly Haven</a>. <a href="assets/store-3d/credits.txt">Sources and licenses</a>.</p></details></div>
    <div id="vs3d-pickup" hidden></div>`;
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
    capture.textContent = display ? "Photograph again" : "Show recorded match";
    status.textContent = "Recorded match for " + entry.truth + ".";
    get(".vs3d-query").src = asset(entry.photo);
    get(".vs3d-query").alt = "GroceryVision photograph of " + entry.truth;
    get("figcaption").textContent =
      "GroceryVision query photograph of " + entry.truth + ".";
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
    if (hasScore) cell(head, "th", "Cosine similarity ↑");
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
        ? "Photograph the product"
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
  let recorded;
  const tabs = [...root.querySelectorAll(".vs3d-tab")];
  tabs.forEach((button) =>
    button.addEventListener("click", () => {
      const usePickup = button.dataset.view === "pickup";
      tabs.forEach((tab) =>
        tab.setAttribute("aria-pressed", String(button === tab)),
      );
      get("#vs3d-shelf").hidden = usePickup;
      get("#vs3d-pickup").hidden = !usePickup;
      if (usePickup) {
        if (!recorded) recorded = installRecording(get("#vs3d-pickup"));
        recorded.open();
      } else recorded?.pause();
    }),
  );
  capture.addEventListener("click", photograph);
  product.addEventListener("change", () => choose(Number(product.value)));
  view.addEventListener("change", () => display?.setView(view.value));
  async function start() {
    try {
      const T = await import("../shelftaught/three-r180/three.module.min.js");
      display = buildScene(T, stage, {
        onSelect: (i) => choose(i, true),
        onCapture: photograph,
        onFallback: unavailable,
      });
      display.select(current, view.value);
      poster.hidden = true;
      waitingForScene = false;
      if (revealed) capture.textContent = "Photograph again";
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

function installRecording(panel) {
  panel.innerHTML = `<div class="vs3d-footage">
    <figure><div class="vs3d-movie"><video class="vs3d-main-film" muted playsinline preload="metadata" aria-label="Recorded hand reaching for a coffee can, grasping it and lifting it off a table"></video></div><figcaption class="vs3d-camera-name">Side camera</figcaption></figure>
    <figure class="vs3d-second-angle"><div class="vs3d-movie"><video class="vs3d-second-film" muted playsinline preload="metadata" aria-label="Synchronized second camera angle of the same pickup"></video></div><figcaption class="vs3d-second-name">Overhead camera</figcaption></figure>
  </div>
  <div class="vs3d-controls vs3d-playback"><button class="vs3d-play" type="button">Play pickup</button>
    <label class="vs3d-time-label">Frame <output class="vs3d-time" for="vs3d-time-bar">1 of 72</output><input type="range" class="vs3d-scrub" id="vs3d-time-bar" min="0" max="71" value="0" step="1"></label>
    <label>Camera<select class="vs3d-camera"><option value="side">Side</option><option value="above">Overhead</option><option value="front">Front</option></select></label>
  </div>
  <div class="vs3d-moments" role="group" aria-label="Jump to a moment in the pickup"><button type="button" data-frame="18">Reach</button><button type="button" data-frame="32">Grip</button><button type="button" data-frame="43">Lift</button><button type="button" data-frame="62">Hold</button></div>
  <p class="vs3d-help vs3d-record-help">Three synchronized camera views show a participant grasping a coffee can. Select a frame or camera to inspect the grasp.</p>
  <p class="vs3d-credit">Coffee-can pickup from <a href="https://dex-ycb.github.io/">DexYCB (Chao et al.)</a>, licensed under <a href="https://creativecommons.org/licenses/by-nc/4.0/">CC BY-NC 4.0</a>. Playback is at half speed. The catalog rankings on the shelf use photographs from GroceryVision.</p>`;
  const main = panel.querySelector(".vs3d-main-film"),
    other = panel.querySelector(".vs3d-second-film");
  const select = panel.querySelector(".vs3d-camera"),
    play = panel.querySelector(".vs3d-play");
  const scrub = panel.querySelector(".vs3d-scrub"),
    counter = panel.querySelector(".vs3d-time");
  const titles = {
    side: "Side camera",
    above: "Overhead camera",
    front: "Front camera",
  };
  const companion = { side: "above", above: "side", front: "above" };
  const secondVisible = matchMedia("(min-width: 641px)");
  const cameras = fetch(asset("store-3d/pickup-cameras.json"))
    .then((r) => {
      if (!r.ok) throw new Error("Camera data unavailable");
      return r.json();
    })
    .catch(() => []);
  const depthCache = new Map();
  let generation = 0,
    shown = 32,
    playing = false,
    angle,
    depthView;
  let frameRequest, callbackKind;
  const setTime = (v, n) => {
    if (v.readyState < 1) return;
    if (v === main && v.requestVideoFrameCallback)
      v.requestVideoFrameCallback((_, info) => {
        if (!playing && Math.abs(info.mediaTime - shown / 30) < 0.04)
          depthView?.frame(shown);
      });
    v.currentTime = n / 30 + 0.001;
  };
  function progress(n) {
    shown = Math.max(0, Math.min(71, n));
    scrub.value = String(shown);
    scrub.setAttribute("aria-valuetext", `Frame ${shown + 1} of 72`);
    counter.value = `${shown + 1} of 72`;
    depthView?.frame(shown);
  }
  function endFrameCallback() {
    if (frameRequest !== undefined) {
      if (callbackKind === "video") main.cancelVideoFrameCallback(frameRequest);
      else cancelAnimationFrame(frameRequest);
      frameRequest = undefined;
    }
  }
  function watch() {
    endFrameCallback();
    if (!playing) return;
    const tick = (now, info) => {
      frameRequest = undefined;
      if (!playing) return;
      const time = info ? info.mediaTime : main.currentTime;
      progress(Math.floor(time * 30 + 0.005));
      if (
        secondVisible.matches &&
        other.readyState >= 2 &&
        Math.abs(other.currentTime - main.currentTime) > 0.075
      )
        other.currentTime = main.currentTime;
      watch();
    };
    callbackKind = main.requestVideoFrameCallback ? "video" : "raf";
    frameRequest =
      callbackKind === "video"
        ? main.requestVideoFrameCallback(tick)
        : requestAnimationFrame(tick);
  }
  function pause() {
    playing = false;
    main.pause();
    other.pause();
    endFrameCallback();
    play.textContent = shown >= 70 ? "Replay pickup" : "Play pickup";
  }
  function seek(n) {
    pause();
    progress(n);
    setTime(main, n);
    setTime(other, n);
  }
  async function run() {
    if (playing) {
      pause();
      return;
    }
    if (
      shown >= 70 ||
      (shown === 32 &&
        play.textContent === "Play pickup" &&
        !panel.dataset.explored)
    )
      seek(0);
    panel.dataset.explored = "true";
    main.playbackRate = other.playbackRate = 0.5;
    try {
      await main.play();
      playing = true;
      play.textContent = "Pause";
      if (secondVisible.matches && other.readyState >= 1) {
        other.currentTime = main.currentTime;
        other.play().catch(() => {});
      }
      watch();
    } catch {
      pause();
    }
  }
  const filmURLs = new Map();
  async function loadVideo(video, name) {
    video.dataset.angle = name;
    video.poster = asset(`store-3d/pickup-${name}.webp`);
    if (!filmURLs.has(name)) {
      const url = asset(`store-3d/pickup-${name}.mp4`);
      filmURLs.set(
        name,
        fetch(url)
          .then(async (response) => {
            if (!response.ok) throw new Error("Recording unavailable");
            return URL.createObjectURL(await response.blob());
          })
          .catch(() => url),
      );
    }
    const url = await filmURLs.get(name);
    if (video.dataset.angle !== name) return;
    video.addEventListener("loadedmetadata", () => setTime(video, shown), {
      once: true,
    });
    video.src = url;
    video.load();
  }
  async function chooseCamera(name) {
    pause();
    angle = name;
    const token = ++generation;
    depthView?.hide();
    panel.querySelector(".vs3d-camera-name").textContent = titles[name];
    panel.querySelector(".vs3d-second-name").textContent =
      titles[companion[name]];
    loadVideo(main, name);
    if (secondVisible.matches) loadVideo(other, companion[name]);
    if (!window.DecompressionStream) return;
    try {
      const specs = await cameras,
        spec = specs.find((x) => x.name === name);
      if (!spec || token !== generation) return;
      if (!depthCache.has(name))
        depthCache.set(
          name,
          fetch(asset(`store-3d/pickup-${name}.depth.gz`)).then(async (r) => {
            if (!r.ok) throw new Error("Depth data unavailable");
            const payload = new Uint8Array(await r.arrayBuffer());
            let depth = payload;
            if (payload[0] === 0x1f && payload[1] === 0x8b) {
              const stream = new Blob([payload])
                .stream()
                .pipeThrough(new DecompressionStream("gzip"));
              depth = new Uint8Array(await new Response(stream).arrayBuffer());
            }
            const stride = spec.grid[0] * spec.grid[1];
            if (depth.length !== stride * spec.count)
              throw new Error("Incomplete depth capture");
            for (let i = stride; i < depth.length; i++)
              depth[i] += depth[i - stride];
            return depth;
          }),
        );
      const [T, depth] = await Promise.all([
        import("../shelftaught/three-r180/three.module.min.js"),
        depthCache.get(name),
      ]);
      if (token !== generation) return;
      if (!depthView)
        depthView = makeDepthView(T, main, panel.querySelector(".vs3d-movie"));
      depthView.camera(spec, depth);
      depthView.frame(shown);
      panel.querySelector(".vs3d-record-help").textContent =
        "The first view uses recorded depth. Drag to adjust the viewpoint, or pause playback and select a different camera to inspect the same grasp.";
    } catch {
      /* The original color recordings remain usable without the depth viewer. */
    }
  }
  main.addEventListener("seeked", () => {
    if (!playing) depthView?.frame(shown);
  });
  main.addEventListener("loadeddata", () => depthView?.frame(shown));
  other.addEventListener("loadeddata", () => {
    if (playing && secondVisible.matches) {
      other.playbackRate = main.playbackRate;
      other.currentTime = main.currentTime;
      other.play().catch(() => {});
    }
  });
  main.addEventListener("ended", () => {
    progress(71);
    pause();
    setTime(other, 71);
  });
  select.addEventListener("change", () => {
    panel.dataset.explored = "true";
    chooseCamera(select.value);
  });
  play.addEventListener("click", run);
  scrub.addEventListener("input", () => {
    panel.dataset.explored = "true";
    seek(Number(scrub.value));
  });
  panel.querySelectorAll("[data-frame]").forEach((b) =>
    b.addEventListener("click", () => {
      panel.dataset.explored = "true";
      seek(Number(b.dataset.frame));
    }),
  );
  secondVisible.addEventListener("change", () => {
    if (secondVisible.matches && angle) {
      loadVideo(other, companion[angle]);
    } else other.pause();
  });
  progress(shown);
  return {
    pause,
    open() {
      if (!angle) chooseCamera(select.value);
      else depthView?.frame(shown);
    },
  };
}

// Reproject each color pixel along the calibrated camera ray by its measured depth.
// The backplate fills small disocclusions at the edges of the recorded viewpoint.
function makeDepthView(T, video, container) {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    powerPreference: "low-power",
  });
  if (!gl) throw new Error("3D graphics unavailable");
  const renderer = new T.WebGLRenderer({
    canvas,
    context: gl,
    antialias: false,
  });
  renderer.setPixelRatio(Math.min(1.75, devicePixelRatio || 1));
  renderer.outputColorSpace = T.SRGBColorSpace;
  const camera = new T.PerspectiveCamera(),
    scene = new T.Scene(),
    movie = new T.VideoTexture(video);
  movie.colorSpace = T.SRGBColorSpace;
  const material = new T.MeshBasicMaterial({
    map: movie,
    side: T.DoubleSide,
    toneMapped: false,
  });
  const mesh = new T.Mesh(new T.BufferGeometry(), material);
  mesh.frustumCulled = false;
  scene.add(mesh);
  scene.background = movie;
  canvas.tabIndex = 0;
  canvas.hidden = true;
  canvas.setAttribute(
    "aria-label",
    "Recorded pickup in 3D. Drag or use the arrow keys to change the viewpoint. Press Home to return to the camera.",
  );
  container.append(canvas);
  let spec,
    bytes,
    xyz,
    xy,
    indices,
    rendered = -1,
    shiftX = 0,
    shiftY = 0,
    lost = false,
    alive = false;
  function draw() {
    if (!alive || lost || video.readyState < 2 || !container.clientWidth)
      return;
    const w = container.clientWidth,
      h = container.clientHeight;
    if (
      renderer.domElement.width !== Math.floor(w * renderer.getPixelRatio()) ||
      renderer.domElement.height !== Math.floor(h * renderer.getPixelRatio())
    )
      renderer.setSize(w, h, false);
    camera.position.set(shiftX, shiftY, 0);
    camera.lookAt(0, 0, -0.94);
    renderer.render(scene, camera);
    canvas.hidden = false;
  }
  function setCamera(meta, data) {
    spec = meta;
    bytes = data;
    rendered = -1;
    shiftX = shiftY = 0;
    alive = true;
    const [w, h] = spec.grid,
      count = w * h,
      uv = new Float32Array(count * 2);
    xyz = new Float32Array(count * 3);
    xy = new Float32Array(count * 2);
    indices = new Uint16Array((w - 1) * (h - 1) * 6);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x,
          u = x / (w - 1),
          v = y / (h - 1);
        uv[i * 2] = u;
        uv[i * 2 + 1] = 1 - v;
        xy[i * 2] = (u * spec.width - spec.cx) / spec.fx;
        xy[i * 2 + 1] = (spec.cy - v * spec.height) / spec.fy;
      }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.BufferAttribute(xyz, 3).setUsage(T.DynamicDrawUsage),
    );
    geometry.setAttribute("uv", new T.BufferAttribute(uv, 2));
    geometry.setIndex(
      new T.BufferAttribute(indices, 1).setUsage(T.DynamicDrawUsage),
    );
    mesh.geometry.dispose();
    mesh.geometry = geometry;
    const near = 0.08;
    camera.projectionMatrix.makePerspective(
      (-spec.cx * near) / spec.fx,
      ((spec.width - spec.cx) * near) / spec.fx,
      (spec.cy * near) / spec.fy,
      (-(spec.height - spec.cy) * near) / spec.fy,
      near,
      4,
    );
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  }
  function frame(n) {
    if (!alive || !spec || lost) return;
    if (n !== rendered) {
      const [w, h] = spec.grid,
        count = w * h,
        depth = bytes.subarray(n * count, (n + 1) * count);
      for (let i = 0; i < count; i++) {
        const z = spec.near + spec.unit * depth[i];
        xyz[3 * i] = xy[2 * i] * z;
        xyz[3 * i + 1] = xy[2 * i + 1] * z;
        xyz[3 * i + 2] = -z;
      }
      let j = 0;
      for (let y = 0; y < h - 1; y++)
        for (let x = 0; x < w - 1; x++) {
          const a = y * w + x,
            b = a + 1,
            c = a + w,
            d = c + 1;
          if (
            Math.max(depth[a], depth[b], depth[c]) -
              Math.min(depth[a], depth[b], depth[c]) <
            10
          ) {
            indices[j++] = a;
            indices[j++] = c;
            indices[j++] = b;
          }
          if (
            Math.max(depth[d], depth[b], depth[c]) -
              Math.min(depth[d], depth[b], depth[c]) <
            10
          ) {
            indices[j++] = b;
            indices[j++] = c;
            indices[j++] = d;
          }
        }
      mesh.geometry.attributes.position.needsUpdate = true;
      mesh.geometry.index.needsUpdate = true;
      mesh.geometry.setDrawRange(0, j);
      rendered = n;
    }
    movie.needsUpdate = true;
    draw();
  }
  function offset(dx, dy) {
    shiftX = Math.max(-0.045, Math.min(0.045, shiftX + dx));
    shiftY = Math.max(-0.025, Math.min(0.025, shiftY + dy));
    draw();
  }
  let drag;
  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!drag || drag.id !== e.pointerId) return;
    offset((drag.x - e.clientX) * 0.00038, (e.clientY - drag.y) * 0.00032);
    drag.x = e.clientX;
    drag.y = e.clientY;
  });
  canvas.addEventListener("lostpointercapture", () => {
    drag = null;
  });
  canvas.addEventListener("pointerup", (e) => {
    if (canvas.hasPointerCapture(e.pointerId))
      canvas.releasePointerCapture(e.pointerId);
  });
  canvas.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowLeft":
        offset(-0.012, 0);
        break;
      case "ArrowRight":
        offset(0.012, 0);
        break;
      case "ArrowUp":
        offset(0, 0.008);
        break;
      case "ArrowDown":
        offset(0, -0.008);
        break;
      case "Home":
        shiftX = shiftY = 0;
        draw();
        break;
      default:
        return;
    }
    e.preventDefault();
  });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    alive = false;
    canvas.hidden = true;
  });
  new ResizeObserver(draw).observe(container);
  return {
    camera: setCamera,
    frame,
    hide() {
      alive = false;
      canvas.hidden = true;
    },
  };
}

function buildScene(T, stage, hooks) {
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
  renderer.toneMappingExposure = 0.98;
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
  let assetsReady = false;
  const loader = new T.TextureLoader();
  function photographedLabel(filename) {
    const map = loader.load(asset("store-3d/" + filename), () => {
      if (assetsReady) schedule();
    });
    map.colorSpace = T.SRGBColorSpace;
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    return tone("#ffffff", { map, roughness: 0.62 });
  }
  const interior = loader.load(asset("store-3d/shop-interior.webp"), () => {
    if (assetsReady) schedule();
  });
  interior.colorSpace = T.SRGBColorSpace;
  interior.mapping = T.EquirectangularReflectionMapping;
  scene.environment = interior;
  scene.environmentIntensity = 0.68;
  scene.background = interior;
  scene.backgroundBlurriness = 0.025;
  scene.backgroundRotation.y = 1.72;
  scene.environmentRotation.y = 1.72;
  const wood = loader.load(asset("store-3d/shelf-wood.webp"), () => {
    if (assetsReady) schedule();
  });
  wood.colorSpace = T.SRGBColorSpace;
  oak.map = wood;
  oak.color.set("#e0d4bb");
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
  block(solid, tone("#d8d6cf"), -0.23, 1.04, -1.46, 3.68, 2.08, 0.085);
  const green = tone("#617d6e"),
    greenDeep = tone("#335245");
  block(solid, white, -0.15, 2.23, -1.43, 3.7, 0.08, 0.13);
  block(solid, oak, -0.15, 2.18, -1.46, 3.7, 0.045, 0.13);

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

  // Printed label art repeats around tins. Each coffee sack has shoulder folds and a crimp.
  const wrappers = {};
  for (const key of ["sumatra", "breakfast", "pike", "tomato", "noodle"])
    wrappers[key] = photographedLabel(key + "-label.webp");
  wrappers.crackers = wrappers.wheat = photographedLabel("crackers-label.webp");
  wrappers.oat = photographedLabel("sugar-label.webp");
  wrappers.tea = photographedLabel("pudding_box.webp");
  wrappers.farro = photographedLabel("gelatin_box.webp");
  wrappers.chickpea = photographedLabel("tuna_fish_can.webp");
  wrappers.corn = photographedLabel("master_chef_can.webp");
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
    coffeeMats[key] = [
      wrappers[key],
      tone("#b3b4b0", { metalness: 0.31, roughness: 0.48 }),
    ];
  const folded = tone("#b8b9b6", { metalness: 0.38, roughness: 0.45 }),
    canLid = tone("#a9aaa1", { roughness: 0.38, metalness: 0.6 }),
    cupLid = tone("#982220");
  function makePack(parent, key, x, y, z, angle = 0) {
    const bag = ["sumatra", "breakfast", "pike"].includes(key);
    const tin = ["corn", "chickpea", "noodle", "tomato"].includes(key);
    const g = new T.Group();
    parent.add(g);
    g.position.set(x, y, z);
    g.rotation.y = angle;
    if (tin) {
      const cup = key === "tomato",
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
    } else if (bag) {
      mesh(g, bagGeo, coffeeMats[key], 0, 0, 0);
      block(g, folded, 0, 0.29, 0, 0.169, 0.009, 0.027);
    } else {
      const small = key === "tea" || key === "farro";
      const height = small ? 0.152 : key === "oat" ? 0.231 : 0.282;
      const width = small ? 0.181 : 0.169;
      block(g, paper, 0, height / 2, 0, width, height, 0.083);
      plane(g, wrappers[key], 0, height / 2, 0.042, width, height);
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
  // A contact shadow anchors each foreground package to the metal tray.
  const occlusion = texture(64, 64, (ctx, w, h) => {
    const gradient = ctx.createRadialGradient(
      w / 2,
      h / 2,
      2,
      w / 2,
      h / 2,
      w / 2,
    );
    gradient.addColorStop(0, "rgba(20,18,16,.49)");
    gradient.addColorStop(0.65, "rgba(23,21,17,.21)");
    gradient.addColorStop(1, "rgba(22,20,18,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  });
  const contactM = new T.MeshBasicMaterial({
    map: occlusion,
    transparent: true,
    depthWrite: false,
    toneMapped: false,
  });
  for (let level = 0; level < levels.length; level++)
    for (let lane = 0; lane < 15; lane++) {
      const shadow = plane(
        solid,
        contactM,
        -1.86 + lane * 0.225,
        levels[level] + 0.0251,
        -0.85,
        0.248,
        0.23,
      );
      shadow.rotation.x = -Math.PI / 2;
      shadow.receiveShadow = false;
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
  const hemi = new T.HemisphereLight("#f8f7ed", "#938d82", 0.95);
  scene.add(hemi);
  const sun = new T.DirectionalLight("#fcf8ee", 1.55);
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
  const fill = new T.DirectionalLight("#e7edf4", 0.55);
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
    yaw = 0.24,
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
  function placeMarker() {
    pointer.position.set(products[selected].x, heroY - 0.008, -0.69);
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
    const radius = (isShelf ? 1.65 : 3.97) * zoom * (aspect < 1.5 ? 1.13 : 1);
    goalAim.set(
      isShelf ? products[selected].x - 0.05 : -0.16,
      isShelf ? 1.2 : 1.23,
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
      progress = Math.min(1, (time - pickup.since) / 560);
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
      yaw = mode === "shelf" ? 0.14 : 0.24;
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
  assetsReady = true;
  restPose();
  placeMarker();
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
        yaw = activeView === "shelf" ? 0.14 : 0.24;
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
      placeMarker();
      setView(mode, false);
    },
    setView,
    pickup(done) {
      transition = null;
      restPose();
      placeMarker();
      if (reduced.matches) {
        progress = 1;
        setView("camera", false);
        done();
        schedule();
        return;
      }
      setView("camera", true);
      pickup = { since: performance.now(), done };
      schedule();
    },
  };
}
const root = document.getElementById("checkout-lab");
if (root) install(root);
