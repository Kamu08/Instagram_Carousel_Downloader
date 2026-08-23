/**
 * Convert standard ASCII characters to Unicode Sans-Serif Bold
 * (Displays bold on LinkedIn feeds without markdown asterisks)
 */
export function toUnicodeBoldChar(char: string): string {
  const code = char.charCodeAt(0);

  // Uppercase A-Z -> 𝗔-𝗭 (U+1D5D4 to U+1D5ED)
  if (code >= 65 && code <= 90) {
    return String.fromCodePoint(0x1d5d4 + (code - 65));
  }

  // Lowercase a-z -> 𝗮-𝘇 (U+1D5EE to U+1D607)
  if (code >= 97 && code <= 122) {
    return String.fromCodePoint(0x1d5ee + (code - 97));
  }

  // Digits 0-9 -> 𝟬-𝟵 (U+1D7EC to U+1D7F5)
  if (code >= 48 && code <= 57) {
    return String.fromCodePoint(0x1d7ec + (code - 48));
  }

  return char;
}

export function toUnicodeBoldString(str: string): string {
  return str.split('').map(toUnicodeBoldChar).join('');
}

/**
 * Replace markdown **bold** with actual Unicode Bold characters
 */
export function formatMarkdownToLinkedInBold(content: string): string {
  return content.replace(/\*\*([^*]+)\*\*/g, (_, text) => {
    return toUnicodeBoldString(text);
  });
}
