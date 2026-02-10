import streamlit as st
import json
import random
import requests

# 1. THE ARCHITECTURE: Force the app to look like a custom-coded website
st.set_page_config(page_title="DSE Econ Hub v2.1", layout="wide", initial_sidebar_state="expanded")

# This is a massive CSS injection to kill the "Streamlit" look and bring back your UI
st.markdown("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    
    /* RESET BASE STYLES */
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif !important;
        background-color: #f8fafc;
    }

    /* THE SIDEBAR (Your exact color #0f172a) */
    [data-testid="stSidebar"] {
        background-color: #0f172a !important;
        background-image: linear-gradient(180deg, #0f172a 0%, #1e293b 100%) !important;
        border-right: 1px solid #1e293b;
    }
    
    [data-testid="stSidebar"] * {
        color: #f1f5f9 !important;
    }

    /* CARDS: Replicating your .stat-card and .glass-card classes */
    .stMarkdown div[data-testid="stVerticalBlock"] > div {
        background: #ffffff;
        padding: 30px;
        border-radius: 20px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
        margin-bottom: 24px;
    }

    /* DASHBOARD METRICS */
    div[data-testid="stMetricValue"] {
        font-size: 2rem !important;
        font-weight: 800 !important;
        color: #2563eb !important;
    }

    /* DSE TABLES (Firm Comparison Look) */
    .firm-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 14px;
    }
    .firm-table th { background: #f1f5f9; padding: 12px; border: 1px solid #e2e8f0; text-align: left; }
    .firm-table td { padding: 12px; border: 1px solid #e2e8f0; }

    /* BUTTONS: Custom DSE Blue */
    .stButton > button {
        background: linear-gradient(90deg, #2563eb 0%, #1d4ed8 100%);
        color: white !important;
        border-radius: 12px !important;
        border: none !important;
        padding: 12px 24px !important;
        font-weight: 700 !important;
        letter-spacing: 0.5px;
        transition: all 0.3s ease !important;
    }
    .stButton > button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
    }
    </style>
    """, unsafe_allow_html=True)

# 2. CORE ENGINES
def load_db():
    try:
        with open('questions.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

def ask_llama(prompt):
    API_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-70B-Instruct"
    headers = {"Authorization": f"Bearer {st.secrets['HF_TOKEN']}"}
    payload = {
        "inputs": f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>You are a professional DSE Economics Tutor. Use specific exam terminology.<|eot_id|><|start_header_id|>user<|end_header_id|>{prompt}<|eot_id|><|start_header_id|>assistant<|end_header_id|>",
        "parameters": {"max_new_tokens": 1000, "temperature": 0.7}
    }
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        return response.json()[0]['generated_text']
    except:
        return "System connection error. Please refresh."

# 3. SIDEBAR NAVIGATION (With FontAwesome-style Icons)
with st.sidebar:
    st.markdown("<h1 style='text-align: center; color: white;'>🎓 DSE ECON</h1>", unsafe_allow_html=True)
    st.markdown("<p style='text-align: center; opacity: 0.7;'>v2.1 Premium Edition</p>", unsafe_allow_html=True)
    st.write("---")
    menu = ["📊 Dashboard", "🤖 AI Exam Tutor", "📝 Past Paper Practice", "📈 Formula Sheet"]
    page = st.radio("NAVIGATION", menu)
    st.write("---")
    st.markdown("### 🏆 Session Stats")
    st.write(f"Questions Correct: {st.session_state.get('correct', 0)}")

# 4. PAGE: DASHBOARD (The "Glass" UI)
if page == "📊 Dashboard":
    st.title("Student Analytics Dashboard")
    
    # 3-Column Stats row
    c1, c2, c3 = st.columns(3)
    with c1:
        st.metric("Total MCQs", "342", "Updated 2024")
    with c2:
        st.metric("Top Accuracy", "92%", "+4% 🔥")
    with c3:
        st.metric("AI Tokens", "Unlimited", "Premium")

    # Firm Type Comparison (From your original HTML)
    st.markdown("""
    ### 🏢 Key Concept: Types of Firms
    <table class="firm-table">
        <tr><th>Feature</th><th>Private Ltd. Co.</th><th>Public Ltd. Co.</th></tr>
        <tr><td>Legal Status</td><td>Separate Legal Entity</td><td>Separate Legal Entity</td></tr>
        <tr><td>Transfer of Shares</td><td>Restricted</td><td>Freely Marketable</td></tr>
        <tr><td>Disclosure of Accounts</td><td>Private</td><td>Published to Public</td></tr>
    </table>
    """, unsafe_allow_html=True)

# 5. PAGE: AI EXAM TUTOR
elif page == "🤖 AI Exam Tutor":
    st.title("AI Theory Assistant")
    st.write("Enter any Economics concept to receive a DSE-standard explanation.")
    
    query = st.text_area("Question / Concept:", placeholder="e.g., Explain the wealth effect on Aggregate Demand.", height=150)
    
    if st.button("Generate DSE Explanation"):
        if query:
            with st.spinner("Consulting Llama-3-70B..."):
                result = ask_llama(query)
                st.markdown("---")
                st.markdown(f"### 💡 Explanation\n{result}")
        else:
            st.warning("Please type something first.")

# 6. PAGE: PAST PAPER PRACTICE
elif page == "📝 Past Paper Practice":
    questions = load_db()
    if not questions:
        st.error("Please upload questions.json to GitHub!")
    else:
        if 'q_idx' not in st.session_state:
            st.session_state.q_idx = random.randint(0, len(questions)-1)
            st.session_state.correct = 0

        q = questions[st.session_state.q_idx]
        
        # UI: Question Card
        st.markdown(f"### Topic: {q['topic']}")
        st.info(q['question'])
        
        user_ans = st.radio("Choose the correct option:", q['options'], key=f"q_{st.session_state.q_idx}")
        
        btn_col1, btn_col2 = st.columns(2)
        with btn_col1:
            if st.button("Submit Answer"):
                if user_ans.startswith(q['answer']):
                    st.success(f"✅ Correct! {q.get('explanation', '')}")
                    st.session_state.correct += 1
                else:
                    st.error(f"❌ Incorrect. The answer is {q['answer']}.")
        
        with btn_col2:
            if st.button("Next Question"):
                st.session_state.q_idx = random.randint(0, len(questions)-1)
                st.rerun()

# 7. PAGE: FORMULA SHEET (Production Stage Diagrams)
elif page == "📈 Formula Sheet":
    st.title("DSE Formula & Diagram Bank")
    st.markdown("""
    ### ⚙️ Production Stages (Law of Diminishing Marginal Returns)
    1. **Total Product (TP)** starts to increase at a decreasing rate.
    2. **Marginal Product (MP)** is zero when TP is at maximum.
    3. **Average Product (AP)** intersects MP at its peak.
    """)
