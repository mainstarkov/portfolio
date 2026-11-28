const forestModes = document.querySelector('.forest-modes');
const forestBanner = document.querySelector('.forest-banner');
const forestStill = forestBanner.querySelector('source');
const forestAnimation = forestBanner.querySelector('img');

forestModes.hidden = false;
forestModes.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-forest-mode]');
  if (!button || button.getAttribute('aria-pressed') === 'true') return;

  const asset = 'hedgehog-forest-' + button.dataset.forestMode;
  forestStill.srcset = asset + '.png';
  forestAnimation.src = asset + '.gif';
  forestModes.querySelector('[aria-pressed="true"]').setAttribute('aria-pressed', 'false');
  button.setAttribute('aria-pressed', 'true');
});
