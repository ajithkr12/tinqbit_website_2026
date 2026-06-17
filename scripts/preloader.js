(function () {
  var css =
    '#tq-preloader{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;' +
    'align-items:center;justify-content:center;gap:2rem;background:#0b1929;' +
    'transition:opacity .5s ease,visibility .5s ease;}' +
    '#tq-preloader::before{content:"";position:absolute;inset:0;pointer-events:none;' +
    'background-image:radial-gradient(rgba(69,191,229,.1) 1px,transparent 1px);' +
    'background-size:26px 26px;}' +
    '#tq-preloader.tq-pl-out{opacity:0;visibility:hidden;}' +
    '.tq-pl-logo{width:100px;max-width:30vw;' +
    'animation:tq-pl-pulse 2s ease-in-out infinite;}' +
    '.tq-pl-logo img{width:100%;height:auto;display:block;}' +
    '@keyframes tq-pl-pulse{0%,100%{opacity:1}50%{opacity:.6}}' +
    '.tq-pl-track{width:160px;height:2px;background:rgba(255,255,255,.1);' +
    'border-radius:2px;overflow:hidden;}' +
    '.tq-pl-fill{height:100%;width:0;border-radius:2px;' +
    'background:linear-gradient(90deg,#1490c8,#45bfe5);' +
    'animation:tq-pl-load 1.8s cubic-bezier(.4,0,.2,1) forwards;}' +
    '@keyframes tq-pl-load{0%{width:0%}25%{width:35%}65%{width:70%}100%{width:100%}}';

  var style = document.createElement('style');
  style.textContent = css;
  (document.head || document.documentElement).appendChild(style);

  function hide() {
    var el = document.getElementById('tq-preloader');
    if (!el || el.dataset.hidden) return;
    el.dataset.hidden = '1';
    el.classList.add('tq-pl-out');
    setTimeout(function () { el.style.display = 'none'; }, 520);
  }

  window.addEventListener('load', hide);
  setTimeout(hide, 4000); // fallback: hide after 4s regardless
})();
