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
  const scrollTrack    = document.getElementById('scrollTrack');
  const scrollViewport = document.getElementById('scrollViewport');
  const scrollCount    = document.getElementById('scrollCount');
  const scrollPaused   = document.getElementById('scrollPaused');

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

  // ── Vertical infinite auto-scroll wall ──
  let paused = false;

  function buildScrollCard(entry, index) {
    // Random slight rotation for "real-world" feel — deterministic by index
    const tilt = ((index * 37) % 7) - 3; // -3 to +3 degrees
    const offset = ((index * 23) % 18) - 9; // -9 to +9 px horizontal
    const card = document.createElement('div');
    card.className = 'scroll-card';
    card.style.setProperty('--tilt', tilt + 'deg');
    card.style.setProperty('--xoffset', offset + 'px');

    const b = document.createElement('div');
    b.className = 'sc-block';
    b.innerHTML = `<span class="sc-label">beautiful</span><p class="sc-text">${escapeHtml(entry.beautiful)}</p>`;
    card.appendChild(b);

    const f = document.createElement('div');
    f.className = 'sc-block sc-fear';
    f.innerHTML = `<span class="sc-label">fear</span><p class="sc-text">${escapeHtml(entry.broken)}</p>`;
    card.appendChild(f);

    return card;
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function buildScrollTrack(entries) {
    scrollTrack.innerHTML = '';
    // Shuffle for variety
    const shuffled = [...entries].sort(() => Math.random() - 0.5);
    // Duplicate the list once for seamless loop (CSS animates from 0 → -50%)
    const doubled = [...shuffled, ...shuffled];
    doubled.forEach((entry, i) => {
      scrollTrack.appendChild(buildScrollCard(entry, i));
    });
    // Animation duration scales with content (slower = more readable)
    const cards = shuffled.length;
    const duration = Math.max(60, cards * 4); // 4s per card minimum
    scrollTrack.style.animationDuration = duration + 's';
    scrollCount.textContent = `${cards} people have answered`;
  }

  function togglePause() {
    paused = !paused;
    scrollTrack.classList.toggle('paused', paused);
    scrollPaused.classList.toggle('hidden', !paused);
  }

  // Tap the viewport anywhere to toggle pause
  scrollViewport.addEventListener('click', togglePause);
  scrollViewport.addEventListener('touchstart', (e) => {
    // Don't toggle if user is scrolling/dragging
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

  // ── Seed responses · merged into slideshow · reddit-voice · oversharing strangers ──
  const SEED_RESPONSES = [
    {beautiful: "ngl my dog losing his mind when i come home", broken: "him not being around in like 3 years probably"},
    {beautiful: "my mom still texts me good morning every day even tho im 28", broken: "the day she stops"},
    {beautiful: "i found out my dad has been keeping all my drawings from kindergarten", broken: "ive been kind of a shitty kid"},
    {beautiful: "honestly just the way my best friend laughs", broken: "she's moving to LA next month"},
    {beautiful: "my grandma calls me every sunday at 9am like clockwork", broken: "the call thats gonna not come one day"},
    {beautiful: "when you havent talked to someone in like a year and they text you out of nowhere", broken: "the friends i let slip away bc i was busy"},
    {beautiful: "tbh getting a window seat on the train", broken: "having to sit next to someone who smells"},
    {beautiful: "ok this is dumb but when a song you forgot existed comes on shuffle", broken: "im so tired of every song reminding me of him"},
    {beautiful: "watching my dad nap on the couch on sundays", broken: "he's getting old i can tell"},
    {beautiful: "ice cream after a bad day", broken: "the bad days getting longer"},
    {beautiful: "my partner actually listens when i talk about work", broken: "i havent told them about the panic attacks"},
    {beautiful: "lowkey just trader joes flowers", broken: "i havent bought myself anything in months"},
    {beautiful: "the friend that texts you out of nowhere with a meme", broken: "i havent texted anyone first in weeks"},
    {beautiful: "i cleaned my apartment today and it actually feels good", broken: "i live alone now"},
    {beautiful: "petting my cat at 3am when i cant sleep", broken: "putting my last cat down 2 years ago"},
    {beautiful: "free pizza", broken: "credit card debt"},
    {beautiful: "i told my therapist about that thing and i feel lighter", broken: "i havent told her the actual thing"},
    {beautiful: "smell of fresh laundry idk why this always makes me happy", broken: "i havent done laundry in 2 weeks"},
    {beautiful: "honestly babies sneezing", broken: "i dont know if i want kids"},
    {beautiful: "my partner sleep talking about pasta", broken: "i think i love them more than they love me"},
    {beautiful: "the way nyc smells in october", broken: "summers are getting hotter idk how to feel"},
    {beautiful: "watching the sun come up on the train back from a trip", broken: "going back to work tomorrow"},
    {beautiful: "ok so my coworker brought me coffee unprompted today", broken: "i think im about to get laid off"},
    {beautiful: "my mom said im proud of you yesterday", broken: "ive been waiting 30 years to hear that"},
    {beautiful: "i wore a dress today and i felt good", broken: "i look in the mirror most days and dont recognize myself"},
    {beautiful: "the smell of garlic cooking", broken: "i live off ubereats"},
    {beautiful: "a stranger told me my outfit was cute on the train today", broken: "i havent felt cute in months"},
    {beautiful: "honestly the dollar slice on st marks is still good", broken: "everything else costs $25"},
    {beautiful: "my niece said she missed me", broken: "shes growing up so fast and i barely see her"},
    {beautiful: "i finally beat tears of the kingdom", broken: "i havent left my apartment in like 4 days"},
    {beautiful: "those moments when youre walking and a song just hits", broken: "im so addicted to my phone its embarrassing"},
    {beautiful: "i made my bed today and that counted as productive", broken: "lowkey depression is winning rn"},
    {beautiful: "my friend showed up at the airport with snacks", broken: "i have no one to call when im sad anymore"},
    {beautiful: "having someone in my contacts as ICE", broken: "having to pick someone for that role"},
    {beautiful: "petting strangers dogs at the park", broken: "wanting a dog but not having time"},
    {beautiful: "my college roommate still posts on my birthday", broken: "we havent actually talked in 3 years"},
    {beautiful: "the smell of coffee shops where you havent ordered yet", broken: "$8 coffees"},
    {beautiful: "ngl the weather rn", broken: "i think we broke the planet"},
    {beautiful: "naps on the couch with the tv on", broken: "i cant focus for more than 12 minutes"},
    {beautiful: "an empty subway car at the perfect time", broken: "the L train at 7pm on a tuesday"},
    {beautiful: "honestly therapy", broken: "honestly therapy"},
    {beautiful: "my mom packed me lunch when she visited last week", broken: "i fly home for christmas and she always looks older"},
    {beautiful: "my partner makes me coffee without being asked", broken: "i havent told them i dont actually like coffee"},
    {beautiful: "having a friend you can not text for 6 months and pick right back up", broken: "i let some of those slip"},
    {beautiful: "moments when my anxiety just stops for like 30 mins", broken: "the moments before it starts again"},
    {beautiful: "free shipping over $35", broken: "i buy stuff i dont need to hit $35"},
    {beautiful: "honestly just like really good guac", broken: "it costs $4 extra and i still get it"},
    {beautiful: "i started journaling and idk it helps", broken: "i havent journaled in 4 months"},
    {beautiful: "petting a dog at the bodega", broken: "the bodega closed last month"},
    {beautiful: "looking at the moon and remembering everyone i love sees the same one", broken: "my grandma cant see it anymore"},
    {beautiful: "lowkey when someone laughs at your joke", broken: "telling a joke nobody laughs at"},
    {beautiful: "the way my brother laughs when something genuinely surprises him", broken: "we havent been in the same room in 2 years"},
    {beautiful: "i think the fact that we keep trying is kinda beautiful", broken: "i think im exhausted"},
    {beautiful: "honestly my therapist", broken: "i cant afford her"},
    {beautiful: "free things at the library", broken: "my libraries are getting defunded"},
    {beautiful: "the way my dog sighs when he's finally comfortable", broken: "the vet appointment im dreading"},
    {beautiful: "my mom learned how to use facetime", broken: "she always cuts off her own face on screen"},
    {beautiful: "honestly making someone laugh", broken: "everyone i love is so far away"},
    {beautiful: "when a song you havent heard in years plays in a coffee shop and youre transported", broken: "i dont remember most of college"},
    {beautiful: "this is so basic but starbucks pumpkin spice for like 2 weeks in fall", broken: "the rest of the year"},
    {beautiful: "people who genuinely listen", broken: "people who wait to talk"},
    {beautiful: "the first day you dont need a jacket", broken: "checking the weather 6 times a day for some reason"},
    {beautiful: "old people walking really slow holding hands", broken: "watching them and knowing one outlives the other"},
    {beautiful: "fr though just my cat", broken: "my cat is 14"},
    {beautiful: "i didnt cry today", broken: "i cried yesterday"},
    {beautiful: "an old photo of my parents looking young", broken: "they look so tired now"},
    {beautiful: "the friend who texts paragraphs", broken: "i know im not as good a friend as they are"},
    {beautiful: "honestly just like getting an A on something", broken: "comparing myself to everyone on linkedin"},
    {beautiful: "free samples at trader joes", broken: "i cant afford to actually shop there"},
    {beautiful: "the way coffee smells before you drink it", broken: "the way i drink it cold every morning bc i get distracted"},
    {beautiful: "my best friend named her daughter after my mom", broken: "my mom isnt here to know"},
    {beautiful: "honestly the sound of rain on a window", broken: "leaking ceiling"},
    {beautiful: "when you cancel plans and the other person is also relieved", broken: "im scared im becoming a hermit"},
    {beautiful: "my dad finally said it back when i said i love you", broken: "took 27 years"},
    {beautiful: "watching little kids in tiny rain boots", broken: "i was a kid like 5 minutes ago"},
    {beautiful: "lowkey the moment before a great song drops", broken: "the silence after a really sad song ends"},
    {beautiful: "fr just like a warm shower", broken: "my water bill"},
    {beautiful: "the way my friend says my name when she's excited about something", broken: "we only text in memes now"},
    {beautiful: "honestly there's like a 30 second window in spring where everything is perfect", broken: "then its summer and i wanna die"},
    {beautiful: "ok this is dumb but really cold water on a hot day", broken: "i sweat through my shirt every commute"},
    {beautiful: "my grandfather wrote letters to my grandmother every day they were apart", broken: "we just send tiktoks now"},
    {beautiful: "a kid waving at me on the subway and his mom looking embarrassed", broken: "growing up too fast"},
    {beautiful: "the smell of my moms kitchen", broken: "i havent been home in 14 months"},
    {beautiful: "my older brother says he's proud of me", broken: "i never told him how much that meant"},
    {beautiful: "honestly when someone splits the check 50/50 without weirdness", broken: "venmo requests with notes that make me cry"},
    {beautiful: "the first morning of vacation when nothing is required", broken: "the last morning when i have to go back"},
    {beautiful: "my mom said im her best friend last week", broken: "i dont call her enough"},
    {beautiful: "an unexpected day off bc of a snow storm", broken: "ive worked through every birthday since 2021"},
    {beautiful: "looking back at old photos and seeing yourself happy without remembering being happy", broken: "im scared of running out of happy days"},
    {beautiful: "my partner laughs at my jokes nobody else thinks are funny", broken: "i cant tell if its love or pity"},
    {beautiful: "honestly nyc on a saturday morning before everything wakes up", broken: "nyc on a saturday night"},
    {beautiful: "fr just like when a friend remembers something you mentioned 2 months ago", broken: "i forget peoples birthdays and feel awful"},
    {beautiful: "my favorite playlist from high school", broken: "i cant listen to it anymore"},
    {beautiful: "watching someone be really good at something they love", broken: "i quit piano when i was 11"},
    {beautiful: "ngl wedding speeches by people who can barely speak from crying", broken: "ive never been to a wedding"},
    {beautiful: "ok so the moment i decided to leave my last job", broken: "im about to do it again at this one"},
    {beautiful: "my therapist remembers everything i tell her", broken: "i havent told her the worst things"},
    {beautiful: "honestly the way some people light up when they talk about what they love", broken: "i dont know what i love anymore"},
    {beautiful: "fresh sheets on the bed for the first night", broken: "going to bed by myself"},
    {beautiful: "i remembered to drink water today", broken: "im pretty sure im running on caffeine and rage"},
    {beautiful: "lowkey when someone holds the elevator", broken: "the day someone closes it on me"},
    {beautiful: "the way my dad calls me kid even tho im 30", broken: "him not being able to call me anything"},
    {beautiful: "ok so i fell asleep on my friends couch and she put a blanket on me", broken: "going home to an empty apartment"},
    {beautiful: "my partner remembers ALL my food allergies", broken: "i forget theirs sometimes and feel terrible"},
    {beautiful: "tbh sun on my face thru a window", broken: "i live in a basement apartment"},
    {beautiful: "the friend who says i love you on the phone like its normal", broken: "i still feel weird saying it back"},
    {beautiful: "ngl finishing a project after months", broken: "starting another one knowing i'll struggle again"},
    {beautiful: "my mom taught herself how to send memes", broken: "they're always boomer humor and i love it"},
    {beautiful: "people who let you change your mind", broken: "people who hold things against you forever"},
    {beautiful: "free movie nights at the park in summer", broken: "i went alone last year"},
    {beautiful: "honestly when the dryer signal goes off and the clothes are warm", broken: "communal laundry in my building"},
    {beautiful: "fr though the way kids laugh", broken: "i havent laughed like that in years"},
    {beautiful: "my friends partner welcoming me into their home like family", broken: "i havent had a partner in 4 years"},
    {beautiful: "ok so my dog learned to give high fives", broken: "the day i had to drop him off at my parents bc i moved"},
    {beautiful: "an old text thread you scroll back through", broken: "all the things you said you'd do together"},
    {beautiful: "honestly when you finally beat the boss after dying 47 times", broken: "the way im not really good at anything in real life"},
    {beautiful: "my mom kept every report card from elementary school", broken: "i lied to her about a lot of them"},
    {beautiful: "the friend who texts you the second they have news", broken: "i havent had real news in months"},
    {beautiful: "fr just like a clean kitchen", broken: "there are dishes in my sink from 4 days ago"},
    {beautiful: "my dad teaching me how to drive even tho he hated it", broken: "i dont call him enough"},
    {beautiful: "the way my partner snorts when they laugh too hard", broken: "i make them laugh less than i used to"},
    {beautiful: "ngl a really good cry every once in a while", broken: "the cries that dont stop"},
    {beautiful: "watching my niece try to walk for the first time", broken: "the relatives who arent here to see her"},
    {beautiful: "lowkey just the way snow muffles everything", broken: "no snow this year again"},
    {beautiful: "my grandma still has her sense of humor", broken: "she keeps asking the same question"},
    {beautiful: "honestly just being known by your barista", broken: "she moved to portland last month"},
    {beautiful: "old people dancing at weddings", broken: "i havent danced sober in 6 years"},
    {beautiful: "my partner saying my name when im in the next room and they just want to know im there", broken: "the way i did it to my last partner too"},
    {beautiful: "fresh basil from a plant on my windowsill", broken: "it died last week"},
    {beautiful: "moments when im not on my phone", broken: "everything else"},
    {beautiful: "fr my older sister picked up my call at 2am", broken: "i never called her back to thank her"},
    {beautiful: "an old friend remembering an inside joke from middle school", broken: "weve become different people"},
    {beautiful: "honestly the way my mom hums when she's cleaning", broken: "she's going to forget how at some point"},
    {beautiful: "ok so this is kind of weird but the way certain pages of books smell", broken: "i used to read all the time"},
    {beautiful: "a stranger giving me an extra umbrella when it started raining", broken: "people who pretend not to see"},
    {beautiful: "my therapist said im allowed to take up space", broken: "i still apologize when someone bumps into me"},
    {beautiful: "free wifi at coffee shops", broken: "the world we built"},
    {beautiful: "i finally said no last week and the world didnt end", broken: "ill probably say yes the next 10 times"},
    {beautiful: "lowkey my friends drunk texts of love at 2am", broken: "the silence between texts during the day"},
    {beautiful: "honestly when youre at a concert and the whole crowd sings", broken: "i went alone the last 2 times"},
    {beautiful: "the way my partner says good morning before they say anything else", broken: "im scared theyll stop"},
    {beautiful: "fr just like when someone makes you a playlist", broken: "nobody has made me a playlist since 2019"},
    {beautiful: "my dad shaved his head when my mom started chemo", broken: "i was too young to remember it but ive seen the photos"},
    {beautiful: "my favorite tree on the way to work just started flowering", broken: "they're cutting it down for a sidewalk repair"},
    {beautiful: "the way old friends finish your sentences", broken: "we live in different cities now"},
    {beautiful: "honestly the gym after a really long day", broken: "i havent been in 6 weeks"},
    {beautiful: "ngl the way my dog runs in his sleep", broken: "hes 11"},
    {beautiful: "a hot meal at a friends apartment", broken: "my freezer is full of trader joes meals"},
    {beautiful: "the way my mom calls me beta even tho ive been an adult for years", broken: "she's getting older idk how to deal with it"},
    {beautiful: "ok this is dumb but my plants are alive", broken: "i killed 3 last year"},
    {beautiful: "honestly im still here", broken: "honestly im still here"},
    {beautiful: "my partner saying my name in a way nobody else has", broken: "knowing how good they are at it"},
    {beautiful: "lowkey just like the city after a snowstorm at 6am", broken: "the city after a snowstorm at 6pm"},
    {beautiful: "the friend i lost touch with sliding into my dms last week", broken: "ive been ignoring 3 other people for months"},
    {beautiful: "honestly when the AC kicks on and the apartment cools down", broken: "the electric bill"},
  ];

  // Load responses (merged: real Firebase + seed) and build infinite scroll wall
  seeOthersBtn.addEventListener('click', () => {
    transitionTo(screen3, screen4);

    db.ref('responses').once('value', (snapshot) => {
      const data = snapshot.val() || {};
      const realEntries = Object.values(data).filter(entry => !isFiltered(entry));
      const all = [...realEntries, ...SEED_RESPONSES];
      buildScrollTrack(all);
    });
  });
});
