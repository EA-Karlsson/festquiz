// ================== GLOBAL STATE ==================
let questions = [];
let currentIndex = 0;
let timer = null;
let selectedCategory = "";

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

    // Säkerhetscheck
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
        clearInterval(timer);

        questionText.textContent = "🎉 Quiz klart!";
        answersDiv.innerHTML = `
            <button id="restartBtn" class="restart-btn">
                Till startsidan
            </button>
        `;

        document
            .getElementById("restartBtn")
            .addEventListener("click", () => {
                questions = [];
                currentIndex = 0;

                document
                    .getElementById("quizScreen")
                    .classList.add("hidden");
                document
                    .getElementById("startScreen")
                    .classList.remove("hidden");

                const startBtn =
                    document.getElementById("startBtn");
                startBtn.disabled = false;
                startBtn.textContent = "Starta quiz";
            });

        return;
    }

    showQuestion(questionText, answersDiv);
}

// ================== TIMER ==================
function startTimer(questionText, answersDiv) {
    clearInterval(timer);

    const timerEl = document.getElementById("timer");
    let time = 20;

    // Visa startvärdet direkt
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

// ================== UTILS ==================
function shuffle(arr) {
    return arr
        .map(v => ({ v, s: Math.random() }))
        .sort((a, b) => a.s - b.s)
        .map(x => x.v);
}
