from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
import requests
import os
import re
import html

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DEEPL_KEY = os.getenv("DEEPL_API_KEY")

DEEPL_URL = "https://api-free.deepl.com/v2/translate"

# ------------------ HJÄLPREGLER ------------------

VERB_HINTS = {" is ", " are ", " was ", " were ", " did ", " does ", " has ", " have "}

def looks_like_name_or_title(text: str) -> bool:
    words = text.strip().split()
    if len(words) > 5:
        return False

    lower = f" {text.lower()} "
    if any(v in lower for v in VERB_HINTS):
        return False

    # Många versaler / Title Case → troligen namn/titel
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    if caps_ratio > 0.3:
        return True

    return False


def length_diff_too_big(original: str, translated: str) -> bool:
    if not original or not translated:
        return True
    diff = abs(len(original) - len(translated)) / len(original)
    return diff > 0.6


# ------------------ ÖVERSÄTTNING ------------------

def deepl_translate(text: str) -> str:
    if not DEEPL_KEY:
        return text

    try:
        r = requests.post(
            DEEPL_URL,
            data={
                "auth_key": DEEPL_KEY,
                "text": text,
                "target_lang": "SV"
            },
            timeout=5
        )
        data = r.json()
        return data["translations"][0]["text"]
    except Exception:
        return text


def smart_translate(text: str) -> str:
    # Skydda tomt / konstigt
    if not text or len(text.strip()) < 2:
        return text

    # Skydda namn / titlar
    if looks_like_name_or_title(text):
        return text

    translated = deepl_translate(text)

    # Fallback om konstig översättning
    if translated == text:
        return text

    if length_diff_too_big(text, translated):
        return text

    return translated


# ------------------ API ------------------

@app.get("/quiz")
def quiz(amount: int = 10, category: str = ""):
    url = f"https://opentdb.com/api.php?amount={amount}&type=multiple"
    if category:
        url += f"&category={category}"

    data = requests.get(url).json()
    questions = []

    for q in data["results"]:
        raw_question = html.unescape(q["question"])
        raw_correct = html.unescape(q["correct_answer"])
        raw_incorrect = [html.unescape(a) for a in q["incorrect_answers"]]

        question_text = smart_translate(raw_question)
        correct = smart_translate(raw_correct)
        incorrect = [smart_translate(a) for a in raw_incorrect]


        questions.append({
            "question": question_text,
            "correct_answer": correct,
            "incorrect_answers": incorrect
        })

    return questions
