import { useState, useCallback } from "react";
import { useStdin } from "ink";
import { openInEditor, resolveEditor, isTerminalEditor } from "../lib/editor.js";

export function useEditor(): {
  openEditor: (filePath: string) => Promise<void>;
  isEditing: boolean;
} {
  const { setRawMode } = useStdin();
  const [isEditing, setIsEditing] = useState(false);

  const openEditor = useCallback(async (filePath: string) => {
    const editor = resolveEditor();
    const terminal = isTerminalEditor(editor.command);

    setIsEditing(true);

    if (terminal) {
      setRawMode(false);
    }

    try {
      openInEditor(filePath);
    } finally {
      if (terminal) {
        setRawMode(true);
      }
      setIsEditing(false);
    }
  }, [setRawMode]);

  return { openEditor, isEditing };
}
