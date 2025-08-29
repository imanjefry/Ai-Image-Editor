
import { useState, useCallback } from 'react';

export const useImageHistory = (initialState: string | null = null) => {
  const [history, setHistory] = useState<(string | null)[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const setState = useCallback((value: string | null) => {
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(value);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  }, [currentIndex, history]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex(currentIndex - 1);
    }
  }, [canUndo, currentIndex]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex(currentIndex + 1);
    }
  }, [canRedo, currentIndex]);

  return { state, setState, undo, redo, canUndo, canRedo };
};
