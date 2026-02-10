import streamlit as st
import json
import random
import requests

# 1. THE ULTIMATE UI FIX (Forces Colors)
st.set_page_config(page_title="DSE Econ Hub", layout="wide")

st.markdown("""
    <style>
    /* Force Sidebar to be Dark and Text to be White */
    [data-testid="stSidebar"] {
        background-color: #0f172a !important;
        color: white !important;
    }
    [data-testid="stSidebar"] * {
        color: white !important;
    }
    /* Make the Main area clean */
    .stApp { background-color: #f1f5f9; }
    
    /* Style Question Boxes */
    .stInfo {
        background-color: #ffffff !important;
        color: #1e293b !important;
        border-left: 5px solid #3b82f6 !important;
        border-radius: 8px;
        padding: 20px;
    }
    /* Fix Button Colors */
    .stButton>button {
        background-color: #3b82f6;
        color: white;
        border-radius: 5px;
    }
    </style>
    """, unsafe_allow_html=True)

# 2. AI ENGINE (Hugging Face)
def ask_ai(user_query):
    # If the 8B model is "warming up", we use the 70B one which is usually more stable
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
        return "Model is loading. Give it 30 seconds and click 'Generate' again!"
    except:
        return "Check your HF_TOKEN in Streamlit Secrets!"

# 3. LOAD QUESTIONS
def load_questions():
    try:
        with open('questions.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return [{"topic": "Error", "question": "JSON not found!", "options": ["A","B","C","D"], "answer": "A"}]

# 4. DATA INITIALIZATION
if 'current_q' not in st.session_state:
    qs = load_questions()
    st.session_state.current_q = random.choice(qs)

# 5. SIDEBAR MENU
with st.sidebar:
    st.title("🎓 DSE Econ Hub")
    st.write("---")
    page = st.radio("SELECT MODULE", ["📊 Dashboard", "🤖 AI Tutor", "📝 MCQ Practice"])

# 6. DASHBOARD
if page == "📊 Dashboard":
    st.title("Study Dashboard")
    st.markdown("### Welcome back!")
    st.write("Your app is now configured with Hugging Face Llama-3.")

# 7. AI TUTOR
elif page == "🤖 AI Tutor":
    st.title("AI Tutor")
    u_input = st.text_input("Ask a question:", placeholder="e.g. Why is LRAS vertical?")
    if st.button("Generate Explanation"):
        with st.spinner("Talking to Llama-3..."):
            st.write(ask_ai(u_input))

# 8. MCQ PRACTICE
elif page == "📝 MCQ Practice":
    st.title("Practice Mode")
    q = st.session_state.current_q
    st.info(f"**Topic: {q['topic']}**\n\n{q['question']}")
    
    choice = st.radio("Choose one:", q['options'], key="mcq_radio")
    
    if st.button("Submit Answer"):
        if choice.startswith(q['answer']):
            st.success(f"Correct! The answer is {q['answer']}.")
        else:
            st.error(f"Incorrect. The answer is {q['answer']}.")
            
    if st.button("Next Question"):
        st.session_state.current_q = random.choice(load_questions())
        st.rerun()
