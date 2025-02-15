document.addEventListener('DOMContentLoaded', () => {
    // Firebase config (Version 8)
    const firebaseConfig = {
      apiKey: "AIzaSy...",
      authDomain: "good-or-bad-or-nothing-at-all.firebaseapp.com",
      databaseURL: "https://good-or-bad-or-nothing-at-all-default-rtdb.firebaseio.com",
      projectId: "good-or-bad-or-nothing-at-all",
      storageBucket: "good-or-bad-or-nothing-at-all.appspot.com",
      messagingSenderId: "591627005378",
      appId: "1:591627005378:web:40255eabc81a8afa943a5b"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
  
    // Screen references
    const screen1 = document.getElementById('screen1');
    const screen2 = document.getElementById('screen2');
    const screen3 = document.getElementById('screen3'); // confirmation
    const screen4 = document.getElementById('screen4'); // past responses
  
    // Elements
    const arrowCircle = document.getElementById('arrowCircle');
    const beautifulInput = document.getElementById('beautifulInput');
    const brokenInput = document.getElementById('brokenInput');
    const submitBtn = document.getElementById('submitBtn');
    const seeOthersBtn = document.getElementById('seeOthersBtn');
    const responseList = document.getElementById('responseList');
  
    // ============= NAVIGATION =============
    // Arrow on screen1 -> screen2
    arrowCircle.addEventListener('click', () => {
      screen1.classList.add('hidden');
      screen2.classList.remove('hidden');
    });
  
    // ============= ENABLE/DISABLE SUBMIT =============
    function updateButtonState() {
      const hasBeautiful = beautifulInput.value.trim().length > 0;
      const hasBroken = brokenInput.value.trim().length > 0;
      if (hasBeautiful && hasBroken) {
        submitBtn.disabled = false;
        submitBtn.classList.add('enabled');
      } else {
        submitBtn.disabled = true;
        submitBtn.classList.remove('enabled');
      }
    }
    beautifulInput.addEventListener('input', updateButtonState);
    brokenInput.addEventListener('input', updateButtonState);
  
    // ============= SUBMIT -> SCREEN3 (CONFIRMATION) =============
    submitBtn.addEventListener('click', () => {
      if (submitBtn.disabled) return;
  
      const beautiful = beautifulInput.value.trim();
      const broken = brokenInput.value.trim();
  
      // Push data to Firebase
      db.ref('responses').push({ beautiful, broken });
  
      // Hide screen2, show screen3 (confirmation)
      screen2.classList.add('hidden');
      screen3.classList.remove('hidden');
    });
  
    // ============= SEE OTHERS -> SCREEN4 (PAST RESPONSES) =============
    seeOthersBtn.addEventListener('click', () => {
      screen3.classList.add('hidden');
      screen4.classList.remove('hidden');
  
      // Retrieve data from Firebase
      db.ref('responses').once('value', (snapshot) => {
        const data = snapshot.val() || {};
        let html = '';
        Object.keys(data).forEach((key) => {
          html += `<p><strong>Beautiful:</strong> ${data[key].beautiful}</p>`;
          html += `<p><strong>Broken:</strong> ${data[key].broken}</p>`;
          html += '<hr>';
        });
        responseList.innerHTML = html;
      });
    });
  });
  