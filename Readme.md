# PhishSnitch: AI-Powered Phishing Detection Assistant

PhishSnitch is a smart, AI-powered phishing detection tool built to help users identify suspicious messages in real time. It uses natural language processing (NLP), keyword analysis, and a DistilBERT model to flag phishing attempts with clear explanations and confidence scores.

---

🌐 **Live Demo**  
🔗~ https://phishsnitch.onrender.com/ ~

*Note: The backend may sleep after periods of inactivity. The first requests might take a few seconds.*

![phishsnitch](https://github.com/user-attachments/assets/9328fcbd-7b78-45b0-a1fd-6ad3e3cde05b)

![safe](https://github.com/user-attachments/assets/d8928927-c7db-4b28-b6ef-0afe83bdda95)
![possibly safe](https://github.com/user-attachments/assets/08fdc4cf-9433-4799-a79f-3ccc7678064b)
![phishing](https://github.com/user-attachments/assets/e882fd5e-f64b-4ed8-a04c-2d592a924512)

---

✨ **Features**

- 🧠 Detects phishing using a DistilBERT model  
- 🔍 Scans for dangerous keywords, URLs, and domains  
- 🌓 Built-in dark mode (Light mode available) and error handling  
- 📊 Shows confidence scores and AI explanations
- 🐳 Fully Dockerized and deployed on Render  

---

📦 **Technologies & Tools Used**

-**Frontend**: React + Vite + Tailwind CSS  
-**Backend**: FastAPI + Python  
-**AI**: Hugging Face Transformers (DistilBERT)  
-**Deployment**: Docker + Render  
-**Utilities**: URL + Domain parser, Regex keyword matcher, Blacklist checker  

---

🛠 **How I Built This (Step-by-Step)**

**Step 1: The Idea**  
This tool helps people detect phishing messages without needing tech expertise — something lightweight but powerful, with AI under the hood.

**Step 2: Dataset + Model**  
- Gathered phishing datasets from Kaggle & public sources  
- Used DistilBERT and fine-tuned it on phishing vs. non-phishing data  
- The fine-tuned model is too large to include on GitHub (6GB+), but I provide untrained setup code and instructions to train your own below.

To train your own model, run:

```
pip install transformers datasets
```
```
python train_model.py  # Provided in backend (example script)
```
🔹 **Step 3: Backend (FastAPI)**  
- Built an `/analyze` endpoint  
- Parses message content, extracts URLs/domains, matches trigger/safe keywords  
- Uses the trained model to classify and generate confidence + explanation  

🔹 **Step 4: Frontend (Vite + React)**  
- Clean UI with dark mode toggle using Tailwind CSS  
- Connects to backend via `api.js` and `.env` config  
- Shows prediction label, confidence, explanation, and extra info  

🔹 **Step 5: Dockerize and Deploy**  
- Created Dockerfiles for backend and frontend  
- Pushed both images to Docker Hub  
- Created two Render services: one for frontend, one for backend  
- Set `VITE_BACKEND_URL` as an environment variable in frontend config  

---

⚙️ **Local Setup (Run on Your Machine)**

1. **Clone the Repository**
```
git clone https://github.com/your-username/phishsnitch.git
```
```
cd phishsnitch
```

2. **Frontend Setup**
```
cd phishsnitch-frontend
```
```
npm install
```
Create a .env file:
```
VITE_BACKEND_URL=http://localhost:8000
```
Then start the frontend:
```
npm run dev
```

3. **Backend Setup**
```
cd ../phishsnitch-backend
```
```
python -m venv venv
```
On Mac: ```source venv/bin/activate```
On Windows: ```venv\Scripts\activate```
```
pip install -r requirements.txt
```
Then start the backend:
```
uvicorn main:app --host 0.0.0.0 --port 8000
```
Visit http://localhost:8000/docs to test the backend manually.

---

📄 License
MIT License – free to use, modify, and share.

---

Thanks for checking this out! Feel free to fork, remix, or build on it.
