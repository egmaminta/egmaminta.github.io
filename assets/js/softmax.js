(() => {
  'use strict';
  const figure = document.getElementById('softmax-margin-figure');
  if (!figure) return;
  const slider = figure.querySelector('input');
  const format = (value) => value === 0 ? '0' : value.toExponential(3).replace('-', '−');
  const render = (row) => {
    figure.querySelector('[data-margin]').textContent = row.margin.toFixed(2);
    for (const method of ['standard', 'reformulated']) {
      figure.querySelector(`[data-${method}-loss]`).textContent = format(row[`${method}_loss`]);
      figure.querySelector(`[data-${method}-target]`).textContent = format(row[`${method}_gradient`][0]);
      figure.querySelector(`[data-${method}-other]`).textContent = format(row[`${method}_gradient`][1]);
    }
    figure.querySelector('[data-status]').textContent = row.standard_gradient[0] === 0
      ? 'The standard target gradient is zero. Its competitor gradient remains positive.'
      : 'Both calculations retain a negative target gradient at this score gap.';
  };
  fetch(figure.dataset.results)
    .then((response) => {
      if (!response.ok) throw new Error('Measurement file unavailable');
      return response.json();
    })
    .then((rows) => {
      if (!Array.isArray(rows) || rows.length !== 121 || rows.some((row, index) =>
        row.margin !== index / 4 || !Number.isFinite(row.standard_loss) ||
        !Number.isFinite(row.reformulated_loss) ||
        !Array.isArray(row.standard_gradient) || row.standard_gradient.length !== 2 ||
        !Array.isArray(row.reformulated_gradient) || row.reformulated_gradient.length !== 2 ||
        [...row.standard_gradient, ...row.reformulated_gradient].some((x) => !Number.isFinite(x)))) {
        throw new Error('Unexpected measurement format');
      }
      const update = () => render(rows[Math.round(Number(slider.value) * 4)]);
      slider.addEventListener('input', update);
      update();
      figure.querySelector('.softmax-controls').hidden = false;
    })
    .catch(() => { /* The saved example and figure remain readable. */ });
})();
