// Final script.js for Firebase integration with word limit and submission animation
const firebaseConfig = {
    apiKey: "AIzaSyAhKNE7ycFQGo_0OUChCRRSh6jKom6rWyk",
    authDomain: "good-or-bad-or-nothing-at-all.firebaseapp.com",
    databaseURL: "https://good-or-bad-or-nothing-at-all-default-rtdb.firebaseio.com",
    projectId: "good-or-bad-or-nothing-at-all",
    storageBucket: "good-or-bad-or-nothing-at-all.appspot.com",
    messagingSenderId: "591627005378",
    appId: "1:591627005378:web:40255eabc81a8afa943a5b",
    measurementId: "G-7CPTXQKWG6"
  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();
  
  document.addEventListener('DOMContentLoaded', () => {
    const intro = document.getElementById('intro');
    const questions = document.getElementById('questions');
    const submitButton = document.getElementById('submit');
    const beautifulInput = document.getElementById('beautifulInput');
    const brokenInput = document.getElementById('brokenInput');
  
    setTimeout(() => {
      intro.classList.add('hidden');
      questions.classList.remove('hidden');
    }, 6000);
  
    function checkWordLimit() {
      const beautifulWords = beautifulInput.value.trim().split(/\s+/).length;
      const brokenWords = brokenInput.value.trim().split(/\s+/).length;
      submitButton.disabled = !(beautifulWords >= 1 && beautifulWords <= 20 && brokenWords >= 1 && brokenWords <= 20);
    }
  
    beautifulInput.addEventListener('input', checkWordLimit);
    brokenInput.addEventListener('input', checkWordLimit);
  
    submitButton.addEventListener('click', () => {
      const beautiful = beautifulInput.value.trim();
      const broken = brokenInput.value.trim();
  
      if (!beautiful || !broken) {
        alert('Please fill in both responses!');
        return;
      }
  
      db.ref('responses').push({ beautiful, broken });
  
      questions.classList.add('hidden');
      const responses = document.getElementById('responses');
      responses.classList.remove('hidden');
  
      const tick = document.createElement('div');
      tick.classList.add('tick');
      tick.innerHTML = '✔️ You have submitted your beliefs';
      responses.appendChild(tick);
  
      setTimeout(() => {
        tick.remove();
        db.ref('responses').on('value', (snapshot) => {
          const responseList = document.getElementById('responseList');
          responseList.innerHTML = '';
          snapshot.forEach((child) => {
            const data = child.val();
            responseList.innerHTML += `<p><strong>Beautiful:</strong> ${data.beautiful}</p>`;
            responseList.innerHTML += `<p><strong>Broken:</strong> ${data.broken}</p>`;
          });
        });
      }, 2000);
    });
  });
  