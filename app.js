let bank = [];
let currentQ = null;

// 1. Fetch questions from the JSON file
async function loadApp() {
    try {
        const response = await fetch('questions.json');
        bank = await response.json();
        nextQuestion();
    } catch (err) {
        document.getElementById('question').innerText = "Error: Could not load questions.json";
    }
}

// 2. Pick and display a random question
function nextQuestion() {
    if (bank.length === 0) return;
    
    currentQ = bank[Math.floor(Math.random() * bank.length)];
    document.getElementById('topic').innerText = "TOPIC: " + currentQ.topic;
    document.getElementById('question').innerText = currentQ.question;
    
    const container = document.getElementById('options');
    container.innerHTML = ''; // Clear old buttons
    
    currentQ.options.forEach(optionText => {
        const btn = document.createElement('button');
        btn.className = 'opt';
        btn.innerText = optionText;
        btn.onclick = () => checkAnswer(optionText, btn);
        container.appendChild(btn);
    });
}

// 3. Check if the clicked button is correct
function checkAnswer(choice, btn) {
    const isCorrect = choice.trim().startsWith(currentQ.answer);
    
    if (isCorrect) {
        btn.classList.add('correct');
    } else {
        btn.classList.add('wrong');
        // Find the right button and highlight it green
        const allButtons = document.querySelectorAll('.opt');
        allButtons.forEach(b => {
            if (b.innerText.trim().startsWith(currentQ.answer)) {
                b.classList.add('correct');
            }
        });
    }
}

// Start the app when the page loads
window.onload = loadApp;