import { useEffect, useRef, useState } from "react";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { WELCOME } from "./constants/prompts.js";
import Sidebar from "./components/Sidebar.jsx";
import ChatArea from "./components/ChatArea.jsx";
import SettingsModal from "./components/SettingsModal.jsx";
import AuthPage from "./components/AuthPage.jsx";
import { getApiBaseUrl } from "./config/api.js";

const DEFAULT_SETTINGS = {
  apiKey: "",
  defaultModel: "gemini-2.5-flash",
  defaultSystemInstruction: "",
};

export default function App() {
  // Authentication State
  const [token, setToken] = useState(() => localStorage.getItem("ai-chat-token") || "");
  const [user, setUser] = useState(() => {
    const u = localStorage.getItem("ai-chat-user");
    return u ? JSON.parse(u) : null;
  });

  // LocalStorage State (Settings only)
  const [settings, setSettings] = useLocalStorage("ai-chat-settings", DEFAULT_SETTINGS);

  // User-specific states (fetched from backend)
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState("");

  // Ephemeral UI State
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");

  const BACKEND_URL = getApiBaseUrl();

  // Handle successful registration/login
  function handleAuthSuccess(newToken, newUser) {
    localStorage.setItem("ai-chat-token", newToken);
    localStorage.setItem("ai-chat-user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setAuthModalOpen(false);

    if (pendingMessage) {
      handleSendMessage(pendingMessage, newToken);
      setPendingMessage("");
    }
  }

  // Handle Logout
  function handleLogout() {
    localStorage.removeItem("ai-chat-token");
    localStorage.removeItem("ai-chat-user");
    setToken("");
    setUser(null);
    setConversations([]);
    setActiveId("");
  }

  // Helper to save/update a conversation on the backend
  async function saveConvToBackend(conv, userToken = token) {
    if (!userToken) return;
    try {
      await fetch(`${BACKEND_URL}/api/conversations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userToken}`,
        },
        body: JSON.stringify({ conversation: conv }),
      });
    } catch (err) {
      console.error("Failed to save conversation to backend:", err);
    }
  }

  // Helper to delete a conversation from the backend
  async function deleteConvFromBackend(id) {
    if (!token) return;
    try {
      await fetch(`${BACKEND_URL}/api/conversations/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Failed to delete conversation from backend:", err);
    }
  }

  // Load conversations from backend when logged in
  useEffect(() => {
    if (!token) return;
    
    let isMounted = true;
    async function loadConversations() {
      try {
        const response = await fetch(`${BACKEND_URL}/api/conversations`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        
        if (!isMounted) return;

        if (response.ok) {
          const data = await response.json();
          setConversations(data);
          if (data.length > 0) {
            setActiveId(data[0].id);
          }
        } else if (response.status === 401) {
          // Token expired or invalid
          handleLogout();
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      }
    }
    loadConversations();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Create initial chat session if empty after conversations are loaded
  useEffect(() => {
    if (conversations.length === 0 && !loading) {
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
      if (token) {
        saveConvToBackend(defaultConv);
      }
    }
  }, [token, conversations.length, settings.defaultModel, settings.defaultSystemInstruction]);

  // Find active conversation
  const activeConv = conversations.find((c) => c.id === activeId) || conversations[0];

  // Helper to build message history for backend Gemini route
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

  // Action: Send message (handles SSE streaming from backend)
  async function handleSendMessage(pickedText, overrideToken) {
    const text = (pickedText ?? input).trim();
    if (!text || loading) return;

    const currentToken = overrideToken || token;
    if (!currentToken) {
      setPendingMessage(text);
      setAuthModalOpen(true);
      return;
    }

    const currentConvId = activeConv.id;
    const userMsg = { id: `user-${Date.now()}`, role: "user", text };
    const aiPlaceholderId = `ai-placeholder-${Date.now()}`;
    const oldMessages = activeConv.messages;

    const updatedMessages = [...oldMessages, userMsg];
    let updatedConv = {
      ...activeConv,
      messages: updatedMessages,
    };

    if (activeConv.title === "New Chat") {
      updatedConv.title = text.substring(0, 30) + (text.length > 30 ? "..." : "");
    }

    // Update local state first to show user's message
    setConversations((prev) =>
      prev.map((c) => (c.id === currentConvId ? updatedConv : c))
    );

    setInput("");
    setLoading(true);

    try {
      const contents = buildHistory(oldMessages, text);
      
      const response = await fetch(`${BACKEND_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${currentToken}`,
        },
        body: JSON.stringify({
          model: activeConv.model || "gemini-2.5-flash",
          contents,
          systemInstruction: activeConv.systemInstruction,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate response");
      }

      // Add AI placeholder message to UI
      const aiPlaceholder = { id: aiPlaceholderId, role: "assistant", text: "" };
      const updatedMessagesWithPlaceholder = [...updatedMessages, aiPlaceholder];
      updatedConv = { ...updatedConv, messages: updatedMessagesWithPlaceholder };

      setConversations((prev) =>
        prev.map((c) => (c.id === currentConvId ? updatedConv : c))
      );

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.trim();
          if (line.startsWith("data: ")) {
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              if (parsed.text) {
                fullText += parsed.text;
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
            } catch (err) {
              console.error("Error parsing stream line:", err);
            }
          }
        }
      }

      // Save complete conversation to backend
      const finalConv = {
        ...updatedConv,
        messages: [...updatedMessages, { id: aiPlaceholderId, role: "assistant", text: fullText }],
      };
      await saveConvToBackend(finalConv, currentToken);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      const errorMsg = { id: `error-${Date.now()}`, role: "assistant", text: `Error: ${msg}`, isError: true };
      
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === currentConvId) {
            const filteredMessages = c.messages.filter((m) => m.id !== aiPlaceholderId);
            const finalConvWithError = {
              ...c,
              messages: [...filteredMessages, errorMsg],
            };
            saveConvToBackend(finalConvWithError, currentToken);
            return finalConvWithError;
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
    
    if (token) {
      saveConvToBackend(newConv);
    }
  }

  // Action: Delete chat session
  async function handleDeleteChat(id, event) {
    event.stopPropagation();
    if (loading) return;

    await deleteConvFromBackend(id);

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
      if (token) {
        saveConvToBackend(defaultConv);
      }
    } else {
      setConversations(remaining);
      if (activeId === id) {
        setActiveId(remaining[0].id);
      }
    }
  }

  // Action: Rename chat session
  function handleRenameChat(id, newTitle) {
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c));
      const renamedConv = updated.find((c) => c.id === id);
      if (renamedConv && token) {
        saveConvToBackend(renamedConv);
      }
      return updated;
    });
  }

  // Action: Save updated settings
  function handleSaveSettings(newSettings) {
    setSettings(newSettings);
    setSettingsOpen(false);

    if (activeConv) {
      const updatedConv = {
        ...activeConv,
        model: newSettings.defaultModel,
        systemInstruction: newSettings.defaultSystemInstruction,
      };
      setConversations((prev) =>
        prev.map((c) => (c.id === activeConv.id ? updatedConv : c))
      );
      if (token) {
        saveConvToBackend(updatedConv);
      }
    }
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
        user={user}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <ChatArea
        activeConv={activeConv}
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

      {authModalOpen && (
        <AuthPage
          onAuthSuccess={handleAuthSuccess}
          isModal={true}
          onClose={() => setAuthModalOpen(false)}
        />
      )}
    </div>
  );
}
