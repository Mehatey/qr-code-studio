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

  // ── Loading screen — show holographic BLOOM logo · breathe · fade ──
  const loadingScreen = document.getElementById('loadingScreen');
  setTimeout(() => {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => loadingScreen.classList.add('hidden'), 800);
  }, 3000);

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

  // ── Animated count on screen 1 (real responses + seed count) ──
  db.ref('responses').once('value', (snapshot) => {
    const data = snapshot.val() || {};
    const realValid = Object.values(data).filter(entry => !isFiltered(entry)).length;
    // Seed count is added in slideshow merge; we count what'll actually be shown.
    // SEED_RESPONSES is declared below — reference its length lazily.
    const total = realValid + (typeof SEED_RESPONSES !== 'undefined' ? SEED_RESPONSES.length : 150);
    let n = 0;
    const step = Math.max(1, Math.ceil(total / 45));
    const t = setInterval(() => {
      n = Math.min(n + step, total);
      countDisplay.textContent = `${n} people have answered.`;
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

  // ── Filter list — responses that should NEVER appear in the slideshow ──
  const FILTERED_PHRASES = [
    'eva technician',
    'eva the technician',
    'making center',
    'cleaning the wall',
    'clean the wall',
    'cleaning walls',
    'ur mom',
    'fuck u',
    'fuck you',
  ];

  function wordCountStr(s) {
    return (s || '').trim() === '' ? 0 : (s || '').trim().split(/\s+/).length;
  }

  function isFiltered(entry) {
    if (!entry) return true;
    const b = (entry.beautiful || '').trim();
    const f = (entry.broken || '').trim();
    // Require both fields to have at least 3 words (matches form validation)
    if (wordCountStr(b) < 3 || wordCountStr(f) < 3) return true;
    const haystack = `${b} ${f}`.toLowerCase();
    return FILTERED_PHRASES.some(p => haystack.includes(p));
  }

  // ── Seed responses · merged into slideshow · made to feel like real humans wrote them ──
  const SEED_RESPONSES = [
    {beautiful: "my grandma's hands when she makes roti", broken: "i'm scared of forgetting how she sounds"},
    {beautiful: "when my mom hums while doing dishes", broken: "becoming someone who can't sit still"},
    {beautiful: "my dad never says I love you but he warms my car", broken: "him getting old"},
    {beautiful: "my brother snoring in the next room means he's home", broken: "the day he moves out"},
    {beautiful: "Nana's stupid jokes that aren't funny", broken: "her hands shake now"},
    {beautiful: "she still calls me by my pet name", broken: "her not picking up one day"},
    {beautiful: "when you can tell someone likes you back", broken: "when they stop replying"},
    {beautiful: "he remembers I take oat milk", broken: "I don't remember his birthday this year"},
    {beautiful: "sleeping next to someone who breathes weird", broken: "sleeping alone for the third year"},
    {beautiful: "a text from a friend I haven't talked to in 2 years", broken: "the one I never sent back"},
    {beautiful: "people asking how you are and actually waiting", broken: "saying i'm fine"},
    {beautiful: "a hand on my back in a crowded train", broken: "walking home with my keys in my fist"},
    {beautiful: "when my partner says my name in their sleep", broken: "the way they don't anymore"},
    {beautiful: "drunk girls in the bathroom telling me I'm gorgeous", broken: "the loneliness on the way home"},
    {beautiful: "when a friend just shows up", broken: "the friend who says we should hang and never does"},
    {beautiful: "tuesday night drinks for no reason", broken: "tuesday night drinks because of a reason"},
    {beautiful: "inside jokes from college", broken: "we don't talk anymore"},
    {beautiful: "the friend who calls just to chat", broken: "I haven't called my brother in months"},
    {beautiful: "soil after rain", broken: "the way summer doesn't end now"},
    {beautiful: "4pm light through the kitchen window", broken: "I never open my blinds"},
    {beautiful: "rain in the afternoon when you're inside", broken: "the heat dome"},
    {beautiful: "fog lifting off a lake at 6am", broken: "the lake i swam in is gone now"},
    {beautiful: "first snow", broken: "no snow this december"},
    {beautiful: "the first 60 degree day in march", broken: "still wearing my coat in may"},
    {beautiful: "the tree outside my childhood window is still there", broken: "the lot where my old house was is a duplex"},
    {beautiful: "birds at 5am before everything starts", broken: "birds aren't coming back in spring anymore"},
    {beautiful: "a really ripe avocado", broken: "it turning bad overnight"},
    {beautiful: "$20 in an old pocket", broken: "finding a note in his handwriting"},
    {beautiful: "a song from 2014 coming on shuffle", broken: "the radio is just ads now"},
    {beautiful: "the smell of coffee", broken: "i drink it cold every day i forget"},
    {beautiful: "empty L train at 11am", broken: "missing the train and crying about it"},
    {beautiful: "ice water when ur thirsty", broken: "asking for help and feeling stupid"},
    {beautiful: "someone holding the door at trader joe's", broken: "the person who let it close on me"},
    {beautiful: "an old man feeding birds in tompkins square", broken: "the bench is empty now"},
    {beautiful: "finishing a project i've put off for a year", broken: "starting another i won't finish"},
    {beautiful: "a sentence in a book that makes you put it down", broken: "the rest of the book"},
    {beautiful: "a song that ends too soon", broken: "songs i'll never hear again"},
    {beautiful: "painting and not posting it", broken: "caring too much about likes"},
    {beautiful: "dancing in the kitchen at 2am", broken: "i don't dance anymore"},
    {beautiful: "the last page of a really good book", broken: "books on my shelf i never opened"},
    {beautiful: "taking off your bra at the end of the day", broken: "going to sleep in jeans"},
    {beautiful: "stretching in bed", broken: "waking up tired even after 9 hours"},
    {beautiful: "cold sheets when you're hot", broken: "lying awake at 3:47 again"},
    {beautiful: "being hugged when you didn't ask", broken: "needing one and pretending you don't"},
    {beautiful: "crying so hard you start laughing", broken: "i can't cry anymore"},
    {beautiful: "a photo i forgot was on my phone", broken: "memories i can't actually remember"},
    {beautiful: "a smell that takes you back to being 12", broken: "places I'll never go back to"},
    {beautiful: "a voicemail from my grandma I won't delete", broken: "I deleted it last week by accident"},
    {beautiful: "rereading a book I loved at 17", broken: "I wouldn't be friends with 17 year old me"},
    {beautiful: "old journals", broken: "rereading old journals"},
    {beautiful: "that anything exists at all is wild", broken: "all of this ends"},
    {beautiful: "I'm small in a huge universe", broken: "I'm small in my own life"},
    {beautiful: "silence has a texture", broken: "noise everywhere even in my head"},
    {beautiful: "all the people who would love me if they met me", broken: "all the people who don't know me"},
    {beautiful: "the moment right before a decision", broken: "the choice I didn't make"},
    {beautiful: "waking up", broken: "wanting to not wake up some days"},
    {beautiful: "a whole day off my phone", broken: "I can't stop checking it"},
    {beautiful: "I left my phone at home and survived", broken: "the panic when I realized"},
    {beautiful: "not knowing my screen time", broken: "9h 12m yesterday"},
    {beautiful: "walking in the park with no phone", broken: "leaving it home stresses me out"},
    {beautiful: "no clocks visible", broken: "always knowing what time it is"},
    {beautiful: "a sunset I just looked at", broken: "the 47 sunsets in my camera roll"},
    {beautiful: "an hour with no notifications", broken: "i have 14,000 unread emails"},
    {beautiful: "getting paid to do something I love", broken: "doing what I hate for the money"},
    {beautiful: "an actual day off", broken: "vacation where I checked slack"},
    {beautiful: "being good at the thing I love", broken: "loving the thing I'm only ok at"},
    {beautiful: "quitting the job that was killing me", broken: "thinking about it almost killed me"},
    {beautiful: "the cat at the bodega knows me", broken: "the bodega closed in december"},
    {beautiful: "first warm friday in nyc", broken: "winter is too long here"},
    {beautiful: "an empty bench in central park", broken: "construction outside my window since february"},
    {beautiful: "the city smells like rain", broken: "the city smells like garbage in august"},
    {beautiful: "hearing someone practice guitar through a wall", broken: "my airpods died mid song"},
    {beautiful: "when the beat drops", broken: "when the song ends and you go back to your day"},
    {beautiful: "my fav song in a stranger's uber", broken: "my fav song now reminds me of him"},
    {beautiful: "teaching my dad how to send a voice memo", broken: "he can't remember anymore"},
    {beautiful: "my mom asks me the same thing 3 times", broken: "she's stopped asking"},
    {beautiful: "my parents were once in their 20s and broke too", broken: "they're old now and I'm not ready"},
    {beautiful: "my dad said he was proud of me at thanksgiving", broken: "I waited 32 years"},
    {beautiful: "kids whispering really loud", broken: "the quiet kid in the back I was"},
    {beautiful: "a kid pointing at the moon", broken: "I forgot to look at the moon this month"},
    {beautiful: "crayon outside the lines", broken: "I color inside everything now"},
    {beautiful: "a swing still moving after the kid jumped off", broken: "they paved over the park"},
    {beautiful: "someone made me food when I was sick", broken: "eating standing up at the counter"},
    {beautiful: "my mom's dal", broken: "I can't make it taste the same"},
    {beautiful: "chai in winter", broken: "I drink dunkin now"},
    {beautiful: "cereal at midnight", broken: "i skipped lunch again"},
    {beautiful: "ten minutes of doing nothing", broken: "I can't stop scrolling"},
    {beautiful: "one long deep breath", broken: "I hold my breath when I'm typing"},
    {beautiful: "right before you fall asleep", broken: "lying awake stressing about tomorrow"},
    {beautiful: "sunday morning in an empty apartment", broken: "the inside of my head at 3am"},
    {beautiful: "dogs in halloween costumes", broken: "dogs at shelters"},
    {beautiful: "two old people walking really slow holding hands", broken: "the people who don't have someone"},
    {beautiful: "kids singing off-key", broken: "I haven't sung in years"},
    {beautiful: "babies grabbing your finger", broken: "I don't know if I want kids"},
    {beautiful: "the version of me a year from now", broken: "the version i'm trying to leave"},
    {beautiful: "planting tomatoes", broken: "things I planted that died"},
    {beautiful: "lives I haven't lived yet", broken: "lives I won't"},
    {beautiful: "the friends I'll meet this year", broken: "the friends I've lost"},
    {beautiful: "last thing my grandpa said to me was 'be good'", broken: "I wasn't good enough"},
    {beautiful: "I can still call my mom", broken: "I almost couldn't last november"},
    {beautiful: "she picked up", broken: "she didn't pick up yesterday"},
    {beautiful: "they came back", broken: "the ones who didn't"},
    {beautiful: "an old couple at a diner sharing a milkshake", broken: "she'll outlive him or he'll outlive her"},
    {beautiful: "babies trying to eat your finger", broken: "they grow up too fast"},
    {beautiful: "a friend who hugs without warning", broken: "I haven't been touched in 8 months"},
    {beautiful: "morning light through dirty windows", broken: "I haven't cleaned my windows since I moved in"},
    {beautiful: "the golden hour", broken: "the office lights"},
    {beautiful: "a candle burning all the way down", broken: "the smell of smoke after"},
    {beautiful: "eating dinner alone but on purpose", broken: "eating dinner alone but not"},
    {beautiful: "long walks with no destination", broken: "having nowhere to be"},
    {beautiful: "reading on the fire escape", broken: "doomscrolling the news at 7am"},
    {beautiful: "the time I said no and meant it", broken: "all the times I said yes when I wanted to scream"},
    {beautiful: "old photo of me where i look happy", broken: "I don't recognize her"},
    {beautiful: "a compliment from someone whose opinion matters", broken: "the voice in my head saying they were lying"},
    {beautiful: "I know what I want", broken: "I want what instagram tells me to"},
    {beautiful: "a small win no one knows about", broken: "needing to post everything"},
    {beautiful: "the moon was huge last night", broken: "you can't see the stars in nyc"},
    {beautiful: "a hummingbird at my window for like 2 seconds", broken: "i read about another species today"},
    {beautiful: "the ocean", broken: "the ocean in 50 years"},
    {beautiful: "looking up at the sky every morning", broken: "i forget to look up"},
    {beautiful: "told my therapist something I've never told anyone", broken: "things I still haven't told her"},
    {beautiful: "crying in front of someone and they didn't leave", broken: "pretending I'm fine for so long it became a personality"},
    {beautiful: "being known", broken: "being seen and going home alone anyway"},
    {beautiful: "I was wrong and I said so", broken: "the times i was wrong and didn't"},
    {beautiful: "a quiet minute in a chaotic day", broken: "I never sit still"},
    {beautiful: "breathing without thinking about it", broken: "breath holding when I'm anxious"},
    {beautiful: "didn't check my phone for a whole hike", broken: "instagram knows me better than my therapist"},
    {beautiful: "this room", broken: "every room asking something"},
    {beautiful: "not performing", broken: "wellness apps that cost $14.99 a month"},
    {beautiful: "questions I don't need to answer", broken: "the ones I avoid"},
    {beautiful: "my cohort", broken: "we're scattering after may"},
    {beautiful: "I'm proud of this thesis", broken: "it's not the thesis i planned"},
    {beautiful: "leaving a crit feeling like a genius", broken: "leaving feeling like a fraud"},
    {beautiful: "the silence after a concert ends", broken: "concerts where I held my phone up the whole time"},
    {beautiful: "everyone crying together at the end of a movie", broken: "watching movies on the train alone"},
    {beautiful: "a meal that becomes a memory", broken: "meals I don't remember eating"},
    {beautiful: "laughing with old friends till my face hurts", broken: "we only talk in the group chat now"},
    {beautiful: "a dog who notices me on the street", broken: "I had to leave my cat with my ex"},
    {beautiful: "the horse my uncle had", broken: "zoos"},
    {beautiful: "a sparrow lived in my fire escape one summer", broken: "she flew away"},
    {beautiful: "a stranger said I looked kind today", broken: "a stranger said I looked tired"},
    {beautiful: "a slow nice night", broken: "the 4am nights"},
    {beautiful: "my roommate laughing in the other room", broken: "the silence after she moved out"},
    {beautiful: "being held by an idea", broken: "ideas that don't hold me back"},
    {beautiful: "something to look forward to next month", broken: "having nothing to want"},
    {beautiful: "old books smell so good", broken: "i'll never read most of them"},
    {beautiful: "a hot bath after a long day", broken: "the day that wouldn't end"},
    {beautiful: "rain on a roof when you're inside", broken: "rain when my umbrella is broken"},
    {beautiful: "snow you can catch with your tongue", broken: "no snow in december this year"},
    {beautiful: "a sentence I wrote that surprised me", broken: "the words I can't find"},
  ];

  // Load responses (merged: real Firebase + seed responses)
  seeOthersBtn.addEventListener('click', () => {
    transitionTo(screen3, screen4);

    db.ref('responses').once('value', (snapshot) => {
      const data = snapshot.val() || {};
      const realEntries = Object.values(data).filter(entry => !isFiltered(entry));
      slides = [...realEntries, ...SEED_RESPONSES].sort(() => Math.random() - 0.5);
      slideIndex = 0;
      renderSlide(0);
      startProgress();
    });
  });
});
