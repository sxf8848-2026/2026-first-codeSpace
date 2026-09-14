import { useState } from "react";
import { TodoData } from "../types";

type DataHistory = {
  past: TodoData[];
  future: TodoData[];
};

const DEFAULT_HISTORY_LIMIT = 50;

export function useDataHistory(limit = DEFAULT_HISTORY_LIMIT) {
  const [history, setHistory] = useState<DataHistory>({ past: [], future: [] });

  function pushHistory(data: TodoData) {
    setHistory((value) => ({
      past: [...value.past, data].slice(-limit),
      future: [],
    }));
  }

  function resetHistory() {
    setHistory({ past: [], future: [] });
  }

  function undoData(current: TodoData, apply: (data: TodoData) => void) {
    setHistory((value) => {
      const previous = value.past[value.past.length - 1];
      if (!previous) return value;
      apply(previous);
      return {
        past: value.past.slice(0, -1),
        future: [current, ...value.future].slice(0, limit),
      };
    });
  }

  function redoData(current: TodoData, apply: (data: TodoData) => void) {
    setHistory((value) => {
      const next = value.future[0];
      if (!next) return value;
      apply(next);
      return {
        past: [...value.past, current].slice(-limit),
        future: value.future.slice(1),
      };
    });
  }

  return {
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    pushHistory,
    resetHistory,
    undoData,
    redoData,
  };
}
