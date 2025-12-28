const startBtn = document.getElementById("startBtn");
const startScreen = document.getElementById("startScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const questionText = document.getElementById("questionText");
const answersDiv = document.getElementById("answers");
const timerText = document.getElementById("timer");
const resultsDiv = document.getElementById("results");

const categoryButtons = document.querySelectorAll("#categories button[data-category]");
const randomBtn = document.getElementById("randomCategory");

/* ===== MUSIK ===== */
const musicBtn = document.getElementById("enableSound");
const bgMusic = document.getElementById("bgMusic");

musicBtn.addEventListener("click", () => {
  bgMusic.volume = 0.15;
  bgMusic.currentTime = 0;
  bgMusic.play();
  musicBtn.style.display = "none";
});

/* ===== STATE ===== */
let selectedCategory = "";
let questions = [];
let currentIndex = 0;
let timer = null;
let timeLeft = 20;

const CATEGORY_IDS = ["9","11","12","21","15","23","17","22"];

/* ===== KATEGORI-KLICK (FIX) ===== */
categoryButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    // visuellt val
    categoryButtons.forEach(b => b.style.opacity = "0.5");
    randomBtn.style.opacity = "0.5";

    btn.style.opacity = "1";
    selectedCategory = btn.dataset.category;
  });
});

randomBtn.addEventListener("click", () => {
  const random = CATEGORY_IDS[Math.floor(Math.random() * CATEGORY_IDS.length)];
  selectedCategory = random;

  categoryButtons.forEach(b => {
    b.style.opacity = b.dataset.category === random ? "1" : "0.5";
  });
  randomBtn.style.opacity = "1";
});

/* ===== START ===== */
startBtn.addEventListener("click", startQuiz);

async function startQuiz() {
  startBtn.disabled = true;
  startBtn.textContent = "Laddar frågor...";

  const count = document.getElementById("questionCount").value;
  const categoryParam = selectedCategory ? `&category=${selectedCategory}` : "";

  try {
    const res = await fetch(
      `https://opentdb.com/api.php?amount=${count}&type=multiple${categoryParam}`
    );

    const data = await res.json();
    if (!data.results || data.results.length === 0) {
      throw new Error("Inga frågor");
    }

    questions = data.results;
    currentIndex = 0;

    startScreen.classList.add("hidden");
    quizScreen.classList.remove("hidden");

    showQuestion();
  } catch (e) {
    alert("Kunde inte starta quizet.");
    startBtn.disabled = false;
    startBtn.textContent = "Starta quiz";
  }
}

/* ===== QUIZ ===== */
function showQuestion() {
  clearInterval(timer);

  const q = questions[currentIndex];
  questionText.innerHTML = decode(q.question);
  answersDiv.innerHTML = "";

  const answers = shuffle([q.correct_answer, ...q.incorrect_answers]);
  const labels = ["A", "B", "C", "D"];

  answers.forEach((a, i) => {
    const div = document.createElement("div");
    div.className = "answer";
    div.innerHTML = `<strong>${labels[i]}.</strong> ${decode(a)}`;
    answersDiv.appendChild(div);
  });

  startTimer();
}

function startTimer() {
  timeLeft = 20;
  timerText.textContent = `Tid kvar: ${timeLeft}`;

  timer = setInterval(() => {
    timeLeft--;
    timerText.textContent = `Tid kvar: ${timeLeft}`;

    if (timeLeft <= 0) {
      nextQuestion();
    }
  }, 1000);
}

function nextQuestion() {
  clearInterval(timer);
  currentIndex++;

  if (currentIndex < questions.length) {
    showQuestion();
  } else {
    showResults();
  }
}

/* ===== FACIT ===== */
function showResults() {
  clearInterval(timer);
  bgMusic.pause();
  bgMusic.currentTime = 0;

  quizScreen.classList.add("hidden");
  resultScreen.classList.remove("hidden");

  resultsDiv.innerHTML = "";

  questions.forEach(q => {
    const div = document.createElement("div");
    div.innerHTML = `
      <p><strong>${decode(q.question)}</strong></p>
      <p>Rätt svar: ${decode(q.correct_answer)}</p>
      <hr>
    `;
    resultsDiv.appendChild(div);
  });
}

/* ===== HELPERS ===== */
function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function decode(text) {
  const t = document.createElement("textarea");
  t.innerHTML = text;
  return t.value;
}
