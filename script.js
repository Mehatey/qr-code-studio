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

  // ── Curated seed responses — merged into the slideshow ──
  const SEED_RESPONSES = [
    {beautiful: "my grandmother's hands kneading dough on a sunday", broken: "forgetting what her voice sounds like"},
    {beautiful: "the way my mom hums when she thinks no one is listening", broken: "becoming someone she wouldn't recognize"},
    {beautiful: "my father's silence when he is proud of me", broken: "his silence when he is disappointed"},
    {beautiful: "my little brother falling asleep on my shoulder", broken: "leaving him behind"},
    {beautiful: "the sound of my grandfather laughing at his own joke", broken: "the day i can no longer hear it"},
    {beautiful: "my mom calling me beta when i am thirty", broken: "the call that doesn't come"},
    {beautiful: "the moment two strangers realize they're in love", broken: "the moment they realize they aren't anymore"},
    {beautiful: "when someone remembers your coffee order", broken: "when they forget your birthday"},
    {beautiful: "falling asleep next to someone you trust", broken: "waking up alone again"},
    {beautiful: "a text from someone who hasn't texted in years", broken: "the message i never sent"},
    {beautiful: "being asked how i'm doing and meaning it", broken: "being asked and lying"},
    {beautiful: "a hand on the small of my back in a crowd", broken: "walking home alone at night"},
    {beautiful: "the way my partner says my name when they're tired", broken: "hearing it less often"},
    {beautiful: "strangers laughing on the subway at four am", broken: "loneliness in a room full of people"},
    {beautiful: "a friend showing up before you ask", broken: "asking and being told they are busy"},
    {beautiful: "getting drunk on a tuesday for no reason", broken: "the hangover that lasts three days"},
    {beautiful: "inside jokes that don't translate", broken: "becoming someone people only knew once"},
    {beautiful: "a friend who calls just to hear my voice", broken: "the friend i stopped calling"},
    {beautiful: "the smell of soil after rain", broken: "watching the seasons stop making sense"},
    {beautiful: "light moving across the kitchen floor at four pm", broken: "blinds that never get opened"},
    {beautiful: "a thunderstorm at three in the afternoon", broken: "a sky that won't let go of the sun"},
    {beautiful: "the moment fog lifts off a lake", broken: "what we did to the lakes"},
    {beautiful: "snow falling on a city that doesn't usually get snow", broken: "snow falling in places that never did"},
    {beautiful: "the first warm day of march", broken: "the last cold day of november"},
    {beautiful: "an old tree i used to climb still standing", broken: "the lot where the tree was"},
    {beautiful: "birds at five am before the city wakes up", broken: "birds that don't come back next year"},
    {beautiful: "a perfectly ripe avocado", broken: "the one that turns the next day"},
    {beautiful: "finding twenty dollars in an old coat", broken: "finding a note from a person who's gone"},
    {beautiful: "a song you forgot you loved coming on", broken: "the radio playing nothing you know"},
    {beautiful: "the smell of coffee before drinking it", broken: "drinking it cold"},
    {beautiful: "an empty subway car at the right moment", broken: "missing the train by ten seconds"},
    {beautiful: "the first sip of water when you're really thirsty", broken: "running out of words to ask for help"},
    {beautiful: "a stranger holding the door", broken: "watching someone choose not to"},
    {beautiful: "an old man feeding pigeons in the park", broken: "the bench that's still there when he isn't"},
    {beautiful: "finishing something you started a year ago", broken: "starting something you never finish"},
    {beautiful: "the silence right after you read a great line", broken: "the noise of every other line"},
    {beautiful: "a song that ends before you're ready", broken: "a song you'll never hear again"},
    {beautiful: "painting badly and not caring", broken: "caring what people think too much"},
    {beautiful: "dancing alone in the kitchen", broken: "the day i stopped dancing"},
    {beautiful: "the way a great book ends", broken: "books i started and put down"},
    {beautiful: "the moment you finally take off your shoes", broken: "going to bed with your makeup on"},
    {beautiful: "stretching in the morning sun", broken: "waking up tired no matter how long you slept"},
    {beautiful: "the back of your knees against cold sheets", broken: "insomnia at three thirty am"},
    {beautiful: "being held when you didn't know you needed it", broken: "needing to be held and pretending you don't"},
    {beautiful: "crying so hard you laugh", broken: "not being able to cry at all"},
    {beautiful: "a photograph you forgot existed", broken: "memory that goes faster than expected"},
    {beautiful: "the way a smell pulls you back ten years", broken: "places you'll never see again"},
    {beautiful: "an old voicemail you can't bring yourself to delete", broken: "deleting it by accident"},
    {beautiful: "re-reading a book that meant something at sixteen", broken: "becoming someone sixteen-year-old me wouldn't know"},
    {beautiful: "a journal entry from when you were happy", broken: "rereading it now"},
    {beautiful: "the fact that anything exists at all", broken: "the fact that it ends"},
    {beautiful: "being a small thing in a big universe", broken: "being a small thing in a small life"},
    {beautiful: "the way silence has a sound", broken: "the way noise becomes silence"},
    {beautiful: "how many people you'll never meet who'd love you", broken: "how few people really know you"},
    {beautiful: "the moment before a decision changes everything", broken: "the decision i didn't make"},
    {beautiful: "waking up and not being dead", broken: "waking up and wanting to be"},
    {beautiful: "being unreachable for an entire day", broken: "the notification i can't ignore"},
    {beautiful: "a phone that's been off for a week", broken: "the urge to check every five minutes"},
    {beautiful: "forgetting what my screen time average is", broken: "remembering it"},
    {beautiful: "walking without my phone", broken: "the panic of leaving it home"},
    {beautiful: "not knowing what time it is", broken: "always knowing what time it is"},
    {beautiful: "a sunset you didn't photograph", broken: "the sunsets i did"},
    {beautiful: "an hour without a single notification", broken: "the dread of opening my inbox"},
    {beautiful: "getting paid for something i would do for free", broken: "doing something i hate for money"},
    {beautiful: "a day off that feels like a day off", broken: "vacation that feels like work"},
    {beautiful: "being good at what i love", broken: "loving what i'm good at"},
    {beautiful: "leaving a job that was killing me", broken: "the job that almost did"},
    {beautiful: "a bodega cat that knows you", broken: "the bodega that closed last year"},
    {beautiful: "the first warm friday of spring in new york", broken: "winter that won't end"},
    {beautiful: "an empty park bench in the morning", broken: "construction noise at seven am"},
    {beautiful: "the way the city smells after rain", broken: "the way it smells in august"},
    {beautiful: "a guitar in another room", broken: "headphones that stop working mid-song"},
    {beautiful: "the moment the song you love drops the beat", broken: "the silence after the song ends"},
    {beautiful: "hearing your favorite song in a stranger's car", broken: "your favorite song losing its meaning"},
    {beautiful: "teaching my dad how to text", broken: "the day he forgets how"},
    {beautiful: "my mom asking the same question twice", broken: "her stopping asking"},
    {beautiful: "realizing my parents were also young once", broken: "realizing they're getting old now"},
    {beautiful: "a parent telling me they're proud", broken: "never hearing it"},
    {beautiful: "a kid trying to whisper", broken: "the kid who never spoke up"},
    {beautiful: "a child noticing something adults stopped noticing", broken: "becoming an adult who stops noticing"},
    {beautiful: "crayons that don't follow lines", broken: "lines i no longer color outside of"},
    {beautiful: "a swing set still in motion after the kid jumped off", broken: "playgrounds that were torn down"},
    {beautiful: "a warm meal someone made for me", broken: "eating alone at the sink"},
    {beautiful: "the smell of my mom's cooking from down the street", broken: "the recipe i can't quite get right"},
    {beautiful: "a perfect cup of chai", broken: "the way coffee replaced everything"},
    {beautiful: "midnight cereal", broken: "skipping dinner to lose weight"},
    {beautiful: "ten minutes of nothing", broken: "filling every silence with sound"},
    {beautiful: "a long exhale", broken: "holding my breath without realizing"},
    {beautiful: "the moment before falling asleep", broken: "lying awake at three in the morning"},
    {beautiful: "a quiet sunday in a quiet apartment", broken: "the noise i can't shut off in my head"},
    {beautiful: "a dog smiling without knowing it's smiling", broken: "dogs without homes"},
    {beautiful: "the way old people hold hands", broken: "the people who don't have anyone to hold"},
    {beautiful: "kids singing badly and loudly", broken: "the songs adults stopped singing"},
    {beautiful: "a baby's hand wrapped around my finger", broken: "the babies i'll never meet"},
    {beautiful: "the version of me that's coming next year", broken: "the version of me i'm leaving behind"},
    {beautiful: "planting something and watching it grow", broken: "watching things i love wilt"},
    {beautiful: "a life i haven't lived yet", broken: "the lives i won't"},
    {beautiful: "the people i'll meet next year", broken: "the people i've already lost"},
    {beautiful: "the last conversation i had with my grandfather", broken: "things i should have said"},
    {beautiful: "a friend who is alive and reachable", broken: "the funeral i didn't go to"},
    {beautiful: "being able to call my mom", broken: "the day i can't anymore"},
    {beautiful: "a person who came back when i thought they wouldn't", broken: "the ones who didn't"},
    {beautiful: "an old man holding his wife's hand at lunch", broken: "outliving someone you love"},
    {beautiful: "a baby trying to fit my finger in their mouth", broken: "growing up too fast"},
    {beautiful: "a friend who hugs without warning", broken: "the year i stopped touching anyone"},
    {beautiful: "morning light through dirty windows", broken: "windows i never get to"},
    {beautiful: "the way evening light makes everyone look soft", broken: "fluorescent office light"},
    {beautiful: "a candle burning down to nothing", broken: "the smoke after"},
    {beautiful: "a meal alone that feels like a meal", broken: "loneliness that feels like a punishment"},
    {beautiful: "a long walk with nowhere to be", broken: "having nowhere to go"},
    {beautiful: "reading a book with the window open", broken: "reading the news first thing in the morning"},
    {beautiful: "the moment i finally said no", broken: "all the times i said yes when i meant no"},
    {beautiful: "looking at an old photo and recognizing myself", broken: "looking and not"},
    {beautiful: "a compliment from someone i respect", broken: "the inner voice that contradicts it"},
    {beautiful: "knowing what i want", broken: "performing what i think i should want"},
    {beautiful: "a small private win nobody knows about", broken: "needing everyone to know"},
    {beautiful: "the way the moon looks too big sometimes", broken: "skies that turn yellow from smoke"},
    {beautiful: "a hummingbird that hovers for two seconds", broken: "watching species disappear in real time"},
    {beautiful: "a wave that breaks just right", broken: "oceans i'll never swim in again"},
    {beautiful: "watching the same sky every morning", broken: "forgetting to look up at all"},
    {beautiful: "telling someone something i've never said", broken: "all the things i carry alone"},
    {beautiful: "crying in front of someone and not feeling small", broken: "performing strength for strangers"},
    {beautiful: "being seen and staying", broken: "being seen and disappearing"},
    {beautiful: "admitting i was wrong", broken: "doubling down when i wasn't"},
    {beautiful: "a moment of stillness in a busy day", broken: "never sitting still long enough"},
    {beautiful: "breath that doesn't feel like a chore", broken: "running out of breath without noticing"},
    {beautiful: "a day i didn't think about my phone", broken: "the algorithm knowing me better than i do"},
    {beautiful: "a room that holds you without asking anything", broken: "every room asking something of you"},
    {beautiful: "being present and not performing presence", broken: "being sold stillness for nine dollars a month"},
    {beautiful: "a question that doesn't need to be answered", broken: "the questions i avoid"},
    {beautiful: "the friends i made in graduate school", broken: "leaving them in june"},
    {beautiful: "a thesis i'm proud of", broken: "the thesis i thought i would make"},
    {beautiful: "walking out of a critique feeling alive", broken: "walking out feeling small"},
    {beautiful: "the silence after a song ends in a concert", broken: "the way nothing feels sacred anymore"},
    {beautiful: "strangers crying at a film together", broken: "watching films alone on a phone"},
    {beautiful: "a meal that becomes a memory", broken: "meals i don't remember eating"},
    {beautiful: "the feeling of a long laugh with old friends", broken: "the friends i talk to only on instagram"},
    {beautiful: "a dog noticing me on the street", broken: "the cat i had to leave behind"},
    {beautiful: "a horse i fed as a kid", broken: "animals in cages"},
    {beautiful: "a bird that lived in my apartment for one summer", broken: "the day it flew out and didn't come back"},
    {beautiful: "a stranger telling me i look kind", broken: "a stranger telling me i look tired"},
    {beautiful: "a night that ends slowly and well", broken: "the nights that end at four am alone"},
    {beautiful: "the sound of someone you love laughing in another room", broken: "the silence that follows when they're gone"},
    {beautiful: "being held by an idea instead of a person", broken: "ideas that don't hold anything"},
    {beautiful: "having something to look forward to", broken: "having nothing to want"},
    {beautiful: "the smell of old books in a library", broken: "every book i'll never read"},
    {beautiful: "a warm bath after a long day", broken: "the day that wouldn't end"},
    {beautiful: "rain on a roof you're under", broken: "rain on a roof that leaks"},
    {beautiful: "snow that falls slow enough to catch", broken: "snow that doesn't come anymore"},
    {beautiful: "a sentence i wrote that surprised me", broken: "all the words that didn't come"},
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
