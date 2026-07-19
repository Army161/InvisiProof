export function validateTextContent(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length < 10) return 'Text must be at least 10 characters.';
  if (trimmed.length > 10000) return 'Text must be 10,000 characters or fewer.';
  return null;
}

export function validateUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    throw new Error('URL must start with http:// or https://');
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('URL must use http or https.');
    }
    return parsed.toString();
  } catch {
    throw new Error('Please enter a valid URL (e.g. https://example.com).');
  }
}
