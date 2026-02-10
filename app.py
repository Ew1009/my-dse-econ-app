import streamlit as st
import json
import random
import requests

# 1. PAGE SETUP (The 'Visual' Design)
st.set_page_config(page_title="DSE Econ Learning Hub", layout="wide")

# 2. AI TUTOR ENGINE (The 'Brain')
# This function sends your questions to the Llama-3 model on Hugging Face
def ask_ai(user_query):
    # This is the address of the AI model
    API_URL = "https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3-8B-Instruct"
    # This looks for the 'HF_TOKEN' secret you will set in Streamlit Cloud
    headers = {"Authorization": f"Bearer {st.secrets['HF_TOKEN']}"}
    
    payload = {
        "inputs": f"<|begin_of_text|><|start_header_id|>system<|end_header_id|>\nYou are an expert HKDSE Economics tutor. Use DSE terminology.<|eot_id|><|start_header_id|>user<|end_header_id|>\n{user_query}<|eot_id|><|start_header_id|>assistant<|end_header_id|>",
        "parameters": {"max_new_tokens": 500, "return_full_text": False}
    }
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload)
        output = response.json()
        # Extracting the text from the AI's complex response
        if isinstance(output, list):
            return output[0]['generated_text']
        else:
            return output.get('generated_text', "The AI is warming up. Please try again in 30 seconds.")
    except Exception as e:
        return "I'm having trouble connecting to the brain. Check your HF_TOKEN!"

# 3. QUESTION BANK LOADER
def load_questions():
    try:
        with open('questions.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return []

# 4. NAVIGATION SIDEBAR
with st.sidebar:
    st.title("🎓 DSE Econ v2.1")
    st.write("---")
    page = st.radio("Select a Module", ["Study Dashboard", "AI Tutor", "MCQ Practice"])

# 5. MODULE: DASHBOARD
if page == "Study Dashboard":
    st.title("Welcome to your Economics Hub")
    st.info("Success in DSE Economics requires understanding concepts, not just memorizing.")
    col1, col2 = st.columns(2)
    col1.metric("Questions Available", "300+")
    col2.metric("AI Status", "Ready to Teach")

# 6. MODULE: AI TUTOR
elif page == "AI Tutor":
    st.title("🤖 AI Economics Tutor")
    st.write("Ask me to explain any topic like 'Opportunity Cost' or 'GDP calculation'.")
    
    user_input = st.text_input("Enter your question here:")
    if st.button("Get Explanation"):
        if user_input:
            with st.spinner("Analyzing economic theory..."):
                answer = ask_ai(user_input)
                st.markdown(answer)
        else:
            st.warning("Please type a question first!")

# 7. MODULE: MCQ PRACTICE
elif page == "MCQ Practice":
    st.title("📝 MCQ Practice Mode")
    questions = load_questions()
    
    if not questions:
        st.error("No questions found! Make sure questions.json is in your GitHub.")
    else:
        if 'current_q' not in st.session_state:
            st.session_state.current_q = random.choice(questions)

        q = st.session_state.current_q
        st.subheader(f"Topic: {q.get('topic', 'General')}")
        st.write(q['question'])
        
        user_choice = st.radio("Choose the correct option:", q['options'])
        
        if st.button("Submit Answer"):
            # Check if the chosen letter (
