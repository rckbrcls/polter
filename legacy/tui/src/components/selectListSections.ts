import type { SelectItem } from "./SelectList.js";

export interface VisibleSelectItem {
  item: SelectItem;
  globalIndex: number;
}

export type BoxedSectionLayout =
  | {
      type: "heading";
      key: string;
      label: string;
    }
  | {
      type: "box";
      key: string;
      title: string;
      rows: VisibleSelectItem[];
    };

function isHeader(item: SelectItem | undefined): boolean {
  return item?.kind === "header";
}

function buildEntryKey(item: SelectItem, globalIndex: number): string {
  return item.id ?? `${item.value}-${globalIndex}`;
}

export function findNearestHeaderLabel(
  items: SelectItem[],
  startIndex: number,
): string | undefined {
  for (let index = startIndex; index >= 0; index -= 1) {
    const item = items[index];
    if (isHeader(item)) {
      return item?.label;
    }
  }

  return undefined;
}

export function buildBoxedSectionLayout(
  items: SelectItem[],
  start: number,
  end: number,
): BoxedSectionLayout[] {
  const visibleEntries = items.slice(start, end).map((item, offset) => ({
    item,
    globalIndex: start + offset,
  }));
  const inheritedHeader =
    visibleEntries.length > 0 && !isHeader(visibleEntries[0]?.item)
      ? findNearestHeaderLabel(items, start - 1)
      : undefined;

  const sections: BoxedSectionLayout[] = [];
  let currentTitle = inheritedHeader;
  let currentKey = currentTitle ? `derived-${start}` : undefined;
  let currentRows: VisibleSelectItem[] = [];

  const flush = () => {
    if (!currentTitle && currentRows.length === 0) {
      return;
    }

    if (currentRows.length === 0) {
      sections.push({
        type: "heading",
        key: currentKey ?? `heading-${sections.length}`,
        label: currentTitle ?? "",
      });
    } else {
      sections.push({
        type: "box",
        key: currentKey ?? `box-${sections.length}`,
        title: currentTitle ?? "",
        rows: [...currentRows],
      });
    }

    currentTitle = undefined;
    currentKey = undefined;
    currentRows = [];
  };

  for (const entry of visibleEntries) {
    if (isHeader(entry.item)) {
      flush();
      currentTitle = entry.item.label;
      currentKey = buildEntryKey(entry.item, entry.globalIndex);
      continue;
    }

    if (!currentTitle) {
      currentTitle = "";
      currentKey = buildEntryKey(entry.item, entry.globalIndex);
    }

    currentRows.push(entry);
  }

  flush();

  return sections.filter((section) =>
    section.type === "box" ? section.rows.length > 0 : Boolean(section.label),
  );
}

export function countBoxedSectionLines(
  sections: BoxedSectionLayout[],
): number {
  return sections.reduce((lineCount, section) => {
    if (section.type === "heading") {
      return lineCount + 1;
    }

    return lineCount + section.rows.length + (section.title ? 3 : 2);
  }, 0);
}
