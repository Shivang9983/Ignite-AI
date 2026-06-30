import { useRef, useEffect } from "react";
import MessageItem from "./MessageItem.jsx";
import { QUICK_PROMPTS } from "../constants/prompts.js";

/**
 * Handles rendering the main conversation panel, suggestions, inputs, and layout.
 * @param {object} props
 * @param {object} props.activeConv
 * @param {string} props.currentApiKey
 * @param {boolean} props.loading
 * @param {string} props.input
 * @param {Function} props.setInput
 * @param {Function} props.onSendMessage
 * @param {Function} props.onToggleSidebar
 * @param {Function} props.onNewChat
 * @param {Function} props.onOpenSettings
 */
export default function ChatArea({
  activeConv,
  loading,
  input,
  setInput,
  onSendMessage,
  onToggleSidebar,
  onNewChat,
  onOpenSettings
}) {
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const isNewChat = !activeConv || (activeConv.messages.length === 1 && activeConv.messages[0].id === "welcome");

  // Dynamic textarea sizing
  function resizeInput() {
    const box = textareaRef.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${Math.min(box.scrollHeight, 140)}px`;
  }

  // Auto-scroll when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, loading]);

  // Adjust textarea when input state is cleared/updated externally
  useEffect(() => {
    if (input === "") {
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  }, [input]);

  function handleSend() {
    onSendMessage();
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <main className="chat-main">
      {/* Top Header */}
      <header className="header">
        <div className="header-left">
          <button className="toggle-sidebar-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
          </button>
          <span className="model-badge">{activeConv?.model || "gemini-2.5-flash"}</span>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={onNewChat}
            disabled={loading}
            style={{ padding: "6px 12px", fontSize: "0.85rem" }}
          >
            New Chat
          </button>
        </div>
      </header>

      {/* Main Panel Content */}
      {isNewChat ? (
        <div className="welcome-screen">
          <div className="welcome-logo-container">
            <img src="/logo.png" alt="Ignite AI" className="welcome-logo" width="80" height="80" style={{ objectFit: "cover" }} />
          </div>
          <h1 className="welcome-title">How can I help you today?</h1>
          <p className="welcome-subtitle">Ask questions, plan projects, write emails, or debug code with Gemini.</p>
          
          <div className="suggestions-grid">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                className="suggestion-card"
                disabled={loading}
                onClick={() => onSendMessage(prompt.text)}
              >
                <span className="suggestion-card-icon">{prompt.icon}</span>
                <span className="suggestion-card-title">{prompt.title}</span>
                <span className="suggestion-card-desc">{prompt.desc}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="messages-container">
          <div className="messages-list-wrapper">
            {activeConv.messages.map((msg) => (
              <MessageItem key={msg.id} role={msg.role} text={msg.text} />
            ))}

            {loading && !activeConv.messages.some((m) => m.id.startsWith("ai-placeholder")) && (
              <div className="message-item assistant">
                <div className="message-avatar">AI</div>
                <div className="message-content-wrapper">
                  <div className="message-sender">Assistant</div>
                  <div className="message-bubble typing-bubble">
                    <div className="typing-dots">
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                      <span className="typing-dot"></span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* Input Bar Footer */}
      <footer className="chat-footer">
        <div className="footer-inner-wrapper">
          <div className="input-container">
            <textarea
              ref={textareaRef}
              value={input}
              rows={1}
              placeholder="Message Gemini..."
              disabled={loading}
              onChange={(e) => {
                setInput(e.target.value);
                resizeInput();
              }}
              onKeyDown={handleKeyDown}
              className="chat-textarea"
            />
            <button
              type="button"
              className="btn-send-message"
              disabled={loading || !input.trim()}
              onClick={() => handleSend()}
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
          <p className="footer-disclaimer">Gemini can make mistakes. Verify important info.</p>
        </div>
      </footer>
    </main>
  );
}
