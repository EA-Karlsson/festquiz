from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
import requests
import os
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

MEDIA_KEYWORDS = [
    "film", "movie", "album", "song", "track",
    "band", "artist", "game", "video game",
    "character", "series", "quote", "citat",
    "låten", "albumet", "bandet", "artisten",
    "spelet", "karaktären", "tv-serien"
]

def looks_like_name_or_title(text: str) -> bool:
    words = text.strip().split()
    if len(words) > 5:
        return False

    lower = f" {text.lower()} "
    if any(v in lower for v in VERB_HINTS):
        return False

    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    return caps_ratio > 0.3


def length_diff_too_big(original: str, translated: str) -> bool:
    if not original or not translated:
        return True
    diff = abs(len(original) - len(translated)) / len(original)
    return diff > 0.6


def is_media_question(text: str) -> bool:
    t = text.lower()
    return any(k in t for k in MEDIA_KEYWORDS)


def looks_like_quote(text: str) -> bool:
    if '"' in text or "'" in text:
        return True
    if len(text.split()) > 6:
        return True
    return False

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
    if not text or len(text.strip()) < 2:
        return text

    if looks_like_name_or_title(text):
        return text

    translated = deepl_translate(text)

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

        if is_media_question(question_text):
            # MEDIA → svar ska ALDRIG översättas
            correct = raw_correct
            incorrect = raw_incorrect
        else:
            # Icke-media → selektiv översättning
            if looks_like_quote(raw_correct):
                correct = raw_correct
            else:
                correct = smart_translate(raw_correct)

            incorrect = []
            for a in raw_incorrect:
                if looks_like_quote(a):
                    incorrect.append(a)
                else:
                    incorrect.append(smart_translate(a))

        questions.append({
            "question": question_text,
            "correct_answer": correct,
            "incorrect_answers": incorrect
        })

    return questions
