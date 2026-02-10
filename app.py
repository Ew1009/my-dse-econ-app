import streamlit as st
import json

# 1. SETUP
st.set_page_config(page_title="DSE Econ Hub v2.1", layout="wide")

# 2. DATA LOADING (Python handles the file reading)
def get_data():
    try:
        with open('questions.json', 'r', encoding='utf-8') as f:
            return json.dumps(json.load(f))
    except:
        return "[]"

data_payload = get_data()

# 3. THE UI (Your Original Source Code + Small Fixes)
st.components.v1.html(f"""
<!DOCTYPE html>
<html>
<head>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        /* YOUR EXACT CSS FROM V2.1 */
        :root {{
            --pr: #2563eb; --bg0: #f8fafc; --bg1: #ffffff;
            --tx1: #1e293b; --tx2: #475569; --bd: #e2e8f0;
        }}
        body {{ 
            background: var(--bg0); font-family: 'Plus Jakarta Sans', sans-serif; 
            color: var(--tx1); margin: 0; padding: 20px;
        }}
        .card {{
            background: var(--bg1); border-radius: 20px; padding: 30px;
            border: 1px solid var(--bd); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            max-width: 850px; margin: 40px auto;
        }}
        .opt-btn {{
            width: 100%; padding: 16px; margin: 12px 0; text-align: left;
            border: 2px solid var(--bd); border-radius: 12px; background: white;
            cursor: pointer; font-size: 16px; transition: 0.2s;
        }}
        .opt-btn:hover {{ border-color: var(--pr); background: #f0f7ff; }}
        .correct {{ background: #dcfce7 !important; border-color: #22c55e !important; }}
        .wrong {{ background: #fee2e2 !important; border-color: #ef4444 !important; }}
        
        .nav-btn {{
            background: var(--pr); color: white; border: none; padding: 12px 30px;
            border-radius: 10px; font-weight: 700; cursor: pointer; float: right;
        }}
    </style>
</head>
<body>
    <div class="card">
        <div id="topic" style="color:var(--pr); font-weight:800; margin-bottom:10px;">LOADING...</div>
        <h2 id="question" style="margin-bottom:30px; line-height:1.4;"></h2>
        <div id="options-box"></div>
        <div style="margin-top:30px; border-top:1px solid var(--bd); padding-top:20px;">
            <button class="nav-btn" onclick="newQuestion()">Next Question <i class="fas fa-chevron-right"></i></button>
        </div>
    </div>

    <script>
        // DATA BRIDGE: Injected from Python
        const questions = {data_payload};
        let currentQ = null;

        function newQuestion() {{
            if (questions.length === 0) {{
                document.getElementById('question').innerText = "questions.json is empty or not found.";
                return;
            }}
            currentQ = questions[Math.floor(Math.random() * questions.length)];
            document.getElementById('topic').innerText = "TOPIC: " + currentQ.topic.toUpperCase();
            document.getElementById('question').innerText = currentQ.question;
            
            const box = document.getElementById('options-box');
            box.innerHTML = '';
            
            currentQ.options.forEach(opt => {{
                const b = document.createElement('button');
                b.className = 'opt-btn';
                b.innerText = opt;
                b.onclick = () => {{
                    // logic to check answer (e.g. if opt starts with A and answer is A)
                    if (opt.trim().startsWith(currentQ.answer)) {{
                        b.classList.add('correct');
                    }} else {{
                        b.classList.add('wrong');
                    }}
                }};
                box.appendChild(b);
            }});
        }}

        // Start the app
        newQuestion();
    </script>
</body>
</html>
""", height=800)
