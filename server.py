from fastapi import FastAPI
import requests
import os

app = FastAPI()

DEEPL_KEY = os.getenv("DEEPL_API_KEY")

def translate(text):
    # Om ingen DeepL-nyckel finns, returnera engelska
    if not DEEPL_KEY:
        return text

    r = requests.post(
        "https://api-free.deepl.com/v2/translate",
        data={
            "auth_key": DEEPL_KEY,
            "text": text,
            "target_lang": "SV"
        }
    )

    data = r.json()

    # Om DeepL svarar med fel → krascha inte
    if "translations" not in data:
        return text

    return data["translations"][0]["text"]

@app.get("/quiz")
def quiz(amount: int = 10, category: str = ""):
    url = f"https://opentdb.com/api.php?amount={amount}&type=multiple"
    if category:
        url += f"&category={category}"

    data = requests.get(url).json()
    questions = []

    for q in data["results"]:
        questions.append({
            "question": translate(q["question"]),
            "correct_answer": translate(q["correct_answer"]),
            "incorrect_answers": [translate(a) for a in q["incorrect_answers"]]
        })

    return questions
