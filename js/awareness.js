/* ============================================================
   ShieldX — awareness.js
   Renders the Cyber Awareness cards and runs the phishing
   spot-the-phish quiz.
   ============================================================ */

const ShieldXAwareness = (() => {

  const CARDS = [
    {
      tag: "Pattern 01",
      title: "Urgency and threats",
      body: "Messages that push you to act \"immediately\" or threaten account suspension are designed to stop you from thinking it through."
    },
    {
      tag: "Pattern 02",
      title: "Lookalike domains",
      body: "Addresses like paypa1-secure.com or amazon-verify.info mimic real brands with small, easy-to-miss changes."
    },
    {
      tag: "Pattern 03",
      title: "Requests for credentials",
      body: "Real organizations very rarely ask you to confirm a password, PIN, or OTP by email, text, or an unexpected link."
    },
    {
      tag: "Pattern 04",
      title: "Generic greetings",
      body: "\"Dear valued customer\" instead of your name is a sign the message was sent to thousands of people at once."
    },
    {
      tag: "Pattern 05",
      title: "Unexpected attachments or links",
      body: "Files or links you didn't ask for, especially with vague names like \"Invoice.pdf\" or \"Document,\" deserve extra caution."
    },
    {
      tag: "Pattern 06",
      title: "Too good to be true offers",
      body: "Prize winnings, refunds you didn't request, or unbelievable discounts are among the oldest tricks that still work."
    }
  ];

  const QUIZ = [
    {
      scenario: "From: security@paypa1-support.com\nSubject: Unusual activity detected\n\n\"Your account has been temporarily limited. Click here within 24 hours to verify your identity or your account will be closed.\"",
      question: "What's the biggest red flag here?",
      options: [
        { text: "The subject line mentions security", correct: false },
        { text: "The sender domain misspells \"PayPal\" and there's a countdown pressure tactic", correct: true },
        { text: "It's addressed to a specific person", correct: false }
      ],
      feedback: "\"paypa1\" swaps a letter for a number, and the 24-hour deadline is designed to make you act before checking."
    },
    {
      scenario: "Text message: \"Congrats! You've been selected for a $750 Amazon gift card. Claim here: bit.ly/claim-reward-now\"",
      question: "Why should this raise suspicion?",
      options: [
        { text: "Unsolicited prize plus a shortened, unverifiable link", correct: true },
        { text: "It mentions a real company name", correct: false },
        { text: "It's a text message rather than an email", correct: false }
      ],
      feedback: "Unexpected prizes combined with shortened links (which hide the real destination) are a classic scam pattern."
    },
    {
      scenario: "Email from your \"bank\": \"We need to confirm your login details due to a system upgrade. Reply with your username and password to avoid service interruption.\"",
      question: "What should you do?",
      options: [
        { text: "Reply with the details since it's about avoiding interruption", correct: false },
        { text: "Ignore it and log in directly via the bank's official app or website if concerned", correct: true },
        { text: "Forward your password to a friend to double-check first", correct: false }
      ],
      feedback: "No legitimate bank asks you to email your password. If in doubt, go directly to the official app or site instead of replying."
    },
    {
      scenario: "LinkedIn message from a stranger: \"Hi, loved your profile! I have a remote job paying $9,000/month, no experience needed. DM me your email and phone number to start today.\"",
      question: "What makes this suspicious?",
      options: [
        { text: "Unrealistic pay for no experience, plus a request for personal contact info upfront", correct: true },
        { text: "It compliments your profile", correct: false },
        { text: "It's sent through LinkedIn instead of email", correct: false }
      ],
      feedback: "Offers that sound too good to be true, paired with quick requests for personal information, are a common recruitment scam pattern."
    },
    {
      scenario: "Email: \"Invoice_4471_Final.zip attached. Please review and process payment by end of day.\" You don't recognize the sender or expect an invoice.",
      question: "What's the safest first step?",
      options: [
        { text: "Open the attachment quickly since it says \"final\"", correct: false },
        { text: "Verify with your team whether this invoice is expected before opening anything", correct: true },
        { text: "Forward it to process payment immediately", correct: false }
      ],
      feedback: "Unexpected attachments, especially compressed files, are a common way to deliver malware. Confirm legitimacy before opening."
    }
  ];

  let currentQ = 0;
  let score = 0;
  let answered = false;

  function init(){
    renderCards();
    resetQuiz();
  }

  function renderCards(){
    const grid = document.getElementById("awarenessGrid");
    grid.innerHTML = "";
    CARDS.forEach(card => {
      const div = document.createElement("div");
      div.className = "awareness-card";
      div.innerHTML = `
        <span class="awareness-card__tag">${card.tag}</span>
        <h3>${card.title}</h3>
        <p>${card.body}</p>
      `;
      grid.appendChild(div);
    });
  }

  function resetQuiz(){
    currentQ = 0;
    score = 0;
    answered = false;
    renderQuestion();
  }

  function renderQuestion(){
    const body = document.getElementById("quizBody");
    const progress = document.getElementById("quizProgress");

    if (currentQ >= QUIZ.length){
      progress.textContent = "Complete";
      body.innerHTML = `
        <div class="quiz-result">
          <div class="quiz-result__score">${score} / ${QUIZ.length}</div>
          <p>${scoreMessage(score)}</p>
          <button class="btn btn--secondary" id="quizRestartBtn">Try again</button>
        </div>
      `;
      document.getElementById("quizRestartBtn").addEventListener("click", resetQuiz);
      return;
    }

    progress.textContent = `Question ${currentQ + 1} of ${QUIZ.length}`;
    const q = QUIZ[currentQ];
    answered = false;

    body.innerHTML = `
      <div class="quiz-scenario">${escapeHtml(q.scenario)}</div>
      <p class="quiz-question">${escapeHtml(q.question)}</p>
      <div class="quiz-options" id="quizOptions"></div>
      <div class="quiz-footer" id="quizFooter"></div>
    `;

    const optionsEl = document.getElementById("quizOptions");
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.textContent = opt.text;
      btn.addEventListener("click", () => selectAnswer(i));
      optionsEl.appendChild(btn);
    });
  }

  function selectAnswer(index){
    if (answered) return;
    answered = true;
    const q = QUIZ[currentQ];
    const buttons = document.querySelectorAll("#quizOptions .quiz-option");

    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (q.options[i].correct) btn.classList.add("is-correct");
      else if (i === index) btn.classList.add("is-wrong");
    });

    if (q.options[index].correct) score++;

    const body = document.getElementById("quizBody");
    const feedback = document.createElement("p");
    feedback.className = "quiz-feedback";
    feedback.textContent = q.feedback;
    body.appendChild(feedback);

    const footer = document.getElementById("quizFooter");
    const nextBtn = document.createElement("button");
    nextBtn.className = "btn btn--primary btn--small";
    nextBtn.textContent = currentQ === QUIZ.length - 1 ? "See score" : "Next question";
    nextBtn.addEventListener("click", () => { currentQ++; renderQuestion(); });
    footer.appendChild(nextBtn);
  }

  function scoreMessage(s){
    if (s === QUIZ.length) return "Perfect score — you're spotting every red flag.";
    if (s >= QUIZ.length - 2) return "Good instincts. A quick review of the patterns above will sharpen the rest.";
    return "Worth a second look at the patterns above — phishing relies on these tricks working.";
  }

  function escapeHtml(str){
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  return { init };

})();