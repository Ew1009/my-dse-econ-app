import streamlit as st
import json
import random
from groq import Groq

# 1. Page Config
st.set_page_config(page_title="DSE Econ Learning Hub", layout="wide")

# 2. AI Tutor Logic (using Llama-3 via Groq)
def ask_ai(user_query):
    try:
        client = Groq(api_key=st.secrets["GROQ_API_KEY"])
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a professional DSE Economics tutor."},
                {"role": "user", "content": user_query}
            ],
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error: {e}"

# 3. Load Questions from JSON
def load_questions():
    with open('questions.json', 'r', encoding='utf-8') as f:
        return json.load(f)

# 4. Sidebar Navigation
with st.sidebar:
    st.title("🎓 DSE Econ v2.1")
    page = st.radio("Go to", ["Dashboard", "AI Tutor", "Practice MCQs"])

# 5. Dashboard Page
if page == "Dashboard":
    st.title("Welcome back, Student!")
    st.write("Current Progress: 300+ Questions Available")

# 6. AI Tutor Page
elif page == "AI Tutor":
    st.title("🤖 AI Tutor")
    user_input = st.text_input("Ask about a DSE concept:")
    if st.button("Explain"):
        with st.spinner("Thinking..."):
            st.write(ask_ai(user_input))

# 7. Practice Page
elif page == "Practice MCQs":
    st.title("📝 MCQ Practice")
    questions = load_questions()
    
    if 'current_q' not in st.session_state:
        st.session_state.current_q = random.choice(questions)

    q = st.session_state.current_q
    st.subheader(f"Topic: {q['topic']}")
    st.write(q['question'])
    
    user_choice = st.radio("Select an option:", q['options'])
    
    if st.button("Check Answer"):
        if user_choice.startswith(q['answer']):
            st.success(f"Correct! {q['explanation']}")
        else:
            st.error(f"Incorrect. The correct answer is {q['answer']}. {q['explanation']}")
        
        if st.button("Next Question"):
            st.session_state.current_q = random.choice(questions)
            st.rerun()