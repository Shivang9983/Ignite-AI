import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { createGeminiClient, streamContent } from "./services/gemini.js";
import { WELCOME } from "./constants/prompts.js";
import Sidebar from "./components/Sidebar.jsx";
import ChatArea from "./components/ChatArea.jsx";
import SettingsModal from "./components/SettingsModal.jsx";

const DEFAULT_SETTINGS = {
  apiKey: "",
  defaultModel: "gemini-2.5-flash",
  defaultSystemInstruction: "",
};

export default function App() {
  // LocalStorage State
  const [settings, setSettings] = useLocalStorage("ai-chat-settings", DEFAULT_SETTINGS);
  const [conversations, setConversations] = useLocalStorage("ai-chat-conversations", []);
  const [activeId, setActiveId] = useLocalStorage("ai-chat-active-id", "");

  // Ephemeral UI State
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const clientRef = useRef(null);

  // Initialize initial state if empty
  useEffect(() => {
    if (conversations.length === 0) {
      const initialId = `chat-${Date.now()}`;
      const defaultConv = {
        id: initialId,
        title: "New Chat",
        messages: [WELCOME],
        model: settings.defaultModel || "gemini-2.5-flash",
        systemInstruction: settings.defaultSystemInstruction || "",
        createdAt: Date.now(),
      };
      setConversations([defaultConv]);
      setActiveId(initialId);
    }
  }, [conversations.length, setConversations, setActiveId, settings.defaultModel, settings.defaultSystemInstruction]);

  // Update Gemini client on API key change
  const currentApiKey = settings.apiKey || import.meta.env.VITE_GEMINI_API_KEY || "";
  
  useEffect(() => {
    clientRef.current = createGeminiClient(currentApiKey);
  }, [currentApiKey]);

  // Find active conversation
  const activeConv = conversations.find((c) => c.id === activeId) || conversations[0];

  // Helper to build message history for the Gemini API
  function buildHistory(messages, newText) {
    const history = messages
      .filter((msg) => msg.id !== "welcome" && msg.role !== "error")
      .map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.text }],
      }));

    if (newText) {
      history.push({ role: "user", parts: [{ text: newText }] });
    }
    return history;
  }

  // Action: Send message (handles streaming)
  async function handleSendMessage(pickedText) {
    const text = (pickedText ?? input).trim();
    if (!text || loading) return;

    if (!clientRef.current) {
      setSettingsOpen(true);
      return;
    }

    const currentConvId = activeConv.id;
    const userMsg = { id: `user-${Date.now()}`, role: "user", text };
    const aiPlaceholderId = `ai-placeholder-${Date.now()}`;
    const oldMessages = activeConv.messages;

    // Append user message & auto-generate title if initial message
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === currentConvId) {
          const newTitle = c.title === "New Chat"
            ? text.substring(0, 30) + (text.length > 30 ? "..." : "")
            : c.title;

          return {
            ...c,
            title: newTitle,
            messages: [...c.messages, userMsg],
          };
        }
        return c;
      })
    );

    setInput("");
    setLoading(true);

    try {
      const contents = buildHistory(oldMessages, text);
      
      const responseStream = await streamContent(clientRef.current, {
        model: activeConv.model || "gemini-2.5-flash",
        contents,
        systemInstruction: activeConv.systemInstruction,
      });

      // Insert AI message block
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === currentConvId) {
            return {
              ...c,
              messages: [...c.messages, { id: aiPlaceholderId, role: "assistant", text: "" }],
            };
          }
          return c;
        })
      );

      let fullText = "";
      for await (const chunk of responseStream) {
        const textChunk = chunk.text;
        if (textChunk) {
          fullText += textChunk;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === currentConvId) {
                return {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === aiPlaceholderId ? { ...m, text: fullText } : m
                  ),
                };
              }
              return c;
            })
          );
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === currentConvId) {
            const filteredMessages = c.messages.filter((m) => m.id !== aiPlaceholderId);
            return {
              ...c,
              messages: [
                ...filteredMessages,
                { id: `error-${Date.now()}`, role: "assistant", text: `Error: ${msg}`, isError: true },
              ],
            };
          }
          return c;
        })
      );
    } finally {
      setLoading(false);
    }
  }

  // Action: Create new chat session
  function handleNewChat() {
    if (loading) return;
    const newId = `chat-${Date.now()}`;
    const newConv = {
      id: newId,
      title: "New Chat",
      messages: [WELCOME],
      model: settings.defaultModel || "gemini-2.5-flash",
      systemInstruction: settings.defaultSystemInstruction || "",
      createdAt: Date.now(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveId(newId);
    setInput("");
    setSidebarOpen(false);
  }

  // Action: Delete chat session
  function handleDeleteChat(id, event) {
    event.stopPropagation();
    if (loading) return;

    const remaining = conversations.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      const newId = `chat-${Date.now()}`;
      const defaultConv = {
        id: newId,
        title: "New Chat",
        messages: [WELCOME],
        model: settings.defaultModel || "gemini-2.5-flash",
        systemInstruction: settings.defaultSystemInstruction || "",
        createdAt: Date.now(),
      };
      setConversations([defaultConv]);
      setActiveId(newId);
    } else {
      setConversations(remaining);
      if (activeId === id) {
        setActiveId(remaining[0].id);
      }
    }
  }

  // Action: Rename chat session
  function handleRenameChat(id, newTitle) {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
    );
  }

  // Action: Save updated settings
  function handleSaveSettings(newSettings) {
    setSettings(newSettings);
    setSettingsOpen(false);
  }

  return (
    <div className="app-container">
      <Sidebar
        isOpen={sidebarOpen}
        conversations={conversations}
        activeId={activeId}
        onSelectChat={setActiveId}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onClose={() => setSidebarOpen(false)}
        loading={loading}
      />

      <ChatArea
        activeConv={activeConv}
        currentApiKey={currentApiKey}
        loading={loading}
        input={input}
        setInput={setInput}
        onSendMessage={handleSendMessage}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}
