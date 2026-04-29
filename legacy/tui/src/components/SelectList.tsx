import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, useInput } from "ink";
import {
  buildBoxedSectionLayout,
  countBoxedSectionLines,
} from "./selectListSections.js";
import { inkColors, panel } from "../theme.js";

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
  width?: number;
  isInputActive?: boolean;
  arrowNavigation?: boolean;
  panelFocused?: boolean;
}

export function SelectList({
  items,
  onSelect,
  onRightAction,
  onCancel,
  maxVisible = 16,
  labelWidth: labelWidthProp,
  boxedSections = false,
  width = 80,
  isInputActive = true,
  arrowNavigation = false,
  panelFocused = true,
}: SelectListProps): React.ReactElement {
  const labelWidth = labelWidthProp ?? Math.max(16, Math.floor(width * 0.45));
  const isNarrow = width < 50;
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

    if (key.return || (arrowNavigation && key.rightArrow)) {
      if (selectedItem) {
        onSelect(selectedItem.value, selectedItem);
      }
    }

    if (arrowNavigation && key.leftArrow) {
      if (onCancel) onCancel();
    }

    if ((input === "p" || input === "P") && onRightAction && selectedItem?.rightActionable) {
      onRightAction(selectedItem);
    }

    if (key.escape && onCancel) {
      onCancel();
    }
  }, { isActive: isInputActive });

  const { windowStart, windowEnd, visibleItems, boxedLayout } = useMemo(() => {
    // getWindowStart
    let windowStartVal = 0;
    if (items.length > maxVisible) {
      const safeSelectedIndex = selectedItemIndex >= 0 ? selectedItemIndex : 0;
      windowStartVal = Math.max(
        0,
        Math.min(
          safeSelectedIndex - Math.floor(maxVisible / 2),
          items.length - maxVisible,
        ),
      );

      const firstVisible = items[windowStartVal];
      if (windowStartVal > 0 && firstVisible && !isHeader(firstVisible)) {
        let previousHeaderIndex = -1;
        for (let i = windowStartVal - 1; i >= 0; i--) {
          if (isHeader(items[i]!)) {
            previousHeaderIndex = i;
            break;
          }
        }

        if (
          previousHeaderIndex >= 0 &&
          safeSelectedIndex - previousHeaderIndex < maxVisible
        ) {
          windowStartVal = previousHeaderIndex;
        }
      }
    }

    // getWindowRange
    const initialEnd = Math.min(windowStartVal + maxVisible, items.length);
    let start = windowStartVal;
    let end = initialEnd;

    if (boxedSections) {
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
    }

    return {
      windowStart: start,
      windowEnd: end,
      visibleItems: items.slice(start, end),
      boxedLayout: boxedSections
        ? buildBoxedSectionLayout(items, start, end)
        : [],
    };
  }, [items, selectedItemIndex, maxVisible, boxedSections]);
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
            wrap="truncate"
          >
            {item.icon ? `${item.icon} ` : ""}
            {item.label}
          </Text>
        </Box>

        {!isNarrow && item.hint && <Text dimColor>{item.hint}</Text>}
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
                borderColor={panelFocused ? inkColors.accent : panel.borderDim}
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
