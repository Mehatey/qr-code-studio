document.addEventListener('DOMContentLoaded', () => {
    // ============ Firebase Config (Version 8) ============
    const firebaseConfig = {
      apiKey: "AIzaSyAhKNE7ycFQ...",
      authDomain: "good-or-bad-or-nothing-at-all.firebaseapp.com",
      databaseURL: "https://good-or-bad-or-nothing-at-all-default-rtdb.firebaseio.com",
      projectId: "good-or-bad-or-nothing-at-all",
      storageBucket: "good-or-bad-or-nothing-at-all.appspot.com",
      messagingSenderId: "591627005378",
      appId: "1:591627005378:web:40255eabc81a8afa943a5b"
    };
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
  
    // ============ DOM References ============
    const intro = document.getElementById('intro');
    const questions = document.getElementById('questions');
    const responses = document.getElementById('responses');
    const responseList = document.getElementById('responseList');
  
    const headerText = document.getElementById('headerText');
    const disclaimer = document.getElementById('disclaimer');
    const q1 = document.getElementById('q1');
    const q2 = document.getElementById('q2');
  
    // Show the header & disclaimer immediately to start typewriter
    headerText.classList.remove('hidden');
    disclaimer.classList.remove('hidden');
  
    // Once the typing animations end, remove the cursor
    [headerText, disclaimer, q1, q2].forEach(element => {
      element.addEventListener('animationend', () => {
        // Stop the blinking cursor
        element.classList.add('done-typing');
      });
    });
  
    // After disclaimers, show questions in sequence
    // We'll wait 4s after disclaimers finish, so about 6s total
    setTimeout(() => {
      intro.classList.add('hidden');
      questions.classList.remove('hidden');
      // Reveal the first question & start its typewriter
      q1.classList.remove('hidden');
      // Then reveal second question 3s later
      setTimeout(() => {
        q2.classList.remove('hidden');
      }, 3000);
    }, 6000);
  
    // On button click, store & retrieve
    document.getElementById('submit').addEventListener('click', () => {
      const beautifulResponse = document.getElementById('beautifulInput').value.trim();
      const brokenResponse = document.getElementById('brokenInput').value.trim();
  
      if (!beautifulResponse || !brokenResponse) {
        alert("Please answer both questions.");
        return;
      }
  
      // Push to Firebase
      database.ref('responses').push({
        beautiful: beautifulResponse,
        broken: brokenResponse
      });
  
      // Hide questions, show responses
      questions.classList.add('hidden');
      responses.classList.remove('hidden');
  
      // Retrieve from Firebase & display
      database.ref('responses').once('value', (snapshot) => {
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
  