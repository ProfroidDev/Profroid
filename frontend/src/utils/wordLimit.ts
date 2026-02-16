export function countWords(value: string): number {
  if (!value) {
    return 0;
  }

  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function trimToMaxWords(value: string, maxWords: number): string {
  if (!value || maxWords <= 0) {
    return '';
  }

  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return value;
  }

  return words.slice(0, maxWords).join(' ');
}
