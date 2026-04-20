document.addEventListener('DOMContentLoaded', () => {
  const firebaseConfig = {
    apiKey: "AIzaSyAhKNE7ycFQGo_0OUChCRRSh6jKom6rWyk",
    authDomain: "good-or-bad-or-nothing-at-all.firebaseapp.com",
    databaseURL: "https://good-or-bad-or-nothing-at-all-default-rtdb.firebaseio.com",
    projectId: "good-or-bad-or-nothing-at-all",
    storageBucket: "good-or-bad-or-nothing-at-all.appspot.com",
    messagingSenderId: "591627005378",
    appId: "1:591627005378:web:40255eabc81a8afa943a5b"
  };
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  const screen1 = document.getElementById('screen1');
  const screen2 = document.getElementById('screen2');
  const screen3 = document.getElementById('screen3');
  const screen4 = document.getElementById('screen4');

  const arrowCircle     = document.getElementById('arrowCircle');
  const beautifulInput  = document.getElementById('beautifulInput');
  const brokenInput     = document.getElementById('brokenInput');
  const submitBtn       = document.getElementById('submitBtn');
  const seeOthersBtn    = document.getElementById('seeOthersBtn');
  const countDisplay    = document.getElementById('countDisplay');
  const wordCountB      = document.getElementById('wordCountB');
  const wordCountBr     = document.getElementById('wordCountBr');

  // ── Animate count on screen 1 ──
  db.ref('responses').once('value', (snapshot) => {
    const total = Object.keys(snapshot.val() || {}).length;
    let current = 0;
    const step = Math.ceil(total / 40);
    const timer = setInterval(() => {
      current = Math.min(current + step, total);
      countDisplay.textContent = `${current} people have shared their beliefs.`;
      if (current >= total) clearInterval(timer);
    }, 40);
  });

  // ── Screen transitions ──
  function transitionTo(from, to) {
    from.classList.add('screen-exit');
    setTimeout(() => {
      from.classList.add('hidden');
      from.classList.remove('screen-exit');
      to.classList.remove('hidden');
    }, 320);
  }

  arrowCircle.addEventListener('click', () => transitionTo(screen1, screen2));

  // ── Word counter ──
  function wordCount(str) {
    return str.trim() === '' ? 0 : str.trim().split(/\s+/).length;
  }

  function updateWordCount(input, display) {
    const count = wordCount(input.value);
    display.textContent = `${count} word${count !== 1 ? 's' : ''}`;
    display.classList.toggle('wc-ok', count >= 3);
  }

  function updateButtonState() {
    const bOk  = wordCount(beautifulInput.value) >= 3;
    const brOk = wordCount(brokenInput.value) >= 3;
    const wasDisabled = submitBtn.disabled;
    submitBtn.disabled = !(bOk && brOk);
    submitBtn.classList.toggle('enabled', bOk && brOk);
    if (wasDisabled && !submitBtn.disabled) {
      submitBtn.classList.add('pulse');
      setTimeout(() => submitBtn.classList.remove('pulse'), 600);
    }
  }

  beautifulInput.addEventListener('input', () => {
    updateWordCount(beautifulInput, wordCountB);
    updateButtonState();
  });
  brokenInput.addEventListener('input', () => {
    updateWordCount(brokenInput, wordCountBr);
    updateButtonState();
  });

  // ── Submit ──
  let lastBeautiful = '';
  let lastBroken = '';

  submitBtn.addEventListener('click', () => {
    if (submitBtn.disabled) return;
    lastBeautiful = beautifulInput.value.trim();
    lastBroken    = brokenInput.value.trim();

    db.ref('responses').push({ beautiful: lastBeautiful, broken: lastBroken });

    document.getElementById('echoBeautiful').textContent = lastBeautiful;
    document.getElementById('echoBroken').textContent    = lastBroken;

    transitionTo(screen2, screen3);
  });

  // ── Slideshow ──
  let slides = [];
  let slideIndex = 0;

  function showSlide(index) {
    const card = document.getElementById('slideCard');
    card.classList.add('slide-fade');
    setTimeout(() => {
      const entry = slides[index];
      document.getElementById('slideBeautiful').textContent = entry.beautiful;
      document.getElementById('slideBroken').textContent    = entry.broken;
      document.getElementById('slideCounter').textContent   = `${index + 1} / ${slides.length}`;
      card.classList.remove('slide-fade');
    }, 200);
  }

  document.getElementById('slideNext').addEventListener('click', () => {
    slideIndex = (slideIndex + 1) % slides.length;
    showSlide(slideIndex);
  });

  document.getElementById('slidePrev').addEventListener('click', () => {
    slideIndex = (slideIndex - 1 + slides.length) % slides.length;
    showSlide(slideIndex);
  });

  seeOthersBtn.addEventListener('click', () => {
    transitionTo(screen3, screen4);
    document.getElementById('slideCard').innerHTML = '<p class="loading-text">loading...</p>';

    db.ref('responses').once('value', (snapshot) => {
      const data = snapshot.val() || {};
      slides = Object.values(data).sort(() => Math.random() - 0.5);
      slideIndex = 0;

      document.getElementById('slideCard').innerHTML = `
        <p class="slide-label">beautiful</p>
        <p id="slideBeautiful" class="slide-text"></p>
        <p class="slide-label broken-label">broken</p>
        <p id="slideBroken" class="slide-text"></p>
      `;
      showSlide(0);
    });
  });
});
