import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import {
  buildBoxedSectionLayout,
  countBoxedSectionLines,
} from "./selectListSections.js";
import { inkColors } from "../theme.js";

export type SelectItemKind = "header" | "command" | "run" | "action";

export interface SelectItem {
  id?: string;
  value: string;
  label: string;
  hint?: string;
  icon?: string;
  kind?: SelectItemKind;
  selectable?: boolean;
  rightActionable?: boolean;
  section?: string;
  groupLabel?: string;
}

interface SelectListProps {
  items: SelectItem[];
  onSelect: (value: string, item?: SelectItem) => void;
  onRightAction?: (item: SelectItem) => void;
  onCancel?: () => void;
  maxVisible?: number;
  labelWidth?: number;
  boxedSections?: boolean;
}

export function SelectList({
  items,
  onSelect,
  onRightAction,
  onCancel,
  maxVisible = 16,
  labelWidth = 34,
  boxedSections = false,
}: SelectListProps): React.ReactElement {
  const isHeader = (item: SelectItem) => item.kind === "header";
  const isSelectable = (item: SelectItem) =>
    item.selectable ?? !isHeader(item);
  const isPinnedRow = (item: SelectItem) =>
    item.section === "pinned-runs" || item.section === "pinned-commands";

  const selectableIndexes = useMemo(
    () =>
      items.reduce<number[]>((acc, item, index) => {
        if (isSelectable(item)) {
          acc.push(index);
        }
        return acc;
      }, []),
    [items],
  );

  const [selectedSelectableIndex, setSelectedSelectableIndex] = useState(0);

  useEffect(() => {
    if (selectableIndexes.length === 0) {
      setSelectedSelectableIndex(0);
      return;
    }

    setSelectedSelectableIndex((prev) => {
      if (prev < 0) return 0;
      if (prev >= selectableIndexes.length) return selectableIndexes.length - 1;
      return prev;
    });
  }, [selectableIndexes]);

  const selectedItemIndex =
    selectableIndexes[selectedSelectableIndex] ?? -1;
  const selectedItem =
    selectedItemIndex >= 0 ? items[selectedItemIndex] : undefined;

  useInput((input, key) => {
    if (selectableIndexes.length === 0) {
      if (key.escape && onCancel) {
        onCancel();
      }
      return;
    }

    if (key.upArrow || input === "k") {
      setSelectedSelectableIndex((prev) => {
        let next = prev - 1;
        if (next < 0) next = selectableIndexes.length - 1;
        return next;
      });
    }

    if (key.downArrow || input === "j") {
      setSelectedSelectableIndex((prev) => {
        let next = prev + 1;
        if (next >= selectableIndexes.length) next = 0;
        return next;
      });
    }

    if (key.return) {
      if (selectedItem) {
        onSelect(selectedItem.value, selectedItem);
      }
    }

    if (key.rightArrow && onRightAction && selectedItem?.rightActionable) {
      onRightAction(selectedItem);
    }

    if (key.escape && onCancel) {
      onCancel();
    }
  });

  const getWindowStart = (): number => {
    if (items.length <= maxVisible) {
      return 0;
    }

    const safeSelectedIndex = selectedItemIndex >= 0 ? selectedItemIndex : 0;
    let start = Math.max(
      0,
      Math.min(
        safeSelectedIndex - Math.floor(maxVisible / 2),
        items.length - maxVisible,
      ),
    );

    const firstVisible = items[start];
    if (start > 0 && firstVisible && !isHeader(firstVisible)) {
      let previousHeaderIndex = -1;
      for (let i = start - 1; i >= 0; i--) {
        if (isHeader(items[i]!)) {
          previousHeaderIndex = i;
          break;
        }
      }

      if (
        previousHeaderIndex >= 0 &&
        safeSelectedIndex - previousHeaderIndex < maxVisible
      ) {
        start = previousHeaderIndex;
      }
    }

    return start;
  };

  const getWindowRange = (): [number, number] => {
    const initialStart = getWindowStart();
    const initialEnd = Math.min(initialStart + maxVisible, items.length);

    if (!boxedSections) {
      return [initialStart, initialEnd];
    }

    let start = initialStart;
    let end = initialEnd;

    while (start < end) {
      const sections = buildBoxedSectionLayout(items, start, end);
      if (countBoxedSectionLines(sections) <= maxVisible) {
        break;
      }

      if (
        selectedItemIndex >= 0 &&
        start === selectedItemIndex &&
        end === selectedItemIndex + 1
      ) {
        break;
      }

      const canTrimStart = selectedItemIndex > start;
      const canTrimEnd = selectedItemIndex < end - 1;

      if (
        canTrimEnd &&
        (!canTrimStart ||
          end - selectedItemIndex >= selectedItemIndex - start)
      ) {
        end -= 1;
        continue;
      }

      if (canTrimStart) {
        start += 1;
        continue;
      }

      end -= 1;
    }

    return [start, end];
  };

  const [windowStart, windowEnd] = getWindowRange();
  const visibleItems = items.slice(windowStart, windowEnd);
  const boxedLayout = boxedSections
    ? buildBoxedSectionLayout(items, windowStart, windowEnd)
    : [];
  const showScrollUp = windowStart > 0;
  const showScrollDown = windowEnd < items.length;

  const renderSelectableRow = (
    item: SelectItem,
    globalIdx: number,
  ): React.ReactElement => {
    const isSelected = globalIdx === selectedItemIndex;

    return (
      <Box key={item.id ?? `${item.value}-${globalIdx}`} gap={1}>
        <Text color={isSelected ? inkColors.accent : undefined}>
          {isSelected ? "❯" : " "}
        </Text>

        <Box width={labelWidth}>
          <Text
            color={
              isSelected
                ? inkColors.accent
                : isPinnedRow(item)
                  ? "white"
                  : undefined
            }
            bold={isSelected || isPinnedRow(item)}
          >
            {item.icon ? `${item.icon} ` : ""}
            {item.label}
          </Text>
        </Box>

        {item.hint && <Text dimColor>{item.hint}</Text>}
        {isSelected && item.rightActionable && (
          <Text dimColor>→ pin/unpin</Text>
        )}
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      {showScrollUp && <Text dimColor>  ↑ more</Text>}

      {boxedSections
        ? boxedLayout.map((section) => {
            if (section.type === "heading") {
              return (
                <Box key={section.key}>
                  <Text color={inkColors.accent} bold>
                    {section.label}
                  </Text>
                </Box>
              );
            }

            const hasSelectedRow = section.rows.some(
              (row) => row.globalIndex === selectedItemIndex,
            );
            const isPinnedSection = section.rows.some((row) =>
              isPinnedRow(row.item),
            );

            return (
              <Box
                key={section.key}
                flexDirection="column"
                borderStyle="round"
                borderColor={inkColors.accent}
                borderDimColor={!hasSelectedRow && !isPinnedSection}
                paddingX={1}
              >
                {section.title && (
                  <Text color={inkColors.accent} bold>
                    {section.title}
                  </Text>
                )}

                <Box flexDirection="column">
                  {section.rows.map((row) =>
                    renderSelectableRow(row.item, row.globalIndex),
                  )}
                </Box>
              </Box>
            );
          })
        : visibleItems.map((item, i) => {
            const globalIdx = windowStart + i;
            const selectable = isSelectable(item);

            if (!selectable) {
              return (
                <Box
                  key={item.id ?? `${item.value}-${globalIdx}`}
                  marginTop={i === 0 ? 0 : 1}
                >
                  <Text color={inkColors.accent} bold>
                    {item.label}
                  </Text>
                </Box>
              );
            }

            return renderSelectableRow(item, globalIdx);
          })}

      {showScrollDown && <Text dimColor>  ↓ more</Text>}
    </Box>
  );
}
