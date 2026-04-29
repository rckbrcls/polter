import React, { useState, useEffect, useRef } from "react";
import { Box, Text, useInput } from "ink";

interface ScrollableBoxProps {
  height: number;
  isActive?: boolean;
  autoScrollToBottom?: boolean;
  children: React.ReactNode[];
}

export function ScrollableBox({
  height,
  isActive = true,
  autoScrollToBottom = false,
  children,
}: ScrollableBoxProps): React.ReactElement {
  const totalItems = children.length;
  const [scrollOffset, setScrollOffset] = useState(0);
  const visibleCount = Math.max(1, height - 2); // leave room for scroll indicators
  const maxOffset = Math.max(0, totalItems - visibleCount);
  const pinnedToBottom = useRef(autoScrollToBottom);

  useEffect(() => {
    if (autoScrollToBottom && pinnedToBottom.current) {
      setScrollOffset(maxOffset);
    }
  }, [autoScrollToBottom, maxOffset]);

  useInput(
    (input, key) => {
      if (key.upArrow || input === "k") {
        setScrollOffset((prev) => {
          const next = Math.max(0, prev - 1);
          pinnedToBottom.current = next >= maxOffset;
          return next;
        });
      }
      if (key.downArrow || input === "j") {
        setScrollOffset((prev) => {
          const next = Math.min(maxOffset, prev + 1);
          pinnedToBottom.current = next >= maxOffset;
          return next;
        });
      }
    },
    { isActive },
  );

  const showScrollUp = scrollOffset > 0;
  const showScrollDown = scrollOffset + visibleCount < totalItems;
  const visible = children.slice(scrollOffset, scrollOffset + visibleCount);

  return (
    <Box flexDirection="column" height={height}>
      {showScrollUp && <Text dimColor>  ↑ more</Text>}
      {visible}
      {showScrollDown && <Text dimColor>  ↓ more</Text>}
    </Box>
  );
}
