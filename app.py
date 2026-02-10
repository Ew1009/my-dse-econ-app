import streamlit as st
import json
import random
import requests

# 1. PAGE SETUP
st.set_page_config(page_title="DSE Econ Hub", layout="wide")

# 2. AI ENGINE (Hugging Face)
def ask_ai(user_query):
    API_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct"
    headers = {"Authorization": f"Bearer {st.secrets['HF_TOKEN']}"}
    payload = {
        "inputs": f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\nYou are an expert HKDSE Economics tutor. Use DSE terminology.<|eot_id|><|start_header_id|>user<|end_header_id|>\n{user_query}<|eot_id|><|start_header_id|>assistant<|end_header_id|>",
        "parameters": {"max_new_tokens": 500, "return_full_text": False}
    }
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        output = response.json()
        if isinstance(output, list):
            return output[0]['generated_text']
        return "The AI is warming up. Try again in 1 minute."
    except:
        return "Connection Error. Check your HF_TOKEN."

# 3. LOAD QUESTIONS
def load_questions():
    try:
        with open('questions.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

# 4. INITIALIZE SESSION STATE (The "Glue" that fixes your error)
if 'current_q' not in st.session_state:
    questions = load_questions()
    if questions:
        st.session_state.current_q = random.choice(questions)
    else:
        st.session_state.current_q = None

# 5. SIDEBAR
with st.sidebar:
    st.title("🎓 DSE Econ v2.1")
    page = st.radio("Navigation", ["Dashboard", "AI Tutor", "MCQ Practice"])

# 6. DASHBOARD
if page == "Dashboard":
    st.title("Welcome to your Economics Hub")
    st.write("This app is running live on Streamlit Cloud.")

# 7. AI TUTOR
elif page == "AI Tutor":
    st.title("🤖 AI Economics Tutor")
    u_input = st.text_input("Ask a question:")
    if st.button("Explain"):
        with st.spinner("Thinking..."):
            st.write(ask_ai(u_input))

# 8. MCQ PRACTICE (Fixed logic)
elif page == "MCQ Practice":
    st.title("📝 Practice Mode")
    all_questions = load_questions()
    
    if not st.session_state.current_q:
        st.error("No questions found in questions.json!")
    else:
        q = st.session_state.current_q
        st.subheader(f"Topic: {q.get('topic', 'General')}")
        st.write(q['question'])
        
        # We save the user's choice into session_state so it doesn't disappear
        user_choice = st.radio("Select your answer:", q['options'], key="user_choice_radio")
        
        col1, col2 = st.columns(2)
        
        with col1:
            if st.button("Submit Answer"):
                if user_choice.startswith(q['answer']):
                    st.success(f"Correct! The answer is {q['answer']}.")
                    st.write(q.get('explanation', ''))
                else:
                    st.error(f"Incorrect. The correct answer is {q['answer']}.")
                    st.write(q.get('explanation', ''))
        
        with col2:
            if st.button("Next Question"):
                st.session_state.current_q = random.choice(all_questions)
                st.rerun()
