import { useState } from "react";
import DarkModeToggle from "./DarkModeToggle.jsx";

/**
 * Sidebar component showing list of conversations and app settings trigger.
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Array} props.conversations
 * @param {string} props.activeId
 * @param {Function} props.onSelectChat
 * @param {Function} props.onNewChat
 * @param {Function} props.onDeleteChat
 * @param {Function} props.onRenameChat
 * @param {Function} props.onOpenSettings
 * @param {Function} props.onClose
 * @param {boolean} props.loading
 * @param {object} props.user
 * @param {Function} props.onLogout
 */
export default function Sidebar({
  isOpen,
  conversations,
  activeId,
  onSelectChat,
  onNewChat,
  onDeleteChat,
  onRenameChat,
  onOpenSettings,
  onClose,
  loading,
  user,
  onLogout
}) {
  const [editingId, setEditingId] = useState(null);
  const [editTitleText, setEditTitleText] = useState("");

  function startRename(id, title, e) {
    e.stopPropagation();
    setEditingId(id);
    setEditTitleText(title);
  }

  function handleSaveRename(id, e) {
    if (e) e.stopPropagation();
    if (editTitleText.trim()) {
      onRenameChat(id, editTitleText.trim());
    }
    setEditingId(null);
  }

  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src="/logo.png" alt="" className="logo" width="24" height="24" style={{ objectFit: "cover" }} />
            <span>Ignite AI</span>
          </div>
          <button className="toggle-sidebar-btn md-hide" onClick={onClose} aria-label="Close sidebar" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <button className="btn-new-chat" onClick={onNewChat} disabled={loading} type="button">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          <span>New Chat</span>
        </button>

        <div className="sidebar-history">
          <div className="history-section">
            <span className="history-section-title">Recent Chats</span>
            {conversations.map((conv) => {
              const isActive = conv.id === activeId;
              const isEditing = conv.id === editingId;

              return (
                <div
                  key={conv.id}
                  className={`history-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    if (!loading) {
                      onSelectChat(conv.id);
                      onClose();
                    }
                  }}
                >
                  <div className="history-title-wrap">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                    
                    {isEditing ? (
                      <input
                        type="text"
                        className="history-rename-input"
                        value={editTitleText}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditTitleText(e.target.value)}
                        onBlur={() => handleSaveRename(conv.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(conv.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        style={{
                          background: "var(--bg-primary)",
                          color: "var(--text-primary)",
                          border: "1px solid var(--accent)",
                          borderRadius: "4px",
                          padding: "2px 4px",
                          width: "100%",
                          fontSize: "inherit"
                        }}
                      />
                    ) : (
                      <span className="history-item-text">{conv.title}</span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="history-item-actions">
                      <button
                        className="history-action-btn"
                        onClick={(e) => startRename(conv.id, conv.title, e)}
                        aria-label="Rename chat"
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </button>
                      <button
                        className="history-action-btn delete-btn"
                        onClick={(e) => onDeleteChat(conv.id, e)}
                        aria-label="Delete chat"
                        disabled={loading}
                        type="button"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="sidebar-footer" style={{ display: "flex", flexDirection: "column", gap: "10px", alignItems: "stretch" }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--accent)", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "0.85rem", flexShrink: 0 }}>
                  {user.username.substring(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.username}
                </span>
              </div>
              <button 
                onClick={onLogout}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Logout"
                type="button"
                className="history-action-btn delete-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              </button>
            </div>
          )}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button className="sidebar-footer-btn" onClick={onOpenSettings} aria-label="Settings" type="button">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
            </button>
            <DarkModeToggle />
          </div>
        </div>
      </aside>
    </>
  );
}
