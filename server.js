// ===== Frontdesk Simple Server =====
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public')); // <- Serve HTML dashboard

// Temporary storage (instead of database)
let helpRequests = [];
let knowledgeBase = [];

// Endpoint 1 — Receive a customer question
app.post("/api/call", (req, res) => {
  const { customerName, question } = req.body;

  // Check if the answer exists in our knowledge base
  const known = knowledgeBase.find((item) =>
    question.toLowerCase().includes(item.question.toLowerCase())
  );

  if (known) {
    return res.json({
      message: `Hi ${customerName}, ${known.answer}`,
    });
  } else {
    const newRequest = {
      id: Date.now().toString(),
      customerName,
      question,
      status: "pending",
    };
    helpRequests.push(newRequest);

    console.log(
      `🧠 AI: I don't know the answer. Escalating to supervisor for: "${question}"`
    );
    return res.json({
      message: `Hi ${customerName}, let me check with my supervisor and get back to you.`,
    });
  }
});

// Endpoint 2 — Supervisor sees all pending requests
app.get("/api/requests", (req, res) => {
  res.json(helpRequests);
});

// Endpoint 3 — Supervisor submits an answer
app.post("/api/requests/:id/resolve", (req, res) => {
  const { id } = req.params;
  const { answer } = req.body;

  const request = helpRequests.find((r) => r.id === id);
  if (!request) return res.status(404).json({ message: "Request not found" });

  request.status = "resolved";
  request.answer = answer;

  // Save to knowledge base
  knowledgeBase.push({
    question: request.question,
    answer: answer,
  });

  console.log(
    `👩‍💼 Supervisor answered: "${answer}" for "${request.question}"`
  );
  console.log(`🤖 AI: Hey ${request.customerName}, ${answer}`);

  res.json({ message: "Request resolved and knowledge updated" });
});

// Endpoint 4 — View learned answers
app.get("/api/kb", (req, res) => {
  res.json(knowledgeBase);
});

app.listen(4000, () => {
  console.log("✅ Server running on http://localhost:4000");
});
