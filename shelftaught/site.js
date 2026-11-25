(() => {
  'use strict';
  const select = document.getElementById('quiz-example');
  const display = document.getElementById('quiz-display');
  const answer = document.getElementById('quiz-answer');
  const actions = document.getElementById('quiz-actions');
  const next = document.getElementById('quiz-next');
  const reset = document.getElementById('quiz-reset');
  let current = 0;
  const answers = shelfCases.map(() => null);
  shelfCases.forEach((c, i) => select.add(new Option(c.title, i)));
  function score() {
    const count = answers.filter((a) => a !== null).length;
    const correct = answers.filter((a, i) => a === shelfCases[i].gold).length;
    return count ? correct + ' correct in ' + count + ' answered' : '';
  }
  function show() {
    const c = shelfCases[current],
      chosen = answers[current],
      done = chosen !== null;
    select.value = current;
    display.innerHTML =
      '<div class="quiz-photos"><figure class="quiz-photo"><img src="./assets/' +
      c.frame +
      '.webp" alt="' +
      c.title +
      ' in a shopper’s hand"><figcaption>Store frame</figcaption></figure>' +
      c.choices
        .map(
          (label, i) =>
            '<div class="quiz-photo"><img src="./assets/' +
            c.id +
            '-' +
            i +
            '.webp" alt="Catalog photograph of ' +
            label +
            '"><button class="quiz-option" type="button" data-choice="' +
            i +
            '" aria-pressed="' +
            (chosen === i) +
            '"' +
            (done ? ' disabled' : '') +
            '>' +
            label +
            '</button></div>',
        )
        .join('') +
      '</div>';
    display.querySelectorAll('[data-choice]').forEach((b) => {
      b.onclick = () => {
        answers[current] = Number(b.dataset.choice);
        show();
        (next.hidden ? reset : next).focus({ preventScroll: true });
      };
    });
    if (done) {
      const first = c.choices[c.fast],
        second = c.choices[c.slow];
      answer.innerHTML =
        '<p><strong>' +
        (chosen === c.gold ? 'Correct.' : 'The matching entry is ' + c.choices[c.gold] + '.') +
        '</strong> The fast thinker chose ' +
        first +
        '. The slow thinker chose ' +
        second +
        ' (' +
        c.probabilities[c.slow].toFixed(1) +
        '%).</p><p>' +
        (c.shortlist > 2 ? 'Two of the four shortlisted entries are pictured. ' : '') +
        'The probabilities and choices are from Figure 3, one run on the held-out brand.</p>';
    } else {
      answer.textContent = '';
    }
    document.getElementById('quiz-score').textContent = score();
    actions.hidden = !done;
    next.hidden = answers.every((a) => a !== null);
  }
  select.onchange = () => {
    current = Number(select.value);
    show();
  };
  next.onclick = () => {
    for (let i = 1; i <= shelfCases.length; i++) {
      const n = (current + i) % shelfCases.length;
      if (answers[n] === null) {
        current = n;
        break;
      }
    }
    show();
    display.querySelector('button').focus({ preventScroll: true });
  };
  reset.onclick = () => {
    answers.fill(null);
    current = 0;
    show();
    select.focus({ preventScroll: true });
  };
  document.getElementById('quiz-controls').hidden = false;
  show();

  const copy = document.getElementById('copy');
  const bib = document.getElementById('bibtex');
  copy.hidden = false;
  copy.onclick = async () => {
    try {
      await navigator.clipboard.writeText(bib.textContent);
      copy.textContent = 'Copied';
    } catch {
      const range = document.createRange();
      range.selectNodeContents(bib);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      copy.textContent = 'Text selected';
    }
    setTimeout(() => {
      copy.textContent = 'Copy';
    }, 2200);
  };
})();
