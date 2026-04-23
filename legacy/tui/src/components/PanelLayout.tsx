import React from "react";
import { Box } from "ink";
import { panel as panelTheme } from "../theme.js";

interface PanelLayoutProps {
  header: React.ReactNode;
  footer: React.ReactNode;
  sidebar: React.ReactNode;
  main: React.ReactNode;
  width: number;
  height: number;
  bannerHeight: number;
  singlePanel?: boolean;
}

export function PanelLayout({
  header,
  footer,
  sidebar,
  main,
  width,
  height,
  bannerHeight,
  singlePanel = false,
}: PanelLayoutProps): React.ReactElement {
  const footerHeight = 1;
  const contentHeight = Math.max(5, height - bannerHeight - footerHeight);
  const sidebarWidth = singlePanel ? 0 : panelTheme.sidebarWidth(width);
  const mainWidth = singlePanel ? width : width - sidebarWidth;

  return (
    <Box flexDirection="column" width={width} height={height}>
      {header}

      <Box flexDirection="row" height={contentHeight}>
        {!singlePanel && (
          <Box width={sidebarWidth} height={contentHeight}>
            {sidebar}
          </Box>
        )}
        <Box width={mainWidth} height={contentHeight}>
          {main}
        </Box>
      </Box>

      <Box height={footerHeight}>
        {footer}
      </Box>
    </Box>
  );
}
