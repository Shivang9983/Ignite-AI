import { useEffect, useRef, useState } from "react";
import { GoogleGenAI } from "@google/genai";
import Message from "./Message.jsx";
import DarkModeToggle from "./components/DarkModeToggle.jsx";

const WELCOME = {
  id: "welcome",
  role: "assistant",
  text: "Hello! Ask me anything — I am here to help.",
};

// const QUICK_PROMPTS = [
//   "What is React?",
//   "Help me write an email",
//   "3 tips to study better",
// ];

function createClient() {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Add VITE_GEMINI_API_KEY in your .env file and restart the server.");
  }
  return new GoogleGenAI({ apiKey });
}

function buildHistory(messages, newText) {
  const history = messages
    .filter((msg) => msg.id !== "welcome")
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.text }],
    }));

  history.push({ role: "user", parts: [{ text: newText }] });
  return history;
}

function tryCreateClient() {
  try {
    return { client: createClient(), error: "" };
  } catch (err) {
    return {
      client: null,
      error: err instanceof Error ? err.message : "Could not connect to Gemini.",
    };
  }
}

function App() {
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [setup] = useState(tryCreateClient);
  const [error, setError] = useState(setup.error);

  const clientRef = useRef(setup.client);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const idCounter = useRef(0);

  const isNewChat = messages.length === 1 && messages[0].id === "welcome";

  function makeId(prefix) {
    idCounter.current += 1;
    return `${prefix}-${idCounter.current}`;
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!loading) {
      inputRef.current?.focus();
    }
  }, [loading]);

  function resizeInput() {
    const box = inputRef.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${Math.min(box.scrollHeight, 100)}px`;
  }

  async function sendMessage(pickedText) {
    const text = (pickedText ?? input).trim();
    if (!text || loading) return;

    if (!clientRef.current) {
      setError("Check your API key in the .env file.");
      return;
    }

    const userMsg = { id: makeId("user"), role: "user", text };
    const oldMessages = messages;

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError("");

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const response = await clientRef.current.models.generateContent({
        model: "gemini-2.5-flash",
        contents: buildHistory(oldMessages, text),
      });

      const reply =
        response.text?.trim() || "No reply came back. Please try again.";

      setMessages((prev) => [
        ...prev,
        { id: makeId("ai"), role: "assistant", text: reply },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setMessages((prev) => [
        ...prev,
        { id: makeId("error"), role: "assistant", text: `Error: ${msg}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function startNewChat() {
    if (loading) return;
    setMessages([WELCOME]);
    setInput("");
    setError("");
    inputRef.current?.focus();
  }

  return (
    <div className="page">
      <div className="chat">
        <header className="header">
          <div className="header-title">
            <img src="/favicon.svg" alt="" className="logo" width="28" height="28" />
            <h1>AI Chat</h1>
          </div>
          <div className="header-actions">
            <DarkModeToggle />
            <button
              type="button"
              className="text-btn"
              onClick={startNewChat}
              disabled={loading}
            >
              New chat
            </button>
          </div>
        </header>

        {error && <p className="error">{error}</p>}

        {isNewChat && (
          <div className="suggestions">
            {/* {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="suggestion"
                disabled={loading}
                onClick={() => sendMessage(prompt)}
              >
                {prompt}
              </button>
            ))} */}
          </div>
        )}

        <main className="messages">
          {messages.map((msg) => (
            <Message key={msg.id} role={msg.role} text={msg.text} />
          ))}

          {loading && (
            <div className="message message-ai">
              <div className="bubble typing">Thinking...</div>
            </div>
          )}

          <div ref={bottomRef} />
        </main>

        <footer className="footer">
          <div className="footer-inner">
            <textarea
              ref={inputRef}
              value={input}
              rows={1}
              placeholder="Type your message..."
              disabled={loading}
              onChange={(e) => {
                setInput(e.target.value);
                resizeInput();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <button
              type="button"
              className="send-btn"
              disabled={loading || !input.trim()}
              onClick={() => sendMessage()}
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
          {/* <p className="footer-hint">Enter to send · Shift+Enter for new line</p> */}
        </footer>
      </div>
    </div>
  );
}

export default App;
