// ================== GLOBAL STATE ==================
let questions = [];
let currentIndex = 0;
let timer = null;
let selectedCategory = "";

let results = [];     // sparar facitdata
let mode = "quiz";    // quiz | facit

const CATEGORY_IDS = ["9", "11", "12", "21", "15", "23", "17", "22"];

// ================== DOM READY ==================
document.addEventListener("DOMContentLoaded", () => {
    const startScreen = document.getElementById("startScreen");
    const quizScreen = document.getElementById("quizScreen");
    const questionText = document.getElementById("questionText");
    const answersDiv = document.getElementById("answers");
    const startBtn = document.getElementById("startBtn");
    const questionCount = document.getElementById("questionCount");

    const categoryButtons = document.querySelectorAll("#categories button[data-category]");
    const randomBtn = document.getElementById("randomCategory");

    if (
        !startScreen ||
        !quizScreen ||
        !questionText ||
        !answersDiv ||
        !startBtn ||
        !questionCount
    ) {
        console.error("DOM saknas");
        return;
    }

    // ================== KATEGORIER ==================
    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            categoryButtons.forEach(b => (b.style.opacity = "0.5"));
            randomBtn.style.opacity = "0.5";

            btn.style.opacity = "1";
            selectedCategory = btn.dataset.category;
        });
    });

    randomBtn.addEventListener("click", () => {
        const random =
            CATEGORY_IDS[Math.floor(Math.random() * CATEGORY_IDS.length)];
        selectedCategory = random;

        categoryButtons.forEach(b => {
            b.style.opacity =
                b.dataset.category === random ? "1" : "0.5";
        });

        randomBtn.style.opacity = "1";
    });

    // ================== START ==================
    startBtn.addEventListener("click", () =>
        startQuiz(
            startScreen,
            quizScreen,
            questionText,
            answersDiv,
            startBtn,
            questionCount
        )
    );
});

// ================== START QUIZ ==================
async function startQuiz(
    startScreen,
    quizScreen,
    questionText,
    answersDiv,
    startBtn,
    questionCount
) {
    startBtn.disabled = true;
    startBtn.textContent = "Laddar frågor...";

    const count = questionCount.value;

    try {
        const res = await fetch(
            `https://festquiz.onrender.com/quiz?amount=${count}&category=${selectedCategory}`
        );

        if (!res.ok) throw new Error("Fetch failed");

        questions = await res.json();
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("Inga frågor");
        }

        currentIndex = 0;
        results = [];
        mode = "quiz";

        startScreen.classList.add("hidden");
        quizScreen.classList.remove("hidden");

        showQuestion(questionText, answersDiv);
    } catch (e) {
        console.error("STARTQUIZ ERROR:", e);
        startBtn.disabled = false;
        startBtn.textContent = "Starta quiz";
    }
}

// ================== SHOW QUESTION ==================
function showQuestion(questionText, answersDiv) {
    clearInterval(timer);

    const q = questions[currentIndex];
    if (!q || !q.correct_answer || !Array.isArray(q.incorrect_answers)) {
        nextQuestion(questionText, answersDiv);
        return;
    }

    // SPARA FACITDATA (visas först i slutet)
    results.push({
        question: q.question,
        correct_answer: q.correct_answer
    });

    questionText.textContent = q.question;
    answersDiv.innerHTML = "";

    const answers = shuffle([
        q.correct_answer,
        ...q.incorrect_answers
    ]);
    const labels = ["A", "B", "C", "D"];

    answers.forEach((a, i) => {
        const div = document.createElement("div");
        div.className = "answer";
        div.innerHTML = `<strong>${labels[i]}.</strong> ${a}`;
        answersDiv.appendChild(div);
    });

    startTimer(questionText, answersDiv);
}

// ================== NEXT QUESTION ==================
function nextQuestion(questionText, answersDiv) {
    currentIndex++;

    if (currentIndex >= questions.length) {
        showFacit();
        return;
    }

    showQuestion(questionText, answersDiv);
}

// ================== TIMER ==================
function startTimer(questionText, answersDiv) {
    clearInterval(timer);

    const timerEl = document.getElementById("timer");
    let time = 20;

    timerEl.textContent = `Tid kvar: ${time}`;

    timer = setInterval(() => {
        time--;
        timerEl.textContent = `Tid kvar: ${time}`;

        if (time <= 0) {
            clearInterval(timer);
            nextQuestion(questionText, answersDiv);
        }
    }, 1000);
}

// ================== FACIT ==================
function showFacit() {
    clearInterval(timer);
    mode = "facit";

    const questionText = document.getElementById("questionText");
    const answersDiv = document.getElementById("answers");

    questionText.textContent = "✅ Facit";

    answersDiv.innerHTML = results
        .map((item, index) => {
            return `
                <div style="margin-bottom: 16px; text-align: left;">
                    <strong>${index + 1}. ${item.question}</strong><br>
                    Rätt svar: <strong>${item.correct_answer}</strong>
                </div>
            `;
        })
        .join("");

    const btn = document.createElement("button");
    btn.textContent = "Till startsidan";
    btn.className = "restart-btn";

    btn.addEventListener("click", () => {
        results = [];
        questions = [];
        currentIndex = 0;
        mode = "quiz";

        document.getElementById("quizScreen").classList.add("hidden");
        document.getElementById("startScreen").classList.remove("hidden");

        const startBtn = document.getElementById("startBtn");
        startBtn.disabled = false;
        startBtn.textContent = "Starta quiz";
    });

    answersDiv.appendChild(btn);
}

// ================== UTILS ==================
function shuffle(arr) {
    return arr
        .map(v => ({ v, s: Math.random() }))
        .sort((a, b) => a.s - b.s)
        .map(x => x.v);
}
