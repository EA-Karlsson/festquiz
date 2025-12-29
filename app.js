// ================== GLOBAL STATE ==================
let questions = [];
let currentIndex = 0;
let timer = null;
let selectedCategory = "";

// ================== DOM READY ==================
document.addEventListener("DOMContentLoaded", () => {
    // Hämta DOM
    const startScreen = document.getElementById("startScreen");
    const quizScreen = document.getElementById("quizScreen");
    const questionText = document.getElementById("questionText");
    const answersDiv = document.getElementById("answers");
    const startBtn = document.getElementById("startBtn");
    const questionCount = document.getElementById("questionCount");

    // Säkerhetscheck – annars dör ALLT
    if (!startScreen || !quizScreen || !questionText || !answersDiv || !startBtn || !questionCount) {
        console.error("DOM saknas:", {
            startScreen,
            quizScreen,
            questionText,
            answersDiv,
            startBtn,
            questionCount
        });
        return;
    }

    // Klick: starta quiz
    startBtn.addEventListener("click", () => startQuiz(
        startScreen,
        quizScreen,
        questionText,
        answersDiv,
        startBtn,
        questionCount
    ));
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
        alert("Kunde inte starta quizet.");
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

    const answers = shuffle([q.correct_answer, ...q.incorrect_answers]);
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
        questionText.textContent = "Quiz klart 🎉";
        answersDiv.innerHTML = "";
        return;
    }
    showQuestion(questionText, answersDiv);
}

// ================== TIMER ==================
function startTimer(questionText, answersDiv) {
    let time = 20;

    timer = setInterval(() => {
        time--;
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
