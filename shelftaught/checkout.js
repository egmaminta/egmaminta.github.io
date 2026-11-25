// Recorded GroceryVision queries. Each row is a catalog entry offered to the reranker.
(() => {
  'use strict';
  const products = {
    beans: {
      photo: 'beans-frame',
      alt: 'A shopper holding a box of 365 Organic Garbanzo Beans',
      entries: [
        { name: 'Can', photo: 'beans-can', cosine: 0.21993, probability: 0.0482982 },
        { name: 'Box', photo: 'beans-box', cosine: 0.21829, probability: 0.9194816 },
        { name: 'Bag', photo: 'beans-bag', cosine: 0.18400, probability: 0.0322202 },
      ],
      firstCart: 'The cart records a can. The shopper is holding a box.',
      finalCart: 'The reranker changes the cart entry to the box the shopper picked up.',
    },
    ranch: {
      photo: 'ranch-frame',
      alt: 'A shopper holding a Hidden Valley Ranch bottle with a green cap',
      entries: [
        { name: 'Blue cap', photo: 'ranch-blue', cosine: 0.17355, probability: 0.0924533 },
        { name: 'Green cap', photo: 'ranch-green', cosine: 0.17092, probability: 0.9075468 },
      ],
      firstCart: 'The cart records the blue-cap bottle. The cap in the store frame is green.',
      finalCart: 'The reranker changes the cart entry to the green-cap bottle.',
    },
  };
  const select = document.getElementById('checkout-item');
  const button = document.getElementById('checkout-action');
  const photo = document.getElementById('checkout-photo');
  const ranking = document.getElementById('checkout-ranking');
  const cart = document.getElementById('checkout-cart');
  let phase = 0;

  function render() {
    const product = products[select.value];
    photo.src = './assets/' + product.photo + '.webp';
    photo.alt = product.alt;
    const order = product.entries.slice();
    if (phase === 0) order.sort((a, b) => a.name.localeCompare(b.name));
    else if (phase === 2) order.sort((a, b) => b.probability - a.probability);

    const table = document.createElement('table');
    table.className = 'cart-table';
    const caption = table.createCaption();
    caption.textContent = ['Catalog entries', 'First pass', 'Reranked shortlist'][phase];
    const header = table.createTHead().insertRow();
    ['Package', ['', 'Cosine similarity', 'Probability'][phase]].forEach((label) => {
      if (!label) return;
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      header.append(th);
    });
    const body = table.createTBody();
    order.forEach((entry, index) => {
      const row = body.insertRow();
      const th = document.createElement('th');
      th.scope = 'row';
      const packshot = new Image(44, 44);
      packshot.src = './assets/' + entry.photo + '.webp';
      packshot.alt = '';
      th.append(packshot, document.createTextNode(entry.name));
      row.append(th);
      if (phase > 0) {
        row.insertCell().textContent = phase === 1
          ? entry.cosine.toFixed(4)
          : (100 * entry.probability).toFixed(1) + '%';
        if (index === 0) row.className = phase === 1 ? 'first-choice' : 'final-choice';
      }
    });
    ranking.replaceChildren(table);
    cart.textContent = ['Ready to scan.', product.firstCart, product.finalCart][phase];
    button.textContent = ['Scan product', 'Rerank shortlist', 'Scan again'][phase];
  }
  select.addEventListener('change', () => {
    phase = 0;
    render();
  });
  button.addEventListener('click', () => {
    phase = (phase + 1) % 3;
    render();
  });
  render();
  document.getElementById('checkout-controls').hidden = false;
})();
