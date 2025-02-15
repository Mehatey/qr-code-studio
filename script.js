document.addEventListener('DOMContentLoaded', () => {
    // Firebase config for your project
    const firebaseConfig = {
      apiKey: "AIzaSy...",
      authDomain: "good-or-bad-or-nothing-at-all.firebaseapp.com",
      databaseURL: "https://good-or-bad-or-nothing-at-all-default-rtdb.firebaseio.com",
      projectId: "good-or-bad-or-nothing-at-all",
      storageBucket: "good-or-bad-or-nothing-at-all.appspot.com",
      messagingSenderId: "591627005378",
      appId: "1:591627005378:web:40255eabc81a8afa943a5b"
    };
  
    // Initialize Firebase (version 8 style)
    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
  
    // Grab references
    const intro = document.getElementById('intro');
    const questions = document.getElementById('questions');
    const responses = document.getElementById('responses');
    const responseList = document.getElementById('responseList');
  
    // Show questions after disclaimer
    setTimeout(() => {
      intro.classList.add('hidden');
      questions.classList.remove('hidden');
    }, 6000);
  
    // On button click: store & retrieve
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
  
      // Retrieve data from Firebase & display
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
  