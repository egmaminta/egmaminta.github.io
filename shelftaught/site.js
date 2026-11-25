"use strict";

const select = (selector, parent = document) => parent.querySelector(selector);
const selectAll = (selector, parent = document) => [...parent.querySelectorAll(selector)];

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function button(label, handler) {
  const node = element("button", "", label);
  node.type = "button";
  node.addEventListener("click", handler);
  return node;
}

function drawClusters() {
  const plot = select("#cluster-plot");
  const clusters = [
    { x: 25, y: 61, color: "#e8f788" },
    { x: 54, y: 33, color: "#8de3d1" },
    { x: 77, y: 66, color: "#ffc58d" },
  ];
  let seed = 279;
  function random() {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  }
  for (const cluster of clusters) {
    for (let index = 0; index < 16; index++) {
      const dot = element("span", "cluster-dot");
      const angle = random() * Math.PI * 2;
      const spread = Math.sqrt(random());
      dot.style.setProperty("--x", (cluster.x + Math.cos(angle) * spread * 12) + "%");
      dot.style.setProperty("--y", (cluster.y + Math.sin(angle) * spread * 19) + "%");
      dot.style.setProperty("--start-x", (12 + 74 * random()) + "%");
      dot.style.setProperty("--start-y", (12 + 74 * random()) + "%");
      dot.style.setProperty("--dot", cluster.color);
      plot.append(dot);
    }
  }
}

function setupExplainer() {
  const root = select("#explainer");
  const chapters = selectAll("[data-chapter]", root);
  const scenes = selectAll("[data-scene]", root);
  const play = select("#play-explainer", root);
  const previous = select("#previous-scene", root);
  const next = select("#next-scene", root);
  const count = select("#chapter-count", root);
  const progress = select(".chapter-progress span", root);
  const duration = 8500;
  let current = 0;
  let timer;
  let finished = false;

  function show(index) {
    current = index;
    scenes.forEach((scene, i) => { scene.hidden = i !== current; });
    chapters.forEach((chapter, i) => {
      if (i === current) chapter.setAttribute("aria-current", "step");
      else chapter.removeAttribute("aria-current");
    });
    previous.disabled = current === 0;
    next.disabled = current === scenes.length - 1;
    count.textContent = (current + 1) + " of " + scenes.length;
    progress.style.width = ((current + 1) / scenes.length * 100) + "%";
  }

  function stop() {
    clearInterval(timer);
    timer = undefined;
    play.textContent = finished ? "Replay explainer" : "Play explainer";
  }

  function go(index) {
    finished = false;
    stop();
    show(index);
  }

  drawClusters();
  chapters.forEach((chapter, index) => chapter.addEventListener("click", () => go(index)));
  previous.addEventListener("click", () => go(current - 1));
  next.addEventListener("click", () => go(current + 1));
  play.addEventListener("click", () => {
    if (timer !== undefined) {
      stop();
      return;
    }
    if (finished) {
      show(0);
      finished = false;
    }
    play.textContent = "Pause";
    timer = setInterval(() => {
      if (current === scenes.length - 1) {
        finished = true;
        stop();
      } else {
        show(current + 1);
      }
    }, duration);
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && timer !== undefined) stop();
  });
  show(0);
}

function setupQuiz() {
  const tabs = select("#case-buttons");
  const tally = select("#quiz-tally");
  const photo = select("#quiz-photo");
  const title = select("#case-title");
  const options = select("#case-choices");
  const feedback = select("#case-result");
  const reset = select("#quiz-reset");
  const advance = select("#quiz-next");
  const note = select("#quiz-note");
  const guesses = new Map();
  let current = 0;

  const tabButtons = shelfCases.map((example, index) => button(example.title, () => showCase(index)));
  tabs.append(...tabButtons);

  function showTally() {
    const played = shelfCases.filter(example => guesses.has(example.id));
    reset.hidden = !played.length;
    if (!played.length) {
      tally.textContent = "0 of " + shelfCases.length + " played";
      return;
    }
    const human = played.filter(example => guesses.get(example.id) === example.gold).length;
    const fast = played.filter(example => example.fast === example.gold).length;
    const slow = played.filter(example => example.slow === example.gold).length;
    tally.textContent = "You " + human + "/" + played.length + " · Fast " + fast + "/" + played.length + " · Slow " + slow + "/" + played.length;
  }

  function showFeedback() {
    const example = shelfCases[current];
    const answered = guesses.has(example.id);
    const guess = guesses.get(example.id);
    const correct = example.choices[example.gold];
    advance.hidden = !answered || guesses.size === shelfCases.length;
    feedback.replaceChildren();

    selectAll(".case-choice", options).forEach((choice, index) => {
      choice.setAttribute("aria-pressed", String(answered && index === guess));
      choice.setAttribute("aria-disabled", String(answered));
      choice.classList.toggle("correct", answered && index === example.gold);
      choice.classList.toggle("miss", answered && index === guess && guess !== example.gold);
      const state = select(".choice-state", choice);
      state.textContent = answered && index === example.gold
        ? index === guess ? "Correct · Your pick" : "Correct product"
        : answered && index === guess ? "Your pick" : "";
    });

    if (answered) {
      const heading = element("p", "", guess === example.gold ? correct + " is right." : "The matching entry is " + correct.toLowerCase() + ".");
      const fast = example.choices[example.fast];
      const slow = example.choices[example.slow];
      const summary = element("p", "case-summary", "Fast thinker: " + fast + ". Slow thinker: " + slow + ".");
      const detail = element("p", "case-confidence",
        "Reranker probabilities: " + example.choices.map((name, index) => name + " " + example.probabilities[index].toFixed(1) + "%").join(" · ") +
        (example.shortlist > example.choices.length ? ". Figure 3 shows two of " + example.shortlist + " shortlisted entries." : "."));
      feedback.append(heading, summary, detail);
    }
    note.textContent = guesses.size === shelfCases.length
      ? "All cases answered. Reset to play again."
      : "Recorded predictions from Figure 3.";
    showTally();
  }

  function showCase(index) {
    current = index;
    const example = shelfCases[current];
    tabButtons.forEach((tab, i) => tab.setAttribute("aria-current", String(i === current)));
    photo.src = "./assets/" + example.frame + ".webp";
    photo.alt = "Store frame of " + example.title + " held by a shopper.";
    title.textContent = "Which " + (example.id === "pickles" ? "jar" : "variant") + " matches the frame?";
    const choices = example.choices.map((name, i) => {
      const option = button("", () => {
        if (!guesses.has(example.id)) {
          guesses.set(example.id, i);
          showFeedback();
        }
      });
      option.className = "case-choice";
      const image = element("img");
      image.src = "./assets/" + example.id + "-" + i + ".webp";
      image.alt = "";
      image.width = 220;
      image.height = 162;
      option.append(image, element("span", "", name), element("span", "choice-state", ""));
      return option;
    });
    options.replaceChildren(...choices);
    showFeedback();
  }

  advance.addEventListener("click", () => {
    const next = shelfCases.findIndex(example => !guesses.has(example.id));
    if (next >= 0) {
      showCase(next);
      tabButtons[next].focus();
    }
  });
  reset.addEventListener("click", () => {
    guesses.clear();
    showCase(0);
    tabButtons[0].focus();
  });
  showCase(0);
}

function setupResults() {
  const controls = select("#dataset-buttons");
  const chart = select("#dataset-chart");
  const table = select("#benchmark-table");
  const datasets = selectAll("thead th", table).slice(1).map(cell => cell.textContent);
  const rows = selectAll("tbody tr", table).map(row => ({
    id: row.dataset.method,
    name: row.cells[0].textContent,
    values: [...row.cells].slice(1).map(cell => Number(cell.textContent)),
  }));
  const toggles = datasets.map((dataset, index) => button(dataset, () => show(index)));
  controls.append(...toggles);

  function show(index) {
    toggles.forEach((toggle, i) => toggle.setAttribute("aria-pressed", String(index === i)));
    const heading = element("h3", "chart-title", datasets[index] + " · Recall@1");
    const bars = rows.map(row => {
      const value = row.values[index].toFixed(1) + "%";
      const bar = element("div", "chart-bar");
      bar.dataset.method = row.id;
      const track = element("span", "track");
      const fill = element("span", "fill");
      track.setAttribute("aria-hidden", "true");
      fill.style.setProperty("--score", value);
      track.append(fill);
      bar.append(element("span", "", row.name), track, element("b", "", value));
      return bar;
    });
    const fast = rows.find(row => row.id === "fast").values[index];
    const ours = rows.find(row => row.id === "shelftaught").values[index];
    const better = rows.some(row => row.values[index] > ours);
    const footer = "+" + (ours - fast).toFixed(1) + " percentage points over the fast thinker." +
      (better ? " TransCLIP with teacher answers leads this benchmark." : "");
    chart.replaceChildren(heading, ...bars, element("p", "chart-delta", footer));
  }
  show(0);
}

function setupCitation() {
  const control = select("#copy-citation");
  if (!navigator.clipboard) return;
  const text = select("#bibtex");
  control.hidden = false;
  control.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text.textContent.trim() + "\n");
      control.textContent = "Copied";
    } catch {
      const range = document.createRange();
      range.selectNodeContents(text);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      control.textContent = "BibTeX selected";
    }
    setTimeout(() => { control.textContent = "Copy BibTeX"; }, 2400);
  });
}

function setupCoverageGate() {
  const controls = select("#gate-control");
  const slider = select("#coverage-slider");
  const count = select("#coverage-count");
  const choice = select("#gate-choice");
  const scores = select(".rerank-art .scene-scores");
  const grid = select(".rerank-art .patch-grid");
  controls.hidden = false;
  slider.addEventListener("input", () => {
    const covered = slider.valueAsNumber >= 5;
    count.value = slider.value;
    scores.hidden = !covered;
    choice.hidden = covered;
    grid.hidden = !covered;
  });
}

setupExplainer();
setupCoverageGate();
setupQuiz();
setupResults();
setupCitation();
