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
  
    // 1) Fade in the header & disclaimer immediately
    headerText.classList.remove('hidden');
    disclaimer.classList.remove('hidden');
    headerText.classList.add('fade-in');
    disclaimer.classList.add('fade-in');
  
    // 2) After 4 seconds, hide the intro and fade in the questions
    setTimeout(() => {
      intro.classList.add('hidden');
  
      questions.classList.remove('hidden');
      q1.classList.remove('hidden');
      q2.classList.remove('hidden');
  
      // Fade them in
      q1.classList.add('fade-in');
      q2.classList.add('fade-in');
    }, 4000);
  
    // 3) On button click, store & retrieve
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
  