const sweetMessages = [
  "You are my favorite person. I love you! 💗",
  "If I had to choose again, I'd still choose you. 💞",
  "You make my heart feel at home. 🏡💕",
  "P.S. You owe me a cuddle! 🥰"
];

function openLoveSurprise(button) {
  const note = document.getElementById("love-note");
  const hero = button.closest(".hero");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!note || !hero) return;

  if (note.classList.contains("is-revealed")) {
    createBoxBurst(button);
    note.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
    return;
  }

  button.disabled = true;
  button.setAttribute("aria-expanded", "true");
  hero.classList.add("surprise-open");
  createBoxBurst(button);

  window.setTimeout(() => {
    note.classList.remove("is-sealed");
    note.classList.add("is-revealed");
    note.removeAttribute("inert");
    note.setAttribute("aria-hidden", "false");
    button.disabled = false;
    button.querySelector(".surprise-label").textContent = "Your love note is open ♡";
    note.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth", block: "center" });
  }, prefersReducedMotion ? 80 : 550);
}

function createBoxBurst(button) {
  const symbols = ["♥", "♡", "✿", "❀", "♥", "🌸"];
  const rect = button.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;

  for (let i = 0; i < 76; i++) {
    const particle = document.createElement("span");
    particle.className = "box-particle";
    particle.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    particle.style.left = `${originX}px`;
    particle.style.top = `${originY}px`;
    particle.style.setProperty("--burst-x", `${(Math.random() - 0.5) * 900}px`);
    particle.style.setProperty("--burst-y", `${-130 - Math.random() * 500}px`);
    particle.style.setProperty("--burst-rotate", `${(Math.random() - 0.5) * 180}deg`);
    particle.style.animationDelay = `${Math.random() * 420}ms`;
    particle.style.animationDuration = `${2.6 + Math.random() * 1.4}s`;
    particle.style.fontSize = `${36 + Math.random() * 38}px`;
    document.body.appendChild(particle);
    particle.addEventListener("animationend", () => particle.remove(), { once: true });
  }
}

function showSurprise() {
  const surprise = document.getElementById("surprise");
  surprise.textContent = sweetMessages[Math.floor(Math.random() * sweetMessages.length)];
  sendHearts();
}

function sendHearts() {
  const colors = ["#e66f91", "#bc91d8", "#f4a261", "#ef9bb0"];
  for (let i = 0; i < 12; i++) {
    const heart = document.createElement("span");
    heart.className = "float-heart";
    heart.textContent = Math.random() > 0.35 ? "♥" : "♡";
    heart.style.left = `${Math.random() * 100}vw`;
    heart.style.color = colors[Math.floor(Math.random() * colors.length)];
    heart.style.fontSize = `${16 + Math.random() * 22}px`;
    heart.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
    document.body.appendChild(heart);
    heart.addEventListener("animationend", () => heart.remove(), { once: true });
  }
}

function setupScratchCard() {
  const canvas = document.getElementById("scratchCanvas");
  const card = document.getElementById("scratchCard");
  const status = document.getElementById("scratchStatus");

  if (!canvas || !card) return;

  const context = canvas.getContext("2d", { willReadFrequently: true });
  let isScratching = false;
  let hasScratched = false;
  let isRevealed = false;
  let moveCount = 0;

  function paintCover() {
    if (hasScratched || isRevealed) return;

    const bounds = canvas.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(bounds.width * pixelRatio);
    canvas.height = Math.round(bounds.height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const foil = context.createLinearGradient(0, 0, bounds.width, bounds.height);
    foil.addColorStop(0, "#f9e6ad");
    foil.addColorStop(.2, "#fff9df");
    foil.addColorStop(.48, "#d9bd78");
    foil.addColorStop(.72, "#fff4cf");
    foil.addColorStop(1, "#e8cb88");
    context.globalCompositeOperation = "source-over";
    context.fillStyle = foil;
    context.fillRect(0, 0, bounds.width, bounds.height);

    context.save();
    context.strokeStyle = "rgba(255, 255, 255, .28)";
    context.lineWidth = 1;
    for (let x = -bounds.height; x < bounds.width; x += 18) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + bounds.height, bounds.height);
      context.stroke();
    }
    context.fillStyle = "rgba(125, 83, 59, .38)";
    context.font = "20px Georgia, serif";
    context.textAlign = "center";
    context.fillText("✦     ✧     ✦     ✧     ✦", bounds.width / 2, 42);
    context.fillText("✧     ✦     ✧     ✦     ✧", bounds.width / 2, bounds.height - 22);
    context.restore();
  }

  function scratchAt(event) {
    const bounds = canvas.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    context.save();
    context.globalCompositeOperation = "destination-out";
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 58;
    context.beginPath();
    context.arc(x, y, 29, 0, Math.PI * 2);
    context.fill();
    context.restore();
    hasScratched = true;
    moveCount += 1;

    if (moveCount % 6 === 0) checkScratchProgress();
  }

  function checkScratchProgress() {
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let transparentPixels = 0;
    let sampledPixels = 0;
    const stride = 28;

    for (let y = 3; y < canvas.height; y += stride) {
      for (let x = 3; x < canvas.width; x += stride) {
        const alphaIndex = (y * canvas.width + x) * 4 + 3;
        if (pixels[alphaIndex] < 70) transparentPixels += 1;
        sampledPixels += 1;
      }
    }

    const progress = transparentPixels / sampledPixels;
    if (progress >= .48) {
      isRevealed = true;
      card.classList.add("is-revealed");
      canvas.setAttribute("aria-label", "");
      if (status) status.textContent = "The words have been revealed.";
      const answerForm = document.getElementById("answerForm");
      if (answerForm) answerForm.hidden = false;
    }
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (isRevealed) return;
    isScratching = true;
    canvas.setPointerCapture(event.pointerId);
    scratchAt(event);
  });
  canvas.addEventListener("pointermove", (event) => {
    if (isScratching && !isRevealed) scratchAt(event);
  });
  canvas.addEventListener("pointerup", () => {
    isScratching = false;
    if (!isRevealed && hasScratched) checkScratchProgress();
  });
  canvas.addEventListener("pointercancel", () => { isScratching = false; });

  paintCover();
  window.addEventListener("resize", paintCover);
}

setupScratchCard();

const answerForm = document.getElementById("answerForm");
if (answerForm) {
  answerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const answerInput = document.getElementById("scratchAnswer");
    const response = document.getElementById("answerResponse");
    if (!answerInput || !response || !answerInput.value.trim()) return;
    response.textContent = "Aww, I love your answer ♡";
    answerInput.value = "";
  });
}
