import streamlit as st
import json
import random
import requests

# 1. BASIC CONFIG (No heavy CSS to prevent blank screens)
st.set_page_config(page_title="DSE Econ Hub", layout="centered")

# 2. AI ENGINE (Hugging Face - Llama 3)
def ask_ai(user_query):
    # Using the 70B model as it stays 'awake' more often
    API_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-70B-Instruct"
    headers = {"Authorization": f"Bearer {st.secrets['HF_TOKEN']}"}
    payload = {
        "inputs": f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\nYou are an expert HKDSE Economics tutor.<|eot_id|><|start_header_id|>user<|end_header_id|>\n{user_query}<|eot_id|><|start_header_id|>assistant<|end_header_id|>",
        "parameters": {"max_new_tokens": 500}
    }
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        res_json = response.json()
        if isinstance(res_json, list):
            return res_json[0]['generated_text']
        return "AI is loading. Please wait 30 seconds and try again."
    except:
        return "Error: Please check if HF_TOKEN is set in Streamlit Secrets."

# 3. LOAD QUESTIONS
def load_questions():
    try:
        with open('questions.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return [{"topic": "General", "question": "JSON file not found. Please upload questions.json", "options": ["A","B","C","D"], "answer": "A"}]

# 4. INITIALIZE SESSION
if 'current_q' not in st.session_state:
    qs = load_questions()
    st.session_state.current_q = random.choice(qs)

# 5. SIMPLE SIDEBAR
with st.sidebar:
    st.title("🎓 DSE Econ Hub")
    page = st.radio("Menu", ["📊 Dashboard", "🤖 AI Tutor", "📝 MCQ Practice"])

# 6. DASHBOARD
if page == "📊 Dashboard":
    st.title("Economics Dashboard")
    st.write("Welcome! Use the sidebar to navigate between the AI Tutor and MCQ Practice.")

# 7. AI TUTOR
elif page == "🤖 AI Tutor":
    st.title("AI Tutor")
    u_input = st.text_input("Ask a question (e.g., Why is the demand curve downward sloping?)")
    if st.button("Ask AI"):
        with st.spinner("Tutor is thinking..."):
            answer = ask_ai(u_input)
            st.info(answer)

# 8. MCQ PRACTICE
elif page == "📝 MCQ Practice":
    st.title("Practice Mode")
    q = st.session_state.current_q
    
    st.subheader(f"Topic: {q['topic']}")
    st.markdown(f"**Question:** {q['question']}")
    
    choice = st.radio("Select your answer:", q['options'], key="mcq_select")
    
    if st.button("Check Answer"):
        if choice.startswith(q['answer']):
            st.success(f"Correct! The answer is {q['answer']}.")
        else:
            st.error(f"Incorrect. The correct answer is {q['answer']}.")
            
    if st.button("Next Question"):
        st.session_state.current_q = random.choice(load_questions())
        st.rerun()
