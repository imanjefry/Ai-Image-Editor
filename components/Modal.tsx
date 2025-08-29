
import React, { useState } from 'react';

interface ModalProps {
  onClose: () => void;
  onSubmit: (prompt: string) => void;
}

export const Modal: React.FC<ModalProps> = ({ onClose, onSubmit }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-lg m-4 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-4 text-gray-100">AI Image Generation</h2>
        <p className="text-gray-400 mb-4 text-sm">Describe the changes you want to make. For example, "add a hat to the person" or "make the background a futuristic city".</p>
        <form onSubmit={handleSubmit}>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Change the color of the car to red"
            className="w-full p-2 rounded-md bg-gray-900 border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition text-gray-200 h-28 resize-none"
            autoFocus
          />
          <div className="flex justify-end mt-4 space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md bg-gray-600 hover:bg-gray-500 transition text-white font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!prompt.trim()}
              className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-500 transition text-white font-semibold disabled:bg-gray-500 disabled:cursor-not-allowed"
            >
              Generate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
