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

  // ── Loading screen ──
  const loadingScreen = document.getElementById('loadingScreen');
  setTimeout(() => {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => loadingScreen.classList.add('hidden'), 600);
  }, 2000);

  const screen1        = document.getElementById('screen1');
  const screen2        = document.getElementById('screen2');
  const screen3        = document.getElementById('screen3');
  const screen4        = document.getElementById('screen4');
  const arrowCircle    = document.getElementById('arrowCircle');
  const beautifulInput = document.getElementById('beautifulInput');
  const brokenInput    = document.getElementById('brokenInput');
  const submitBtn      = document.getElementById('submitBtn');
  const seeOthersBtn   = document.getElementById('seeOthersBtn');
  const wordCountB     = document.getElementById('wordCountB');
  const wordCountBr    = document.getElementById('wordCountBr');
  const countDisplay   = document.getElementById('countDisplay');
  const slideCard      = document.getElementById('slideCard');
  const slideCounter   = document.getElementById('slideCounter');
  const progressBar    = document.getElementById('slideProgressBar');
  const pauseIndicator = document.getElementById('pauseIndicator');

  // ── Animated count on screen 1 ──
  db.ref('responses').once('value', (snapshot) => {
    const total = Object.keys(snapshot.val() || {}).length;
    let n = 0;
    const step = Math.ceil(total / 35);
    const t = setInterval(() => {
      n = Math.min(n + step, total);
      countDisplay.textContent = `${n} people have shared their beliefs.`;
      if (n >= total) clearInterval(t);
    }, 40);
  });

  // ── Screen transitions ──
  function transitionTo(from, to) {
    from.classList.add('screen-exit');
    setTimeout(() => {
      from.classList.add('hidden');
      from.classList.remove('screen-exit');
      to.classList.remove('hidden');
    }, 300);
  }

  arrowCircle.addEventListener('click', () => transitionTo(screen1, screen2));

  // ── Mobile keyboard awareness ──
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const keyboardOpen = window.visualViewport.height < window.innerHeight * 0.8;
      submitBtn.style.opacity = keyboardOpen ? '0' : '';
      submitBtn.style.pointerEvents = keyboardOpen ? 'none' : '';
    });
  }

  // ── Word counter ──
  function wordCount(str) {
    return str.trim() === '' ? 0 : str.trim().split(/\s+/).length;
  }

  function updateWordCount(input, display) {
    const n = wordCount(input.value);
    display.textContent = `${n} word${n !== 1 ? 's' : ''}`;
    display.classList.toggle('wc-ok', n >= 3);
  }

  function updateButtonState() {
    const ok = wordCount(beautifulInput.value) >= 3 && wordCount(brokenInput.value) >= 3;
    const wasDisabled = submitBtn.disabled;
    submitBtn.disabled = !ok;
    submitBtn.classList.toggle('enabled', ok);
    if (wasDisabled && ok) {
      submitBtn.classList.add('pulse');
      setTimeout(() => submitBtn.classList.remove('pulse'), 700);
    }
  }

  beautifulInput.addEventListener('input', () => { updateWordCount(beautifulInput, wordCountB);  updateButtonState(); });
  brokenInput.addEventListener('input',    () => { updateWordCount(brokenInput, wordCountBr);    updateButtonState(); });

  // ── Submit ──
  submitBtn.addEventListener('click', () => {
    if (submitBtn.disabled) return;
    const beautiful = beautifulInput.value.trim();
    const broken    = brokenInput.value.trim();

    db.ref('responses').push({ beautiful, broken });

    document.getElementById('echoBeautiful').textContent = beautiful;
    document.getElementById('echoBroken').textContent    = broken;
    transitionTo(screen2, screen3);
  });

  // ── Slideshow ──
  let slides     = [];
  let slideIndex = 0;
  let paused     = false;
  let autoTimer  = null;

  function adaptSize(text) {
    if (text.length > 220) return 'size-sm';
    if (text.length > 110) return 'size-md';
    return '';
  }

  function renderSlide(index) {
    const entry = slides[index];
    const bEl  = document.getElementById('slideBeautiful');
    const brEl = document.getElementById('slideBroken');

    bEl.textContent  = entry.beautiful;
    brEl.textContent = entry.broken;

    bEl.className  = 'slide-text ' + adaptSize(entry.beautiful);
    brEl.className = 'slide-text ' + adaptSize(entry.broken);

    slideCounter.textContent = `${index + 1} / ${slides.length}`;
  }

  function goTo(index, direction) {
    const exitClass  = direction === 'next' ? 'exit-left'  : 'exit-right';
    const enterClass = direction === 'next' ? 'enter-left' : 'enter-right';

    slideCard.classList.add(exitClass);
    setTimeout(() => {
      slideCard.classList.remove(exitClass);
      slideIndex = (index + slides.length) % slides.length;
      renderSlide(slideIndex);
      slideCard.classList.add(enterClass);
      setTimeout(() => slideCard.classList.remove(enterClass), 280);
    }, 280);

    resetProgress();
    if (!paused) startProgress();
  }

  function startProgress() {
    progressBar.classList.remove('running');
    void progressBar.offsetWidth; // reflow to restart animation
    progressBar.classList.add('running');
    clearTimeout(autoTimer);
    autoTimer = setTimeout(() => {
      if (!paused) goTo(slideIndex + 1, 'next');
    }, 5000);
  }

  function resetProgress() {
    clearTimeout(autoTimer);
    progressBar.classList.remove('running');
  }

  function togglePause() {
    paused = !paused;
    pauseIndicator.classList.toggle('hidden', !paused);
    if (paused) {
      resetProgress();
    } else {
      startProgress();
    }
  }

  document.getElementById('slideNext').addEventListener('click', (e) => {
    e.stopPropagation();
    goTo(slideIndex + 1, 'next');
  });

  document.getElementById('slidePrev').addEventListener('click', (e) => {
    e.stopPropagation();
    goTo(slideIndex - 1, 'prev');
  });

  // Tap slide to pause/resume
  slideCard.addEventListener('click', togglePause);

  // Swipe gestures
  let touchStartX = 0;
  let touchStartY = 0;

  slideCard.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  slideCard.addEventListener('touchend', (e) => {
    const dx = touchStartX - e.changedTouches[0].clientX;
    const dy = Math.abs(touchStartY - e.changedTouches[0].clientY);
    if (Math.abs(dx) > 48 && dy < 60) {
      dx > 0 ? goTo(slideIndex + 1, 'next') : goTo(slideIndex - 1, 'prev');
    }
  }, { passive: true });

  // Load responses
  seeOthersBtn.addEventListener('click', () => {
    transitionTo(screen3, screen4);

    db.ref('responses').once('value', (snapshot) => {
      const data = snapshot.val() || {};
      slides = Object.values(data).sort(() => Math.random() - 0.5);
      slideIndex = 0;
      renderSlide(0);
      startProgress();
    });
  });
});
