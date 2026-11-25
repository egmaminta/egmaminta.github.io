// Recorded GroceryVision queries. Each row is a catalog entry offered to the reranker.
import { demoPrices, dollars } from './store-prices.js';

(() => {
  'use strict';
  const products = {
    beans: {
      photo: 'beans-frame',
      alt: 'A shopper holding a box of 365 Organic Garbanzo Beans',
      entries: [
        { name: 'Can', photo: 'beans-can', cosine: 0.21993, probability: 0.0482982 },
        { name: 'Box', photo: 'beans-box', cosine: 0.21829, probability: 0.9194816 },
        { name: 'Bag', photo: 'beans-bag', cosine: 0.184, probability: 0.0322202 },
      ],
      label: 'Garbanzo beans',
      firstCart: 'The cart records a <em>can</em>. The shopper is holding a <em>box</em>.',
      finalCart: 'The reranker changes the cart entry to the <em>box</em> the shopper picked up.',
    },
    ranch: {
      photo: 'ranch-frame',
      alt: 'A shopper holding a Hidden Valley Ranch bottle with a green cap',
      entries: [
        { name: 'Blue cap', photo: 'ranch-blue', cosine: 0.17355, probability: 0.0924533 },
        { name: 'Green cap', photo: 'ranch-green', cosine: 0.17092, probability: 0.9075468 },
      ],
      label: 'Ranch dressing',
      firstCart:
        'The cart records a bottle with a <em>blue cap</em>. The cap in the store frame is <em>green</em>.',
      finalCart: 'The reranker changes the cart entry to the bottle with the <em>green cap</em>.',
    },
  };
  const select = document.getElementById('checkout-item');
  const button = document.getElementById('checkout-action');
  const photo = document.getElementById('checkout-photo');
  const ranking = document.getElementById('checkout-ranking');
  const cart = document.getElementById('checkout-cart');
  const basket = document.getElementById('basket');
  const basketLines = document.getElementById('basket-lines');
  const compare = document.getElementById('compare-charges');
  const receipt = document.getElementById('charge-receipt');
  function expandReceipt(open) {
    compare.setAttribute('aria-expanded', String(open));
    receipt.hidden = !open;
  }
  compare.addEventListener('click', () => expandReceipt(receipt.hidden));
  const pickups = [];
  let current = -1;
  let store;
  function rerankedEntry(product) {
    return product.entries.reduce((best, next) => (next.probability > best.probability ? next : best));
  }
  function renderReceipt() {
    const list = document.getElementById('receipt-items');
    list.replaceChildren();
    const counts = new Map();
    for (const { key } of pickups) counts.set(key, (counts.get(key) || 0) + 1);
    let firstTotal = 0,
      correctedTotal = 0;
    for (const [key, quantity] of counts) {
      const product = products[key];
      const row = list.insertRow();
      const name = document.createElement('th');
      name.scope = 'row';
      name.textContent = product.label;
      row.append(name);
      row.insertCell().textContent = quantity;
      const amounts = [product.entries[0], rerankedEntry(product)].map((entry) => {
        const cents = demoPrices[key][entry.name] * quantity;
        const cell = row.insertCell();
        const variant = document.createElement('small');
        variant.textContent = entry.name;
        cell.append(dollars(cents), variant);
        return cents;
      });
      firstTotal += amounts[0];
      correctedTotal += amounts[1];
    }
    document.getElementById('first-total').textContent = dollars(firstTotal);
    document.getElementById('corrected-total').textContent = dollars(correctedTotal);
    const diff = firstTotal - correctedTotal;
    document.getElementById('charge-difference').textContent = !pickups.length
      ? ''
      : diff === 0
        ? 'The two totals are equal.'
        : 'Without correction you would pay ' +
          dollars(Math.abs(diff)) +
          (diff > 0 ? ' more.' : ' less.');
  }

  function renderBasket() {
    basket.hidden = pickups.length === 0;
    basketLines.replaceChildren();
    pickups.forEach((item, i) => {
      const product = products[item.key];
      const entry = item.reranked ? rerankedEntry(product) : product.entries[0];
      const row = basketLines.insertRow();
      const cell = document.createElement('th');
      cell.scope = 'row';
      const inspect = document.createElement('button');
      inspect.type = 'button';
      inspect.textContent = i + 1 + '. ' + product.label;
      inspect.setAttribute('aria-label', 'Inspect pickup ' + (i + 1) + ', ' + product.label);
      if (i === current) inspect.setAttribute('aria-current', 'true');
      inspect.addEventListener('click', () => {
        const alreadyShowing = i === current;
        current = i;
        select.value = item.key;
        store?.focusShelf(item.key);
        if (item.photo) store?.restorePhoto(item.photo, item.key);
        else if (!alreadyShowing)
          store?.animatePickup(item.key, undefined, (image) => {
            item.photo = image;
          });
        render();
        button.focus();
      });
      cell.append(inspect);
      row.append(cell);
      row.insertCell().textContent = product.entries[0].name;
      row.insertCell().textContent = entry.name;
      if (item.reranked) row.className = 'corrected';
    });
    renderReceipt();
  }

  function pickUp(key, instance) {
    select.value = key;
    const receiptItem = { key, reranked: false };
    current = pickups.push(receiptItem) - 1;
    store?.animatePickup(key, instance, (image) => {
      receiptItem.photo = image;
    });
    render();
  }

  function render() {
    const product = products[select.value];
    const phase = current < 0 ? 0 : pickups[current].reranked ? 2 : 1;
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
      const label = document.createElement('span');
      label.textContent = entry.name;
      const price = document.createElement('small');
      price.textContent = dollars(demoPrices[select.value][entry.name]);
      price.setAttribute('aria-label', 'Illustrative unit price ' + price.textContent);
      label.append(price);
      th.append(packshot, label);
      row.append(th);
      if (phase > 0) {
        row.insertCell().textContent =
          phase === 1 ? entry.cosine.toFixed(4) : (100 * entry.probability).toFixed(1) + '%';
        if (index === 0) row.className = phase === 1 ? 'first-choice' : 'final-choice';
      }
    });
    ranking.replaceChildren(table);
    cart.innerHTML = ['Ready for pickup.', product.firstCart, product.finalCart][phase];
    button.textContent = ['Pick up item', 'Rerank shortlist', 'Pick up another'][phase];
    const till = document.getElementById('store-till');
    till.hidden = current < 0;
    if (current >= 0) {
      const label = document.createElement('strong');
      label.textContent = 'Cart item ' + (current + 1);
      const variant = document.createElement('em');
      variant.textContent = order[0].name.toLowerCase();
      till.replaceChildren(label, '  ' + product.label + ', ', variant);
    }
    renderBasket();
  }
  select.addEventListener('change', () => {
    current = -1;
    store?.restorePhoto();
    store?.focusShelf(select.value);
    render();
  });
  button.addEventListener('click', () => {
    if (current < 0 || pickups[current].reranked) {
      pickUp(select.value);
    } else {
      pickups[current].reranked = true;
      render();
    }
  });
  document.getElementById('empty-basket').addEventListener('click', () => {
    pickups.length = 0;
    current = -1;
    expandReceipt(false);
    store?.restorePhoto();
    render();
    button.focus();
  });
  document.getElementById('print-receipt').addEventListener('click', () => {
    // Only this explicit action uses the receipt print layout. Ordinary page printing still works.
    document.body.classList.add('printing-receipt');
    window.print();
  });
  window.addEventListener('afterprint', () => document.body.classList.remove('printing-receipt'));
  function fallback() {
    document.getElementById('store-guide').textContent =
      'Choose a product below to replay its pickup and compare the two retrieval passes.';
  }
  async function startStore() {
    try {
      const { openStore } = await import('./store.js?v=2');
      store = openStore({ onPick: pickUp, onUnavailable: fallback });
      if (current >= 0) {
        const item = pickups[current];
        store.animatePickup(item.key, undefined, (image) => {
          item.photo = image;
        });
      }
    } catch {
      fallback();
    }
  }
  if ('IntersectionObserver' in window) {
    const loading = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loading.disconnect();
          startStore();
        }
      },
      { rootMargin: '360px' },
    );
    loading.observe(document.getElementById('store-view'));
  } else {
    startStore();
  }
  render();
  document.getElementById('checkout-controls').hidden = false;
})();
