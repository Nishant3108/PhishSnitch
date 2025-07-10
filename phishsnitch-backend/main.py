from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import re
from urllib.parse import urlparse
from datetime import datetime
import os
import csv

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request schemas
class MessageRequest(BaseModel):
    message: str

class FeedbackRequest(BaseModel):
    message: str
    predicted_label: str
    correct_label: str

# Use sentiment analysis for basic classification
# classifier = pipeline("sentiment-analysis")
# Load phishing classifier model
try:
    classifier = pipeline("text-classification", model="models/phishsnitch-model")
except Exception as e:
    print(f"❌ Failed to load model: {e}")
    classifier = None

# Log files setup
LOG_FILE = "logs/phishsnitch_logs.csv"
FEEDBACK_LOG_FILE = "logs/feedback_logs.csv"
os.makedirs("logs", exist_ok=True)

# Create CSV headers if not exist
for path, headers in [
    (LOG_FILE, ["timestamp", "input_text", "prediction", "confidence"]),
    (FEEDBACK_LOG_FILE, ["timestamp", "input_text", "predicted_label", "correct_label"])
]:
    if not os.path.exists(path):
        with open(path, mode='w', newline='', encoding='utf-8') as file:
            writer = csv.writer(file)
            writer.writerow(headers)

# Logger helpers
def log_prediction(text, label, confidence):
    with open(LOG_FILE, mode='a', newline='', encoding='utf-8') as file:
        csv.writer(file).writerow([datetime.now(), text.strip(), label, round(confidence * 100, 2)])

def log_feedback(text, predicted, correct):
    with open(FEEDBACK_LOG_FILE, mode='a', newline='', encoding='utf-8') as file:
        csv.writer(file).writerow([datetime.now(), text.strip(), predicted, correct])

# Utility: Extract URLs and Domains
def extract_urls(text):
    return re.findall(r'https?://[^\s]+', text)

def get_domain(url):
    try:
        parsed = urlparse(url)
        domain = parsed.netloc.lower()
        return domain[4:] if domain.startswith("www.") else domain
    except:
        return ""

# API: Analyze
@app.post("/analyze")
async def analyze_message(data: MessageRequest):
    text = data.message.strip()

    if not text or not classifier:
        return {
            "label": "Unknown",
            "confidence": 0,
            "explanation": "⚠️ No message or model unavailable. Please try again later.",
            "urls": [], "domains": [],
            "blacklisted_domains_found": [], "trusted_domains_found": [],
            "trigger_keywords_found": [], "safe_keywords_found": []
        }

    try:
        prediction = classifier(text)[0]
        raw_label = prediction.get("label", "").lower()
        confidence = prediction.get("score", 0.0)

        # URL Analysis
        urls = extract_urls(text)
        domains = [get_domain(url) for url in urls]

        trusted_domains = [
            "amazon.com", "dropbox.com", "bankofamerica.com", "chase.com", "google.com",
            "paypal.com", "microsoft.com", "google.com", "apple.com", "linkedin.com"
        ]
        blacklisted_domains = [
            "fake-paypal-security-check.com", "phishy-site.xyz", "malicious-link.net"
        ]

        has_bad_domain = any(d in blacklisted_domains for d in domains)
        all_trusted = all(d in trusted_domains for d in domains) if domains else True

        phishing_triggers = [
            "urgent", "verify", "login", "password", "account suspended", "click here",
            "send us", "avoid suspension", "your bank account", "compromised",
            "update information", "within 24 hours", "reactivate", "limited access",
            "security alert", "unauthorized", "confirm your identity", "reset your password",
            "account locked", "billing information", "unusual activity", "action required",
            "suspended account", "verify your account", "confirm your account", "security breach",
            "account verification", "password expired", "immediate action", "account update", "phishy-site.xyz",
        ]

        safe_keywords = [
            "amazon.com", "dropbox.com", "bankofamerica.com", "chase.com",
            "no action required", "official statement", "dashboard", "account overview",
            "paypal.com", "microsoft.com", "google.com", "apple.com", "linkedin.com",
            "no action needed", "transaction receipt", "your package has shipped",
            "thank you for your purchase"
        ]

        lowered = text.lower()
        trigger_keywords_found = [p for p in phishing_triggers if p in lowered]
        safe_keywords_found = [k for k in safe_keywords if k in lowered]

        is_phishy = bool(trigger_keywords_found)
        is_safe = bool(safe_keywords_found)

        CONFIDENCE_HIGH = 0.85
        CONFIDENCE_LOW = 0.60

        # Logic Tree
        if has_bad_domain:
            label = "Phishing - Look out!"
            explanation = "⚠️ Message contains suspicious URLs from known malicious domains."

        elif not all_trusted:
            label = "Possibly Safe - Double check!"
            explanation = "🟡 Message contains URLs from unknown or untrusted domains."

        elif raw_label == "label_1" or is_phishy:
            if confidence >= CONFIDENCE_HIGH:
                label = "Phishing - Look out!"
                explanation = "⚠️ This message contains urgency, impersonation, or phishing patterns."
            elif confidence >= CONFIDENCE_LOW:
                label = "Possibly Safe - Double check!"
                explanation = "🟡 Mixed signals. Looks suspicious, but confidence is moderate."
            else:
                label = "Possibly Safe"
                explanation = "ℹ️ Might be safe, but contains trigger words. Review carefully."

            if is_safe:
                label = "Possibly Safe"
                explanation = "ℹ️ Safe keywords detected (e.g., 'amazon.com'), but urgency patterns exist."

        elif raw_label == "label_0":
            if confidence >= CONFIDENCE_HIGH:
                label = "Not Phishing - Safe :)"
                explanation = "✅ This message appears routine and lacks phishing characteristics."
            elif confidence >= CONFIDENCE_LOW:
                label = "Possibly Safe - Double check!"
                explanation = "🟡 Model is unsure. It might be okay, but use caution."
            else:
                label = "Possibly Safe"
                explanation = "ℹ️ Model has low confidence in safety."

        else:
            label = "Unknown"
            explanation = "ℹ️ Unable to confidently classify this message."

        log_prediction(text, label, confidence)

        return {
            "label": label,
            "confidence": round(confidence * 100, 2),
            "explanation": explanation,
            "urls": urls,
            "domains": domains,
            "blacklisted_domains_found": [d for d in domains if d in blacklisted_domains],
            "trusted_domains_found": [d for d in domains if d in trusted_domains],
            "trigger_keywords_found": trigger_keywords_found,
            "safe_keywords_found": safe_keywords_found
        }

    except Exception as e:
        return {
            "label": "Error",
            "confidence": 0,
            "explanation": f"❌ Internal error: {str(e)}",
            "urls": [], "domains": [],
            "blacklisted_domains_found": [], "trusted_domains_found": [],
            "trigger_keywords_found": [], "safe_keywords_found": []
        }

# Feedback collection
@app.post("/feedback")
async def submit_feedback(data: FeedbackRequest):
    log_feedback(data.message, data.predicted_label, data.correct_label)
    return {"status": "success", "message": "Feedback received. Thank you!"}

# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "message": "PhishSnitch API is running."}
