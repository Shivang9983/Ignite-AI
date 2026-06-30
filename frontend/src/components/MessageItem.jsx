import ReactMarkdown from "react-markdown";
import CodeBlock from "./CodeBlock.jsx";

/**
 * Renders an individual message item within the chat.
 * @param {object} props
 * @param {string} props.role - 'user' or 'assistant'
 * @param {string} props.text - The message content.
 */
export default function MessageItem({ role, text }) {
  const isUser = role === "user";

  const components = {
    code({ node, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match && !String(children).includes("\n");
      return !isInline ? (
        <CodeBlock
          language={match ? match[1] : "code"}
          value={String(children).replace(/\n$/, "")}
        />
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  };

  return (
    <div className={`message-item ${isUser ? "user" : "assistant"}`}>
      <div className="message-avatar">
        {isUser ? "U" : "AI"}
      </div>
      <div className="message-content-wrapper">
        <div className="message-sender">
          {isUser ? "You" : "Assistant"}
        </div>
        <div className="message-bubble">
          {isUser ? (
            <p style={{ whiteSpace: "pre-wrap" }}>{text}</p>
          ) : (
            <ReactMarkdown components={components}>{text}</ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
}
