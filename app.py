import streamlit as st
import json
import random
import requests

# 1. PAGE CONFIG & THEME REPLICATION
st.set_page_config(page_title="DSE Econ Hub v2.1", layout="wide", initial_sidebar_state="expanded")

# This block injects the EXACT styling from your original JS/HTML version
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    /* Replicating your original CSS variables */
    :root {
      --primary: #2563eb;
      --bg-primary: #f8fafc;
      --text-primary: #1e293b;
    }

    /* Standardizing the font across the whole app */
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
    }

    /* Making Streamlit containers look like your "Cards" */
    .stMarkdown div[data-testid="stVerticalBlock"] > div {
        background: white;
        padding: 24px;
        border-radius: 16px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-bottom: 20px;
    }

    /* Customizing Sidebar to match your dark theme */
    [data-testid="stSidebar"] {
        background-color: #0f172a !important;
    }
    [data-testid="stSidebar"] * {
        color: #ffffff !important;
    }

    /* Improving button appearance */
    .stButton > button {
        width: 100%;
        border-radius: 12px;
        background-color: var(--primary);
        color: white;
        font-weight: 600;
        height: 3em;
        transition: all 0.3s ease;
    }
    </style>
    """, unsafe_allow_html=True)

# 2. SECURE BACKEND FUNCTIONS
@st.cache_data
def load_questions():
    try:
        with open('questions.json', 'r', encoding='utf-8') as f:
            return json.json.load(f)
    except:
        # Fallback if file is missing
        return []

def ask_ai(prompt):
    API_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-70B-Instruct"
    # Token is safe here; users cannot see this
    headers = {"Authorization": f"Bearer {st.secrets['HF_TOKEN']}"}
    payload = {
        "inputs": f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>You are an expert HKDSE Economics tutor. Use DSE terms like 'Production Possibility Curve' and 'Law of Diminishing Marginal Returns'.<|eot_id|><|start_header_id|>user<|end_header_id|>{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>",
        "parameters": {"max_new_tokens": 800}
    }
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        return response.json()[0]['generated_text']
    except:
        return "The AI is warming up. Please wait 30 seconds."

# 3. STATE MANAGEMENT (Replacing your JS State object)
if 'current_q' not in st.session_state:
    st.session_state.current_q = None
if 'score' not in st.session_state:
    st.session_state.score = 0

# 4. SIDEBAR NAVIGATION
with st.sidebar:
    st.image("https://img.icons8.com/fluency/96/graduation-cap.png", width=80)
    st.title("DSE Econ Hub")
    st.caption("Advanced Question Engine v2.1")
    st.write("---")
    page = st.radio("MAIN MENU", ["📊 Dashboard", "🤖 AI Tutor", "📝 MCQ Practice", "📈 Progress"])

# 5. PAGE: DASHBOARD
if page == "📊 Dashboard":
    st.title("Welcome back, Scholar")
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Topics Covered", "12/15", "+2 this week")
    with col2:
        st.metric("Avg. Accuracy", "84%", "+5%")
    with col3:
        st.metric("Study Streak", "5 Days", "Best: 12")
    
    st.markdown("""
    ### Quick Actions
    Select a module from the sidebar to begin. Your progress is automatically saved to the session.
    """)

# 6. PAGE: AI TUTOR
elif page == "🤖 AI Tutor":
    st.title("Interactive AI Tutor")
    st.write("Ask about any HKDSE Economics concept (e.g., 'Explain the difference between change in demand and change in quantity demanded').")
    
    u_input = st.text_area("Your Question:", placeholder="Type here...", height=150)
    if st.button("Generate Explanation"):
        if u_input:
            with st.spinner("Analyzing DSE Curriculum..."):
                answer = ask_ai(u_input)
                st.markdown(f"### Tutor's Response\n{answer}")
        else:
            st.warning("Please enter a question first.")

# 7. PAGE: MCQ PRACTICE
elif page == "📝 MCQ Practice":
    questions = load_questions()
    
    if not questions:
        st.error("Question bank (questions.json) not found!")
    else:
        if st.session_state.current_q is None:
            st.session_state.current_q = random.choice(questions)
            
        q = st.session_state.current_q
        
        # UI Replicating your original Info Box
        st.markdown(f"**Topic:** `{q.get('topic', 'General Economics')}`")
        st.info(q['question'])
        
        user_ans = st.radio("Select the best option:", q['options'], key="mcq_radio")
        
        c1, c2 = st.columns(2)
        with c1:
            if st.button("Submit Answer"):
                if user_ans.startswith(q['answer']):
                    st.success(f"✅ Correct! {q.get('explanation', '')}")
                    st.session_state.score += 1
                else:
                    st.error(f"❌ Incorrect. The correct answer is {q['answer']}. {q.get('explanation', '')}")
        
        with c2:
            if st.button("Next Question"):
                st.session_state.current_q = random.choice(questions)
                st.rerun()

# 8. PAGE: PROGRESS
elif page == "📈 Progress":
    st.title("Your Learning Journey")
    st.write(f"Total Correct Answers this session: **{st.session_state.score}**")
    # You can add more complex charts here using st.line_chart()
