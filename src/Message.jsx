import ReactMarkdown from "react-markdown";

export default function Message({ role, text }) {
  const isUser = role === "user";

  return (
    <div className={`message ${isUser ? "message-user" : "message-ai"}`}>
      <div className="bubble">
        {isUser ? text : <ReactMarkdown>{text}</ReactMarkdown>}
      </div>
    </div>
  );
}
