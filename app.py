import streamlit as st
import json
import random
import requests

# 1. PAGE SETUP & BEAUTIFICATION
st.set_page_config(page_title="DSE Econ Hub", layout="wide")

# This is the "Magic" that fixes the UI
st.markdown("""
    <style>
    /* Force high contrast for the sidebar */
    section[data-testid="stSidebar"] {
        background-color: #1e293b !important; /* Dark Blue Sidebar */
    }
    section[data-testid="stSidebar"] * {
        color: white !important; /* Force all sidebar text to be white */
    }
    
    /* Make the question box pop */
    .stInfo {
        background-color: #eff6ff !important;
        border: 1px solid #bfdbfe !important;
        color: #1e3a8a !important;
        font-weight: 600;
    }

    /* Fix the Dashboard white-out */
    .stMarkdown h1, h2, h3 {
        color: #0f172a !important;
    }
</style>
    """, unsafe_allow_html=True)

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

# 4. INITIALIZE SESSION STATE
if 'current_q' not in st.session_state:
    questions = load_questions()
    st.session_state.current_q = random.choice(questions) if questions else None

# 5. SIDEBAR
with st.sidebar:
    st.title("🎓 DSE Econ Hub")
    st.caption("Version 2.1.2 • Open Source")
    st.write("---")
    page = st.radio("MAIN MENU", ["📊 Dashboard", "🤖 AI Tutor", "📝 MCQ Practice"])

# 6. DASHBOARD
if page == "📊 Dashboard":
    st.title("Welcome Back, Scholar")
    st.markdown("### Your Economic Command Center")
    
    c1, c2, c3 = st.columns(3)
    c1.metric("Course Progress", "12%")
    c2.metric("Accuracy", "88%")
    c3.metric("Study Streak", "4 Days")
    
    st.write("---")
    st.markdown("#### Quick Tips for DSE")
    st.write("1. Always define your terms first.")
    st.write("2. Remember: Marginal Benefit = Marginal Cost for efficiency.")

# 7. AI TUTOR
elif page == "🤖 AI Tutor":
    st.title("AI Tutor")
    st.write("Ask me to clarify any economic theory.")
    u_input = st.text_input("What would you like to learn?", placeholder="e.g. Why is the LRAS curve vertical?")
    if st.button("Generate Explanation"):
        with st.spinner("Analyzing theory..."):
            st.markdown(ask_ai(u_input))

# 8. MCQ PRACTICE
elif page == "📝 MCQ Practice":
    st.title("Practice Exam")
    all_questions = load_questions()
    
    if not st.session_state.current_q:
        st.error("No questions found in questions.json!")
    else:
        q = st.session_state.current_q
        st.subheader(f"Topic: {q.get('topic', 'General')}")
        st.info(q['question'])
        
        user_choice = st.radio("Select the best answer:", q['options'], key="choice")
        
        c1, c2 = st.columns(2)
        with c1:
            if st.button("Submit Answer"):
                if user_choice.startswith(q['answer']):
                    st.success(f"✅ Correct! The answer is {q['answer']}.")
                else:
                    st.error(f"❌ Incorrect. The correct answer is {q['answer']}.")
                st.write(f"**Explanation:** {q.get('explanation', 'Refer to DSE curriculum.')}")
        
        with c2:
            if st.button("Next Question"):
                st.session_state.current_q = random.choice(all_questions)
                st.rerun()

