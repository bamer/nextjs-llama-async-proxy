import React from 'react';

interface ConfigPanelProps {
  isSaving: boolean;
  saveMessage: string;
  handleSave: () => void;
}

export function ConfigPanel({ isSaving, saveMessage, handleSave }: ConfigPanelProps) {
  return (
    <>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="bg-primary text-primary-foreground hover:bg-primary/80 disabled:opacity-50 px-4 py-2 rounded-md transition-colors"
      >
        {isSaving ? 'Saving...' : 'Save Configuration'}
      </button>

      {saveMessage && (
        <div className={`mt-4 p-3 rounded-md ${saveMessage.includes('successfully') ? 'bg-success text-white border border-success' : 'bg-warning text-white border border-warning'}`}>
          {saveMessage}
        </div>
      )}
    </>
  );
}
