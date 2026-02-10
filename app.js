let questions = [];
let currentQuestion = null;
let stats = { correct: 0, total: 0 };

// 1. Fetch data from the JSON file
async function initApp() {
    try {
        const response = await fetch('questions.json');
        questions = await response.json();
        renderNewQuestion();
    } catch (err) {
        console.error("Failed to load question bank:", err);
    }
}

// 2. The Logic to pick a question
function renderNewQuestion() {
    if (questions.length === 0) return;
    
    currentQuestion = questions[Math.floor(Math.random() * questions.length)];
    
    document.getElementById('topic-display').innerText = currentQuestion.topic;
    document.getElementById('q-text').innerText = currentQuestion.question;
    
    const optionsContainer = document.getElementById('options-grid');
    optionsContainer.innerHTML = '';
    
    currentQuestion.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, btn);
        optionsContainer.appendChild(btn);
    });
}

// 3. The Correct/Wrong Logic
function checkAnswer(selected, btn) {
    const isCorrect = selected.trim().startsWith(currentQuestion.answer);
    const allBtns = document.querySelectorAll('.option-btn');
    
    allBtns.forEach(b => b.disabled = true); // Prevent double clicking

    if (isCorrect) {
        btn.classList.add('correct-style');
        stats.correct++;
    } else {
        btn.classList.add('wrong-style');
        // Auto-highlight the right answer
        allBtns.forEach(b => {
            if(b.innerText.trim().startsWith(currentQuestion.answer)) b.classList.add('correct-style');
        });
    }
    stats.total++;
    updateDashboard();
}

function updateDashboard() {
    const pct = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    document.getElementById('stat-accuracy').innerText = pct + "%";
}

window.onload = initApp;
