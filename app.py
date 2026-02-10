import streamlit as st
import json
import random
import requests

# 1. SETUP
st.set_page_config(page_title="DSE Econ Hub v2.1", layout="wide")

# 2. THE "SAFETY SHIELD" CSS (Prevents white-on-white merging)
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
    
    /* FORCE BACKGROUND COLOR */
    .stApp {
        background-color: #f8fafc !important;
    }

    /* FORCE MAIN TEXT VISIBILITY */
    h1, h2, h3, p, span, div, label {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        color: #0f172a !important; /* Dark Slate - Always readable on white */
    }

    /* SIDEBAR PROTECTION: Dark background, White text */
    [data-testid="stSidebar"] {
        background-color: #0f172a !important;
    }
    [data-testid="stSidebar"] * {
        color: #ffffff !important; /* Force all sidebar text to be pure white */
    }
    
    /* INPUT BOXES: Ensure text inside isn't white */
    input, textarea {
        color: #0f172a !important;
        background-color: #ffffff !important;
    }

    /* CARDS (From your v0.1) */
    .econ-card {
        background: white !important;
        padding: 25px;
        border-radius: 15px;
        border: 1px solid #e2e8f0 !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        margin-bottom: 20px;
    }

    /* SUCCESS/ERROR BOXES: Force high contrast */
    .stSuccess { background-color: #dcfce7 !important; color: #166534 !important; }
    .stError { background-color: #fee2e2 !important; color: #991b1b !important; }
    </style>
    """, unsafe_allow_html=True)

# 3. BACKEND (AI & Data)
def ask_ai(prompt):
    API_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-70B-Instruct"
    headers = {"Authorization": f"Bearer {st.secrets['HF_TOKEN']}"}
    payload = {"inputs": f"DSE Econ Tutor: {prompt}", "parameters": {"max_new_tokens": 500}}
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        return response.json()[0]['generated_text']
    except:
        return "AI is sleeping. Refresh in 30s."

@st.cache_data
def load_qs():
    with open('questions.json', 'r', encoding='utf-8') as f:
        return json.load(f)

# 4. SIDEBAR
with st.sidebar:
    st.markdown("<h2 style='color:white !important;'>🎓 DSE ECON</h2>", unsafe_allow_html=True)
    st.write("---")
    page = st.radio("SELECT MODULE", ["📊 Dashboard", "🤖 AI Tutor", "📝 MCQs"])

# 5. PAGES
if page == "📊 Dashboard":
    st.markdown("<div class='econ-card'><h1>Welcome back</h1><p>Your progress is synced.</p></div>", unsafe_allow_html=True)
    col1, col2 = st.columns(2)
    col1.metric("Questions", "300+")
    col2.metric("Status", "Online")

elif page == "🤖 AI Tutor":
    st.title("Llama-3 Tutor")
    u_query = st.text_area("Ask any Econ concept:")
    if st.button("Explain"):
        with st.spinner("Thinking..."):
            ans = ask_ai(u_query)
            st.markdown(f"<div class='econ-card'>{ans}</div>", unsafe_allow_html=True)

elif page == "📝 MCQs":
    qs = load_qs()
    if 'current_q' not in st.session_state:
        st.session_state.current_q = random.choice(qs)
    
    q = st.session_state.current_q
    
    st.markdown(f"<div class='econ-card'><h3>{q['topic']}</h3><p>{q['question']}</p></div>", unsafe_allow_html=True)
    
    user_choice = st.radio("Answer:", q['options'])
    
    if st.button("Submit"):
        if user_choice.startswith(q['answer']):
            st.success("Correct!")
        else:
            st.error(f"Wrong. Correct: {q['answer']}")
    
    if st.button("Next Question"):
        st.session_state.current_q = random.choice(qs)
        st.rerun()
