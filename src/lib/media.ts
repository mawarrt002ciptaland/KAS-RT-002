export function resolveMediaUrl(input?: string | null) {
  if (!input) return "";

  if (input.startsWith("http://") || input.startsWith("https://") || input.startsWith("data:")) {
    return input;
  }

  if (input.startsWith("/")) {
    return input;
  }

  return `/${input}`;
}
