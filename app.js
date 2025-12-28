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

/* ===== LJUD (iOS-säker) ===== */
const enableSoundBtn = document.getElementById("enableSound");
let soundEnabled = false;

enableSoundBtn.addEventListener("click", () => {
  const u = new SpeechSynthesisUtterance("Ljud aktiverat");
  u.lang = "en-US";
  speechSynthesis.speak(u);
  soundEnabled = true;
  enableSoundBtn.style.display = "none";
});

/* ===== QUIZ-STATE ===== */
let selectedCategory = "";
let questions = [];
let currentIndex = 0;
let timer;
let timeLeft = 20;

const CATEGORY_IDS = ["9","11","12","21","15","23","17","22"];

/* ===== KATEGORI ===== */
categoryButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    selectCategory(btn.dataset.category, btn);
  });
});

randomBtn.addEventListener("click", () => {
  const random = CATEGORY_IDS[Math.floor(Math.random() * CATEGORY_IDS.length)];
  const btn = [...categoryButtons].find(b => b.dataset.category === random);
  selectCategory(random, btn);
});

function selectCategory(category, button) {
  selectedCategory = category;
  categoryButtons.forEach(b => b.style.opacity = "0.5");
  randomBtn.style.opacity = "0.5";
  button.style.opacity = "1";
}

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
  } catch {
    alert("Kunde inte hämta frågor. Vänta lite och försök igen.");
    startBtn.disabled = false;
    startBtn.textContent = "Starta quiz";
  }
}

/* ===== QUIZ ===== */
function showQuestion() {
  resetTimer();

  const q = questions[currentIndex];
  const question = decode(q.question);

  questionText.innerHTML = question;
  speak(question);

  answersDiv.innerHTML = "";

  const allAnswers = shuffle([
    q.correct_answer,
    ...q.incorrect_answers
  ]);

  const labels = ["A", "B", "C", "D"];

  allAnswers.forEach((answer, index) => {
    const div = document.createElement("div");
    div.className = "answer";
    div.innerHTML = `<strong>${labels[index]}.</strong> ${decode(answer)}`;
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
    if (timeLeft === 0) nextQuestion();
  }, 1000);
}

function resetTimer() {
  clearInterval(timer);
}

function nextQuestion() {
  resetTimer();
  currentIndex++;
  currentIndex < questions.length ? showQuestion() : showResults();
}

/* ===== FACIT ===== */
function showResults() {
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

function speak(text) {
  if (!soundEnabled) return;

  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);

  // Låt iOS välja bästa röst själv
  u.lang = "sv-SE";
  u.rate = 0.95;   // lite lugnare, mer naturligt
  u.pitch = 1.0;

  const voices = speechSynthesis.getVoices();

  // Försök välja Samantha (Enhanced) om den finns
  const preferred = voices.find(v =>
    v.lang === "en-US" && v.name.toLowerCase().includes("samantha")
  );

  if (preferred) {
    u.voice = preferred;
  }

  speechSynthesis.speak(u);
}



