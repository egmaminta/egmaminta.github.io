// Replay the fitted model. All probabilities and patch similarities are recorded values.
(() => {
  'use strict';
  const data = appleTrace;
  const figure = document.getElementById('step-content');
  const nav = Array.from(document.querySelectorAll('.algorithm-nav [data-step]'));
  const nodes = Array.from(document.querySelectorAll('#pipeline [data-component]'));
  const returnLink = document.getElementById('return-pipeline');
  let selectedNode = null;
  const transport = document.querySelector('.transport');
  const play = document.getElementById('play');
  const back = document.getElementById('back');
  const next = document.getElementById('next');
  const position = document.getElementById('position');
  const pink = '#245da3',
    gala = '#a24a25';
  const pinkIndex = data.cands.indexOf(2),
    galaIndex = data.cands.indexOf(4);
  const last = data.trace.length - 1;
  const percent = (n) => (100 * n).toFixed(1) + '%';
  const name = (i) => data.names[data.cands[i]];
  const signed = (n) => (n < 0 ? '−' : '+') + Math.abs(n).toFixed(2);
  const shortPhoto = (file, alt, caption) =>
    '<figure class="frame-sample"><img width="348" height="348" src="./assets/' +
    file +
    '.webp" alt="' +
    alt +
    '"><figcaption>' +
    caption +
    '</figcaption></figure>';
  const trainingPhoto = () =>
    shortPhoto('apple-train', 'Red and yellow apples in a produce bin', 'Klasson training frame 029');
  const colorName = (i) => (i === pinkIndex ? 'pink' : i === galaIndex ? 'gala' : '');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const steps = [
    'Rank the catalog',
    'Ask the teacher',
    'Fit the label model',
    'Select training targets',
    'Train the reranker',
    'Identify a new frame',
  ];
  let step = 0,
    question = 0,
    iteration = 0,
    enabledTerms = [true, true, true, true, true];
  let threshold = 0.9,
    candidate = 0,
    epoch = 8,
    patch = 12 * 24 + 12,
    queryIndex = 0,
    coverage = data.queries[0].coverage;
  let playing = false,
    timer,
    playPart = 0;

  function chartRows(indexes, values, options = {}) {
    const { scale = 1, format = percent, previous = null } = options;
    return (
      '<table class="score-table" aria-label="' +
      options.label +
      '"><tbody>' +
      indexes
        .map((i) => {
          const width = Math.min(100, Math.max(0, (100 * values[i]) / scale));
          const from = previous ? Math.min(100, Math.max(0, (100 * previous[i]) / scale)) : 0;
          return (
            '<tr class="' +
            colorName(i) +
            '"><th scope="row">' +
            name(i) +
            '</th>' +
            '<td class="stick-col" aria-hidden="true"><span class="track"><span class="fill" data-start="' +
            from +
            '" style="width:' +
            width +
            '%"></span></span></td>' +
            '<td>' +
            format(values[i]) +
            '</td></tr>'
          );
        })
        .join('') +
      '</tbody></table>'
    );
  }
  function animateBars() {
    if (reduced.matches) return;
    figure.querySelectorAll('.fill').forEach((el) => {
      el.animate([{ width: el.dataset.start + '%' }, { width: el.style.width }], {
        duration: 540,
        easing: 'ease-out',
      });
    });
  }
  function intro(description) {
    return '<h3>' + steps[step] + '</h3><p>' + description + '</p>';
  }
  function showRank() {
    const indexes = data.cands.map((_, i) => i);
    figure.innerHTML =
      intro(
        'Frozen SigLIP2 represents the frame and each of the 81 catalog descriptions by a vector. It ranks the descriptions by cosine similarity. The ten entries below go to the teacher.',
      ) +
      '<div class="step-visual figure-pair">' +
      trainingPhoto() +
      '<div><div class="plot-title">Cosine similarity to the store frame</div>' +
      chartRows(indexes, data.cos, {
        label: 'Ten retrieval scores, in rank order',
        scale: 0.15,
        format: (n) => n.toFixed(3),
      }) +
      '</div></div>' +
      '<p class="step-note">Pink Lady leads Royal Gala by 0.015. These are similarities between whole images and descriptions.</p>';
    animateBars();
  }
  function showTeacher() {
    figure.innerHTML =
      intro(
        'Qwen3.8-27B answers a multiple choice question for each frame. If several entries remain plausible, we ask it again with pictures of those entries and verified descriptions of packaging cues when available.',
      ) +
      '<div class="field-line"><label for="question">Teacher input</label><select id="question"><option value="0">Question 1 (catalog descriptions)</option><option value="1">Question 2 (descriptions and pictures)</option></select></div>' +
      '<div id="teacher-art" class="step-visual"></div>';
    const control = document.getElementById('question');
    control.value = question;
    control.onchange = () => {
      stop();
      const old = question;
      question = Number(control.value);
      drawQuestion(old);
    };
    drawQuestion();
  }
  function drawQuestion(old) {
    const picture = question === 1,
      values = picture ? data.p2 : data.p1;
    const indexes = picture ? data.offered : data.cands.map((_, i) => i);
    const previous = old == null ? null : old === 0 ? data.p1 : data.p2;
    const options = picture
      ? '<div class="catalog-strip" aria-label="Four catalog pictures offered">' +
        data.offered
          .map(
            (i) =>
              '<figure><img src="./assets/catalog-' +
              data.cands[i] +
              '.webp" alt=""><figcaption>' +
              name(i) +
              '</figcaption></figure>',
          )
          .join('') +
        '</div>'
      : '';
    document.getElementById('teacher-art').innerHTML =
      '<div class="figure-pair">' +
      trainingPhoto() +
      '<div><div class="plot-title">Probability of each answer</div>' +
      chartRows(indexes, values, { previous, label: 'Teacher answer probabilities' }) +
      '</div></div>' +
      options +
      '<p class="step-note">' +
      (picture
        ? 'The preliminary temperature (β₀ = 138.7) gives four options on this frame. Even with the catalog pictures, the teacher assigns 81.0% to Royal Gala. We keep these options fixed during fitting.'
        : 'The teacher assigns 86.5% to Royal Gala. Across the training and validation pool, it names Royal Gala on 59 of 64 Pink Lady frames.') +
      '</p>';
    animateBars();
  }

  function showFit() {
    figure.innerHTML =
      intro(
        'The model alternates between estimating each frame’s product and updating the product directions and the teacher’s error rates. Each update also moves total probability mass toward equal coverage across products.',
      ) +
      '<div class="trace-plots"><figure><figcaption class="plot-title">Similarities to two product directions</figcaption><svg viewBox="0 0 278 188" id="cloud-plot" role="img" aria-label="Store frames plotted by their similarity to the fitted Pink Lady and Royal Gala directions"></svg></figure>' +
      '<figure><figcaption class="plot-title">Product probability for frame 029</figcaption><svg viewBox="0 0 310 188" id="em-plot" role="img" aria-label="Fitted probabilities for Pink Lady and Royal Gala over fifteen iterations"></svg></figure></div>' +
      '<div class="range-field"><label for="em-iteration">EM iteration</label><input type="range" id="em-iteration" min="0" max="' +
      last +
      '" step="1"><output for="em-iteration" id="em-read"></output></div>' +
      '<p class="live-reading" id="em-values"></p><p class="step-note">Each dot is one of 72 frames that shortlist both varieties. Position shows cosine similarity to each fitted cluster direction. Color shows which variety has more posterior mass at this iteration. The ring marks frame 029. The dashed line marks the 90% target threshold.</p>' +
      '<details class="disclosure"><summary>Inspect the evidence in this update</summary>' +
      '<p class="step-formula">log [P(Pink Lady) / P(Royal Gala)]</p>' +
      '<table class="evidence-table"><thead><tr><th scope="col">Term in the log odds</th><th scope="col">Contribution</th></tr></thead><tbody>' +
      [
        'Retriever scores',
        'Visual cluster (vMF)',
        'Text question',
        'Picture question',
        'Sinkhorn balancing',
      ]
        .map(
          (s, i) =>
            '<tr><th scope="row"><label><input type="checkbox" data-term="' +
            i +
            '"' +
            (enabledTerms[i] ? ' checked' : '') +
            '>' +
            s +
            '</label></th><td id="term-' +
            i +
            '"></td></tr>',
        )
        .join('') +
      '</tbody></table><p class="live-reading" id="term-result" role="status"></p>' +
      '<p class="step-note">Clear a term to recompute this frame’s probabilities over all ten candidates. The fitted parameters and the three balancing updates stay fixed. Positive log odds favor Pink Lady.</p></details>';
    const slider = document.getElementById('em-iteration');
    slider.value = iteration;
    slider.oninput = () => {
      stop();
      iteration = Number(slider.value);
      drawFit();
    };
    figure.querySelectorAll('[data-term]').forEach((el) => {
      el.onchange = () => {
        stop();
        enabledTerms[Number(el.dataset.term)] = el.checked;
        drawTerms();
      };
    });
    drawFit();
  }
  function cloudColor(diff) {
    const end = diff >= 0 ? [36, 93, 163] : [162, 74, 37];
    return 'rgb(' + end.map((n) => Math.round(207 + (n - 207) * Math.abs(diff))).join(',') + ')';
  }
  const cx = (v) => 37 + ((v - 0.8) / 0.2) * 220;
  const cy = (v) => 147 - ((v - 0.8) / 0.2) * 118;
  function drawCloud(snapshot) {
    const el = document.getElementById('cloud-plot');
    if (!el.firstChild) {
      const ticks = [0.8, 0.9, 1]
        .map(
          (v) =>
            '<path class="plot-grid" d="M37 ' +
            cy(v) +
            'H257 M' +
            cx(v) +
            ' 29V147"/><text class="plot-text" x="32" y="' +
            (cy(v) + 4) +
            '" text-anchor="end">' +
            v.toFixed(1) +
            '</text><text class="plot-text" x="' +
            cx(v) +
            '" y="163" text-anchor="middle">' +
            v.toFixed(1) +
            '</text>',
        )
        .join('');
      const [x, y] = data.cloud[data.point];
      el.innerHTML =
        ticks +
        '<path class="plot-axis" d="M37 29V147H257"/><text class="chart-label" x="37" y="17">Royal Gala cosine</text><text class="chart-label" x="257" y="183" text-anchor="end">Pink Lady cosine</text>' +
        data.cloud
          .map(
            ([x, y], i) =>
              '<circle class="cloud-point" data-dot="' +
              i +
              '" cx="' +
              cx(x) +
              '" cy="' +
              cy(y) +
              '" r="3.1"/>',
          )
          .join('') +
        '<circle cx="' +
        cx(x) +
        '" cy="' +
        cy(y) +
        '" r="6.4" fill="none" stroke="#171b21" stroke-width="1.7"/>';
    }
    el.querySelectorAll('[data-dot]').forEach((dot, i) =>
      dot.setAttribute('fill', cloudColor(snapshot.cloud[i])),
    );
  }
  function drawCurve() {
    const el = document.getElementById('em-plot');
    const x = (i) => 36 + (i / last) * 244,
      y = (value) => 147 - value * 118;
    function path(i, upto) {
      return data.trace
        .slice(0, upto + 1)
        .map((s, j) => (j ? 'L' : 'M') + x(j).toFixed(2) + ' ' + y(s.p[i]).toFixed(2))
        .join('');
    }
    if (!el.firstChild) {
      el.innerHTML =
        [0, 0.5, 1]
          .map(
            (v) =>
              '<path class="plot-grid" d="M36 ' +
              y(v) +
              'H280"/><text class="plot-text" x="30" y="' +
              (y(v) + 4) +
              '" text-anchor="end">' +
              v.toFixed(1) +
              '</text>',
          )
          .join('') +
        [0, 5, 10, 15]
          .map(
            (j) =>
              '<text class="plot-text" x="' + x(j) + '" y="163" text-anchor="middle">' + j + '</text>',
          )
          .join('') +
        '<path class="plot-axis" d="M36 29V147H280"/><path class="plot-threshold" d="M36 ' +
        y(0.9) +
        'H280"/><text class="plot-text" x="284" y="' +
        (y(0.9) + 3) +
        '">.9</text>' +
        '<text class="chart-label" x="36" y="17">Probability</text><text class="chart-label" x="280" y="183" text-anchor="end">Iteration</text>' +
        '<path id="cursor" stroke="#899198" stroke-dasharray="2 3"/>' +
        [pinkIndex, galaIndex]
          .map(
            (k, n) =>
              '<g stroke="' +
              [pink, gala][n] +
              '"><path class="iter-line" opacity=".24" d="' +
              path(k, last) +
              '"/><path class="iter-line" id="curve-' +
              n +
              '"/><circle id="point-' +
              n +
              '" r="4" fill="white" stroke-width="2"/></g>',
          )
          .join('');
    }
    document.getElementById('cursor').setAttribute('d', 'M' + x(iteration) + ' 29V147');
    [pinkIndex, galaIndex].forEach((k, n) => {
      document.getElementById('curve-' + n).setAttribute('d', path(k, iteration));
      const dot = document.getElementById('point-' + n);
      dot.setAttribute('cx', x(iteration));
      dot.setAttribute('cy', y(data.trace[iteration].p[k]));
    });
  }
  function drawTerms() {
    const terms = data.trace[iteration].terms;
    const logits = data.cands.map((_, c) =>
      terms.reduce((sum, row, t) => sum + (enabledTerms[t] ? row[c] : 0), 0),
    );
    const max = Math.max(...logits);
    const weights = logits.map((z) => Math.exp(z - max));
    const total = weights.reduce((sum, x) => sum + x, 0);
    terms.forEach((row, t) => {
      document.getElementById('term-' + t).textContent = signed(row[pinkIndex] - row[galaIndex]);
    });
    document.getElementById('term-result').textContent =
      'With the selected terms: Pink Lady ' +
      percent(weights[pinkIndex] / total) +
      ', Royal Gala ' +
      percent(weights[galaIndex] / total) +
      '.';
  }
  function drawFit() {
    const s = data.trace[iteration];
    document.getElementById('em-iteration').value = iteration;
    document.getElementById('em-read').textContent = iteration + ' / ' + last;
    document.getElementById('em-values').innerHTML =
      '<strong class="pink-text">Pink Lady ' +
      percent(s.p[pinkIndex]) +
      '</strong>, <strong class="gala-text">Royal Gala ' +
      percent(s.p[galaIndex]) +
      '</strong>';
    drawCloud(s);
    drawCurve();
    drawTerms();
  }

  function showTarget() {
    figure.innerHTML =
      intro(
        'A frame supplies a training target when its most probable entry has probability at least 0.90 and at least one source ranked that entry first.',
      ) +
      '<div class="step-visual figure-pair">' +
      trainingPhoto() +
      '<div><div class="plot-title">Top vote from each source</div><ul class="votes">' +
      [
        ['Frozen retriever', 'Pink Lady'],
        ['Teacher, text', 'Royal Gala'],
        ['Teacher, text + pictures', 'Royal Gala'],
      ]
        .map(
          ([l, v]) =>
            '<li><span>' +
            l +
            '</span><span class="' +
            (v === 'Pink Lady' ? 'pink' : 'gala') +
            '-text">' +
            v +
            '</span></li>',
        )
        .join('') +
      '</ul><p class="target-rule">Majority vote selects <strong>Royal Gala</strong>. The full label model selects <strong>Pink Lady</strong>.</p></div></div>' +
      '<div class="range-field"><label for="confidence">Acceptance threshold</label><input type="range" id="confidence" min=".5" max="1" step=".001" aria-describedby="threshold-note"><output for="confidence" id="confidence-read"></output></div>' +
      '<p id="target-decision" class="live-reading" role="status"></p><p id="threshold-note" class="step-note">At the paper’s threshold of 90%, 2,636 of 2,936 Klasson training and validation frames enter the training set. The slider tests the rule on this frame.</p>';
    const control = document.getElementById('confidence');
    control.value = threshold;
    control.oninput = () => {
      stop();
      threshold = Number(control.value);
      drawTarget();
    };
    drawTarget();
  }
  function drawTarget() {
    const posterior = data.trace[last].p[pinkIndex],
      keep = posterior >= threshold;
    document.getElementById('confidence-read').textContent = percent(threshold);
    document.getElementById('target-decision').innerHTML =
      '<strong>' +
      (keep ? 'Keep Pink Lady.' : 'Skip this frame.') +
      '</strong> Its probability is ' +
      (100 * posterior).toFixed(2) +
      '%' +
      (keep ? ' and it has the retriever’s vote.' : ', below the selected threshold.');
  }

  function showTrain() {
    figure.innerHTML =
      intro(
        'The reranker learns two linear maps into a shared space of 128 dimensions from the retained targets. Each of the 576 image patches takes its highest cosine similarity with a token in the candidate’s description. The mean of those 576 matches is the product’s score.',
      ) +
      '<div class="field-line"><label for="description-choice">Candidate description</label><select id="description-choice"><option value="0">Pink Lady, Apple</option><option value="1">Royal Gala, Apple</option></select><label for="train-epoch">Checkpoint</label><select id="train-epoch"><option value="3">Epoch 3</option><option value="8">Epoch 8</option></select></div>' +
      '<div class="step-visual patch-layout"><div><div class="patch-figure"><img src="./assets/apple-train.webp" width="348" height="348" alt="Apples in the training frame"><svg viewBox="0 0 240 240" id="patch-grid" tabindex="0" role="slider" aria-label="Image patch" aria-valuemin="1" aria-valuemax="576" aria-describedby="patch-guide">' +
      '<defs><pattern id="patch-lines" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" stroke="white" opacity=".38" fill="none" stroke-width=".6"/></pattern></defs><rect width="240" height="240" fill="url(#patch-lines)"/><g id="active-patch"><rect width="10" height="10" fill="none" stroke="#141414" stroke-width="3.5"/><rect width="10" height="10" fill="none" stroke="white" stroke-width="1.6"/></g></svg></div><div class="patch-legend">24 × 24 image patches</div></div>' +
      '<div><div class="plot-title">Patch–token cosine similarities</div><div id="patch-index" class="patch-index"></div><div id="tokens" class="patch-bars"></div><p id="patch-mean" class="step-note"></p></div></div>' +
      '<p id="patch-guide" class="step-note">Point to a patch, tap it, or use the arrow keys on the image. EOS is the end token. The token embeddings encode the whole description.</p>' +
      '<p class="step-formula">s<sub>1</sub>(x, c) = (1 / 576) Σ<sub>i</sub> max<sub>j</sub> cos(v<sub>i</sub>, u<sub>cj</sub>)</p>' +
      '<p class="step-note" id="training-loss"></p>';
    const select = document.getElementById('description-choice');
    select.value = candidate;
    select.onchange = () => {
      stop();
      candidate = Number(select.value);
      drawPatch();
    };
    const checkpoint = document.getElementById('train-epoch');
    checkpoint.value = epoch;
    checkpoint.onchange = () => {
      stop();
      epoch = Number(checkpoint.value);
      drawPatch();
    };
    const grid = document.getElementById('patch-grid');
    const pick = (e) => {
      const b = grid.getBoundingClientRect();
      const col = Math.min(23, Math.max(0, Math.floor(((e.clientX - b.left) / b.width) * 24)));
      const row = Math.min(23, Math.max(0, Math.floor(((e.clientY - b.top) / b.height) * 24)));
      stop();
      patch = row * 24 + col;
      drawPatch();
    };
    grid.onpointerdown = pick;
    grid.onpointermove = (e) => {
      if (e.pointerType === 'mouse') pick(e);
    };
    grid.onkeydown = (e) => {
      const row = Math.floor(patch / 24),
        col = patch % 24;
      const destination = {
        ArrowLeft: row * 24 + Math.max(0, col - 1),
        ArrowRight: row * 24 + Math.min(23, col + 1),
        ArrowUp: Math.max(0, row - 1) * 24 + col,
        ArrowDown: Math.min(23, row + 1) * 24 + col,
        Home: 0,
        End: 575,
      };
      if (!(e.key in destination)) return;
      e.preventDefault();
      e.stopPropagation();
      stop();
      patch = destination[e.key];
      drawPatch();
    };
    drawPatch();
  }
  function drawPatch() {
    const row = Math.floor(patch / 24),
      col = patch % 24,
      info = data.checkpoints[epoch].patch[candidate];
    const values = info.tokens.map((_, j) => info.values[patch * info.tokens.length + j] / 10000);
    const best = values.indexOf(Math.max(...values)),
      coord = 'Row ' + (row + 1) + ', column ' + (col + 1);
    document.getElementById('patch-grid').setAttribute('aria-valuenow', patch + 1);
    document
      .getElementById('patch-grid')
      .setAttribute(
        'aria-valuetext',
        coord + ', best match ' + info.tokens[best] + ', cosine ' + values[best].toFixed(3),
      );
    document
      .getElementById('active-patch')
      .setAttribute('transform', 'translate(' + col * 10 + ' ' + row * 10 + ')');
    document.getElementById('patch-index').textContent = coord;
    document.getElementById('tokens').innerHTML = info.tokens
      .map((t, j) => {
        const offset = values[j] * 50;
        return (
          '<div class="token-row' +
          (j === best ? ' best' : '') +
          '"><span>' +
          t +
          '</span><span class="token-track" aria-hidden="true"><i style="left:' +
          Math.min(50, 50 + offset) +
          '%;width:' +
          Math.abs(offset) +
          '%"></i></span><span>' +
          values[j].toFixed(3) +
          '</span></div>'
        );
      })
      .join('');
    document.getElementById('training-loss').textContent =
      'At epoch ' +
      epoch +
      ' of draw four, the cross-entropy loss for this frame is ' +
      data.checkpoints[epoch].loss.toFixed(3) +
      '. Its denominator includes all ten standardized candidate scores.';
    document.getElementById('patch-mean').textContent =
      'Best token here: ' +
      info.tokens[best] +
      '. Mean of the best matches over all patches: ' +
      info.mean.toFixed(4) +
      '.';
  }

  function showQuery() {
    figure.innerHTML =
      intro(
        'On a new frame, the frozen retriever builds a shortlist using the fitted temperature (β = 89.8). It returns its first choice if the shortlist has one entry or that choice has too few retained training targets. Otherwise the slow thinker reranks the shortlist.',
      ) +
      '<div class="field-line"><label for="test-frame">Held-out query</label><select id="test-frame"><option value="0">Frame 050 (four candidates)</option><option value="1">Frame 022 (one candidate)</option></select></div>' +
      '<div id="query-art" class="step-visual"></div>';
    const sel = document.getElementById('test-frame');
    sel.value = queryIndex;
    sel.onchange = () => {
      stop();
      queryIndex = Number(sel.value);
      coverage = data.queries[queryIndex].coverage;
      drawQuery();
    };
    drawQuery();
  }
  function drawQuery() {
    const q = data.queries[queryIndex];
    document.getElementById('query-art').innerHTML =
      '<div class="figure-pair">' +
      shortPhoto(
        q.photo,
        'A new photograph of Pink Lady apples',
        'Klasson test frame ' + (queryIndex ? '022' : '050'),
      ) +
      '<div><table class="query-table"><thead><tr><th scope="col">Shortlist</th><th scope="col">Cosine</th><th scope="col">Reranker</th></tr></thead><tbody>' +
      q.candidates
        .map(
          (c, i) =>
            '<tr><th scope="row">' +
            c +
            '</th><td>' +
            q.cos[i].toFixed(4) +
            '</td><td data-prob="' +
            i +
            '"></td></tr>',
        )
        .join('') +
      '</tbody></table></div></div><div class="range-field"' +
      (queryIndex === 1 ? ' hidden' : '') +
      '><label for="coverage">Targets for ' +
      q.candidates[0] +
      '</label><input type="range" id="coverage" min="0" max="' +
      q.coverage +
      '" step="1"><output id="coverage-read" for="coverage"></output></div>' +
      '<p id="route" class="live-reading" role="status"></p><p class="step-note">' +
      (queryIndex === 0
        ? 'The run retained 50 Royal Gala targets. Move the slider below five to test the cold-start branch at k = 5. All thresholds tested (0, 1, 3, 5, 10) give the same full-pool recall on Klasson.'
        : 'The only shortlisted entry is Pink Lady. Its coverage is immaterial for this branch.') +
      '</p>';
    const slider = document.getElementById('coverage');
    slider.value = coverage;
    slider.oninput = () => {
      stop();
      coverage = Number(slider.value);
      drawRoute();
    };
    drawRoute();
  }
  function drawRoute() {
    const q = data.queries[queryIndex],
      singleton = q.candidates.length === 1,
      useSlow = !singleton && coverage >= 5;
    document.getElementById('coverage-read').textContent = coverage;
    figure.querySelectorAll('[data-prob]').forEach((el) => {
      el.textContent = useSlow ? percent(q.p[Number(el.dataset.prob)]) : '—';
    });
    const text = useSlow
      ? 'The slow thinker returns Pink Lady (90.2%).'
      : singleton
        ? 'One candidate remains. The fast thinker returns Pink Lady.'
        : 'Coverage is below five. The fast thinker returns Royal Gala.';
    document.getElementById('route').innerHTML =
      '<strong>' + text + '</strong> The photographed variety is Pink Lady.';
  }

  const drawStage = [showRank, showTeacher, showFit, showTarget, showTrain, showQuery];
  const instructions = [
    ['1', 'O₁(x) ← top 10 catalog entries by cosine'],
    ['1–5', 'if |S₀(x)| ≥ 2: query p₂ on S₀(x)'],
    ['6', 'r, β ← fit(s, f, p₁, p₂)'],
    ['7', 'keep x if max(r) ≥ 0.90 and argmax(r) ∈ V(x)'],
    ['8', 'minimize cross-entropy over O₁(x)'],
    ['9–13', 'if |S(x)| = 1 or n(h₀(x)) < k: return h₀(x)'],
  ];
  function lineOfAlgorithm() {
    const line = document.getElementById('current-line');
    line.replaceChildren();
    const link = document.createElement('a');
    link.href = './assets/shelftaught.pdf#page=4';
    link.textContent =
      'Pseudocode, ' +
      (instructions[step][0].includes('–') ? 'lines ' : 'line ') +
      instructions[step][0];
    const code = document.createElement('code');
    code.textContent = instructions[step][1];
    line.append(link, code);
    line.hidden = false;
  }
  function render() {
    nav.forEach((b, i) => {
      if (i === step) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
    });
    drawStage[step]();
    nodes.forEach((node) => {
      if (node.dataset.component === selectedNode) node.setAttribute('aria-current', 'true');
      else node.removeAttribute('aria-current');
    });
    document.querySelectorAll('#pipeline [data-connects]').forEach((edge) => {
      edge.classList.toggle('selected-edge', edge.dataset.connects.split(' ').includes(selectedNode));
    });
    returnLink.hidden = !selectedNode;
    const context = document.getElementById('component-context');
    context.hidden = !selectedNode;
    if (selectedNode) context.textContent = components[selectedNode][1];
    lineOfAlgorithm();
    back.disabled = step === 0;
    next.disabled = step === steps.length - 1;
    position.textContent = 'Step ' + (step + 1) + ' of ' + steps.length;
    play.textContent = playing ? 'Pause' : step === steps.length - 1 ? 'Replay' : 'Play';
  }
  function stop() {
    clearTimeout(timer);
    playing = false;
    play.textContent = step === steps.length - 1 ? 'Replay' : 'Play';
  }
  const iterationStops = [1, 2, 4, 8, 15];
  const tour = [
    [{ delay: 3500 }],
    [
      { delay: 2700 },
      {
        delay: 3400,
        act: () => {
          question = 1;
          document.getElementById('question').value = 1;
          drawQuestion(0);
        },
      },
    ],
    [
      { delay: 1500 },
      ...iterationStops.map((t) => ({
        delay: t === 15 ? 2800 : 1000,
        act: () => {
          iteration = t;
          drawFit();
        },
      })),
    ],
    [{ delay: 3800 }],
    [
      { delay: 2300 },
      ...[82, 303, 441].map((p) => ({
        delay: 1500,
        act: () => {
          patch = p;
          drawPatch();
        },
      })),
    ],
    [{ delay: 4200 }],
  ];
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (!playing) return;
      if (playPart + 1 < tour[step].length) {
        playPart++;
        tour[step][playPart].act();
        schedule();
        return;
      }
      if (step === steps.length - 1) {
        stop();
        return;
      }
      step++;
      selectedNode = null;
      playPart = 0;
      if (step === 1) question = 0;
      if (step === 2) {
        iteration = 0;
        enabledTerms.fill(true);
      }
      if (step === 3) threshold = 0.9;
      if (step === 5) {
        queryIndex = 0;
        coverage = data.queries[0].coverage;
      }
      render();
      schedule();
    }, tour[step][playPart].delay);
  }
  function go(i, component = null) {
    stop();
    selectedNode = component;
    step = Math.min(steps.length - 1, Math.max(0, i));
    playPart = 0;
    render();
  }
  const components = {
    query: [5, 'Checkout input. Frame 050 is a photograph the reranker did not see during training.'],
    fast: [5, 'Fast thinker. The frozen retriever puts Royal Gala first. Four entries survive its calibrated shortlist.'],
    gate: [5, 'Coverage gate. Change the number of training targets to see which model answers this query.'],
    shortcut: [5, 'Direct return. For frame 022, the shortlist already contains a single catalog entry.'],
    slow: [4, 'Slow thinker. Select a patch to inspect the token similarities produced by the trained projections.'],
    output: [5, 'Catalog entry. Compare the frozen scores with the final ordering for frame 050.'],
    frames: [0, 'Offline input. Frame 029 enters adaptation as an unlabeled image, with one frozen retrieval score per catalog entry.'],
    q1: [1, 'First teacher question. Each of the ten catalog descriptions is an answer option.'],
    q2: [1, 'Second teacher question. This frame had several plausible entries. The teacher sees catalog photographs of the candidates in its preliminary shortlist.'],
    label: [2, 'Label model. Move the iteration slider to see how the evidence changes the inferred product identity.'],
    targets: [3, 'Training targets. A frame is retained when the posterior passes the threshold and at least one source names that entry.'],
  };
  nodes.forEach((node) => {
    node.setAttribute('aria-controls', 'step-content');
    node.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
      event.preventDefault();
      const key = node.dataset.component;
      const [stage] = components[key];
      if (stage === 5) {
        queryIndex = key === 'shortcut' ? 1 : 0;
        coverage = data.queries[queryIndex].coverage;
      }
      if (stage === 1) question = key === 'q2' ? 1 : 0;
      if (stage === 2) {
        iteration = last;
        enabledTerms.fill(true);
      }
      if (stage === 3) threshold = 0.9;
      if (stage === 4) {
        epoch = 8;
        candidate = 0;
      }
      go(stage, key);
      figure.focus({ preventScroll: true });
      document.getElementById('component-context').scrollIntoView({ block: 'start' });
    });
  });
  returnLink.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
    const visible = nodes.find((node) => node.dataset.component === selectedNode && node.getClientRects().length);
    if (!visible) return;
    event.preventDefault();
    document.getElementById('pipeline').scrollIntoView({ block: 'start' });
    visible.focus({ preventScroll: true });
  });
  nav.forEach((b, i) => {
    b.setAttribute('aria-controls', 'step-content');
    b.onclick = () => go(i);
  });
  back.onclick = () => go(step - 1);
  next.onclick = () => go(step + 1);
  play.onclick = () => {
    if (playing) {
      stop();
      return;
    }
    if (step === steps.length - 1) {
      go(0);
    }
    if (step === 1) playPart = question === 1 ? 1 : 0;
    if (step === 2) playPart = iterationStops.filter((i) => i <= iteration).length;
    playing = true;
    play.textContent = 'Pause';
    schedule();
  };
  document.getElementById('algorithm').addEventListener('keydown', (e) => {
    if (e.altKey || e.metaKey || e.ctrlKey || e.target.closest('input,select,summary,[role="slider"]'))
      return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      go(step + (e.key === 'ArrowRight' ? 1 : -1));
    }
  });
  const jumpToFit = () => go(2);
  document.querySelector('a[href="#label-model"]').addEventListener('click', jumpToFit);
  window.addEventListener('hashchange', () => {
    if (location.hash === '#label-model') jumpToFit();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop();
  });
  document.querySelector('.algorithm-nav').hidden = false;
  transport.hidden = false;
  if (location.hash === '#label-model') step = 2;
  render();
})();
