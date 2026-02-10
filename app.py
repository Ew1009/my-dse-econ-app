import streamlit as st
import json
import random
import requests

# 1. PAGE SETUP
st.set_page_config(page_title="DSE Econ Hub", layout="wide")

# Force the "Plus Jakarta Sans" look from your original app
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
    html, body, [class*="css"] { font-family: 'Plus Jakarta Sans', sans-serif; }
    .stMetric { background: white; padding: 15px; border-radius: 10px; border: 1px solid #eee; }
    </style>
    """, unsafe_allow_html=True)

# 2. SECURE AI ENGINE
def ask_ai(query):
    API_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-70B-Instruct"
    # Safely pull the token that GitHub can't see
    headers = {"Authorization": f"Bearer {st.secrets['HF_TOKEN']}"}
    payload = {"inputs": f"You are a HKDSE Economics tutor. {query}"}
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        return response.json()[0]['generated_text']
    except:
        return "Tutor is busy. Try again in 30 seconds!"

# 3. DATA LOADER
def load_data():
    with open('questions.json', 'r', encoding='utf-8') as f:
        return json.load(f)

# 4. SIDEBAR NAVIGATION
with st.sidebar:
    st.title("🎓 DSE Econ Hub")
    page = st.radio("MENU", ["📊 Dashboard", "🤖 AI Tutor", "📝 MCQ Practice"])

# 5. MODULES
if page == "📊 Dashboard":
    st.header("Welcome, Economics Scholar")
    col1, col2 = st.columns(2)
    col1.metric("Course Progress", "Ready", delta="100%")
    col2.metric("Questions Available", "300+", delta="Updated")

elif page == "🤖 AI Tutor":
    st.header("Llama-3 AI Tutor")
    u_input = st.text_input("Explain an Econ concept...")
    if st.button("Explain"):
        st.write(ask_ai(u_input))

elif page == "📝 MCQ Practice":
    questions = load_data()
    if 'q' not in st.session_state:
        st.session_state.q = random.choice(questions)
    
    q = st.session_state.q
    st.info(f"**Topic:** {q['topic']}")
    st.write(q['question'])
    
    ans = st.radio("Select Answer:", q['options'])
    if st.button("Submit"):
        if ans.startswith(q['answer']):
            st.success("Correct!")
        else:
            st.error(f"Wrong. Correct answer: {q['answer']}")
    
    if st.button("Next Question"):
        st.session_state.q = random.choice(questions)
        st.rerun()