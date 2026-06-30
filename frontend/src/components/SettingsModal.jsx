import { useState, useEffect } from "react";

/**
 * A controlled settings modal component.
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {object} props.settings - { apiKey, defaultModel, defaultSystemInstruction }
 * @param {Function} props.onSave
 */
export default function SettingsModal({ isOpen, onClose, settings, onSave }) {
  const [tempApiKey, setTempApiKey] = useState(settings.apiKey);
  const [tempModel, setTempModel] = useState(settings.defaultModel);
  const [tempInstruction, setTempInstruction] = useState(settings.defaultSystemInstruction);

  // Sync state when settings change or modal opens
  useEffect(() => {
    if (isOpen) {
      setTempApiKey(settings.apiKey);
      setTempModel(settings.defaultModel);
      setTempInstruction(settings.defaultSystemInstruction);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSave({
      apiKey: tempApiKey.trim(),
      defaultModel: tempModel,
      defaultSystemInstruction: tempInstruction.trim()
    });
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="model-select">Default Model</label>
              <select
                id="model-select"
                className="form-select"
                value={tempModel}
                onChange={(e) => setTempModel(e.target.value)}
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Default)</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="system-instruction-textarea">System Instructions</label>
              <textarea
                id="system-instruction-textarea"
                className="form-textarea"
                value={tempInstruction}
                onChange={(e) => setTempInstruction(e.target.value)}
                placeholder="e.g. You are a senior React programmer. Give short, concise code answers."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose} type="button">Cancel</button>
            <button className="btn-primary" type="submit">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
