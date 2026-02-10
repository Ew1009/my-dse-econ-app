import streamlit as st
import json
import random
import requests
import base64

# 1. PAGE ENGINE & SECRETS
st.set_page_config(page_title="DSE Econ Hub v2.1", layout="wide", initial_sidebar_state="expanded")

# 2. INJECTING YOUR ENTIRE V0.1 CSS (The "Anti-Garbage" Layer)
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    :root {
      --primary: #2563eb; --primary-dark: #1d4ed8; --accent: #06b6d4;
      --bg-primary: #f8fafc; --bg-secondary: #ffffff; --text-main: #1e293b;
    }

    /* KILL STREAMLIT UI */
    .stApp { background-color: var(--bg-primary); }
    header {visibility: hidden;}
    footer {visibility: hidden;}
    
    /* THE SIDEBAR (Your v0.1 Style) */
    [data-testid="stSidebar"] {
        background-color: #0f172a !important;
        border-right: 1px solid #1e293b;
    }
    [data-testid="stSidebar"] * { color: #f1f5f9 !important; font-family: 'Plus Jakarta Sans'; }

    /* MODERN CARDS (Glassmorphism) */
    div[data-testid="stVerticalBlock"] > div:has(div.stMarkdown) {
        background: white;
        padding: 30px;
        border-radius: 20px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05);
        transition: all 0.3s ease;
    }

    /* MCQ BUTTONS STYLE */
    .stButton > button {
        width: 100%;
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: white !important;
        border: none;
        border-radius: 12px;
        padding: 15px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    /* TYPOGRAPHY */
    h1, h2, h3 { font-family: 'Plus Jakarta Sans', sans-serif !important; font-weight: 800 !important; color: #0f172a; }
    </style>
    """, unsafe_allow_html=True)

# 3. SECURE AI LOGIC (Llama-3-70B)
def get_ai_response(prompt):
    API_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-70B-Instruct"
    headers = {"Authorization": f"Bearer {st.secrets['HF_TOKEN']}"}
    payload = {
        "inputs": f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>You are a DSE Economics Tutor. Use exam keywords.<|eot_id|><|start_header_id|>user<|end_header_id|>{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>",
        "parameters": {"max_new_tokens": 1000}
    }
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        return response.json()[0]['generated_text']
    except:
        return "⚠️ Model is loading. Please wait 30 seconds."

# 4. QUESTION DATA ENGINE
@st.cache_data
def load_bank():
    with open('questions.json', 'r', encoding='utf-8') as f:
        return json.load(f)

# 5. UI STATE MANAGEMENT
if 'q' not in st.session_state:
    st.session_state.q = random.choice(load_bank())
if 'score' not in st.session_state:
    st.session_state.score = 0

# 6. SIDEBAR (The Original Sidebar Look)
with st.sidebar:
    st.markdown("<h1 style='color:white;'>🎓 DSE ECON</h1>", unsafe_allow_html=True)
    st.write("---")
    nav = st.radio("NAVIGATE", ["📊 Dashboard", "🤖 AI Tutor", "📝 Practice", "📚 Formulas"])
    st.write("---")
    st.write(f"Accuracy: {st.session_state.score}%")

# 7. MAIN MODULES
if nav == "📊 Dashboard":
    st.title("Student Performance Hub")
    c1, c2, c3 = st.columns(3)
    c1.metric("Progress", "High", "+12%")
    c2.metric("MCQs Done", len(load_bank()))
    c3.metric("AI Status", "Online")
    
    st.markdown("### 📈 Recent Activity")
    st.write("You are currently focusing on **Market & Efficiency**. Keep it up!")

elif nav == "🤖 AI Tutor":
    st.title("Llama-3 Theory Assistant")
    query = st.text_area("What Econ concept are you struggling with?", placeholder="e.g. Wealth Effect vs Substitution Effect")
    if st.button("EXPLAIN CONCEPT"):
        with st.spinner("Analyzing DSE Curriculum..."):
            st.markdown(get_ai_response(query))

elif nav == "📝 Practice":
    q = st.session_state.q
    st.title("Exam Practice")
    st.markdown(f"**Topic:** `{q['topic']}`")
    
    # Use st.info to mimic your original Blue Question Box
    st.info(q['question'])
    
    choice = st.radio("Select the correct option:", q['options'], key="mcq_select")
    
    col1, col2 = st.columns(2)
    with col1:
        if st.button("SUBMIT"):
            if choice.startswith(q['answer']):
                st.success
