import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import { inkColors, symbols } from "../theme.js";
import type { SidebarItem } from "../hooks/useSidebarItems.js";

interface SidebarProps {
  items: SidebarItem[];
  selectedId: string;
  isFocused: boolean;
  height: number;
  onSelect: (itemId: string) => void;
  onHighlight?: (itemId: string) => void;
}

interface SectionGroup {
  title: string;
  items: SidebarItem[];
}

function groupSections(items: SidebarItem[]): SectionGroup[] {
  const groups: SectionGroup[] = [];
  let current: SectionGroup | null = null;

  for (const item of items) {
    if (item.type === "separator" && item.sectionTitle) {
      current = { title: item.sectionTitle, items: [] };
      groups.push(current);
    } else if (current) {
      current.items.push(item);
    }
  }

  return groups;
}

export function Sidebar({
  items,
  selectedId,
  isFocused,
  height,
  onSelect,
  onHighlight,
}: SidebarProps): React.ReactElement {
  const selectableItems = useMemo(
    () => items.filter((item) => item.type !== "separator"),
    [items],
  );
  const selectedIdx = selectableItems.findIndex((item) => item.id === selectedId);
  const [cursorIdx, setCursorIdx] = useState(Math.max(0, selectedIdx));

  const sections = useMemo(() => groupSections(items), [items]);

  // Defer useInput activation so isActive transitions false→true,
  // working around Ink's useInput not subscribing on first render tick.
  const [inputReady, setInputReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setInputReady(true), 0);
    return () => clearTimeout(t);
  }, []);

  // Sync cursor when selectedId changes externally
  useEffect(() => {
    const idx = selectableItems.findIndex((item) => item.id === selectedId);
    if (idx >= 0) setCursorIdx(idx);
  }, [selectedId, selectableItems]);

  useInput(
    (input, key) => {
      if (key.upArrow || input === "k") {
        setCursorIdx((prev) => {
          const next = prev > 0 ? prev - 1 : selectableItems.length - 1;
          const item = selectableItems[next];
          if (item && onHighlight) onHighlight(item.id);
          return next;
        });
      }
      if (key.downArrow || input === "j") {
        setCursorIdx((prev) => {
          const next = prev < selectableItems.length - 1 ? prev + 1 : 0;
          const item = selectableItems[next];
          if (item && onHighlight) onHighlight(item.id);
          return next;
        });
      }
      if (key.return || key.rightArrow) {
        const item = selectableItems[cursorIdx];
        if (item) {
          onSelect(item.id);
        }
      }
    },
    { isActive: isFocused && inputReady },
  );

  // Pre-compute flat indices for each section to avoid mutable counter in render
  const sectionIndices = useMemo(() => {
    let idx = 0;
    return sections.map((section) => {
      const start = idx;
      idx += section.items.length;
      return { start, end: idx - 1 };
    });
  }, [sections]);

  return (
    <Box flexDirection="column" gap={0}>
      {sections.map((section, sectionIdx) => {
        const { start: sectionStartIdx, end: sectionEndIdx } = sectionIndices[sectionIdx]!;
        const hasCursorInSection = isFocused && cursorIdx >= sectionStartIdx && cursorIdx <= sectionEndIdx;
        const hasActiveInSection = section.items.some((item) => item.id === selectedId);
        const borderColor = hasCursorInSection || hasActiveInSection ? inkColors.accent : "#555555";

        return (
          <Box
            key={section.title}
            flexDirection="column"
            borderStyle="round"
            borderColor={borderColor}
            paddingX={1}
          >
            <Text dimColor bold>{section.title}</Text>
            {section.items.map((item, itemIdx) => {
              const thisIdx = sectionStartIdx + itemIdx;
              const isCursor = isFocused && thisIdx === cursorIdx;
              const isActive = item.id === selectedId;

              return (
                <Box key={item.id} gap={0}>
                  <Text
                    color={isCursor ? inkColors.accent : isActive ? inkColors.accent : undefined}
                    bold={isCursor || isActive}
                    dimColor={!isCursor && !isActive}
                  >
                    {isCursor ? `${symbols.pointerActive} ` : "  "}
                    {item.icon} {item.label}
                  </Text>
                </Box>
              );
            })}
          </Box>
        );
      })}
    </Box>
  );
}
