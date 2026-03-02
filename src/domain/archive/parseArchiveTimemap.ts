export type ArchiveMemento = {
  url: string;
  rel: string;
  datetime?: string;
};

export type ParsedArchiveTimemap = {
  original?: string;
  timegate?: string;
  mementos: ArchiveMemento[];
};

export function parseArchiveTimemap(text: string): ParsedArchiveTimemap {
  const entries = [...text.matchAll(/<([^>]+)>;\s*rel="([^"]+)"(?:;\s*datetime="([^"]+)")?/g)];
  const mementos: ArchiveMemento[] = [];
  let original: string | undefined;
  let timegate: string | undefined;

  for (const [, url, rel, datetime] of entries) {
    if (rel.includes("original")) {
      original = url;
      continue;
    }
    if (rel.includes("timegate")) {
      timegate = url;
      continue;
    }
    if (rel.includes("memento")) {
      mementos.push({ url, rel, datetime });
    }
  }

  return { original, timegate, mementos };
}
