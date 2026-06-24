// Minimal, safe markdown renderer for: **bold**, [text](url), - bullets
// Escapes HTML first to prevent injection, then applies only our known patterns.

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const renderMarkdown = (text: string): string => {
  const escaped = escapeHtml(text);
  const lines = escaped.split("\n");
  const htmlLines: string[] = [];
  let inList = false;

  for (const line of lines) {
    const bulletMatch = line.match(/^-\s+(.*)$/);
    if (bulletMatch) {
      if (!inList) {
        htmlLines.push("<ul>");
        inList = true;
      }
      htmlLines.push(`<li>${inlineFormat(bulletMatch[1])}</li>`);
    } else {
      if (inList) {
        htmlLines.push("</ul>");
        inList = false;
      }
      if (line.trim() === "") {
        htmlLines.push("<br />");
      } else {
        htmlLines.push(`<p>${inlineFormat(line)}</p>`);
      }
    }
  }
  if (inList) htmlLines.push("</ul>");

  return htmlLines.join("");
};

const inlineFormat = (text: string): string => {
  // Bold: **text**
  let result = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Links: [text](url) — only allow http(s) URLs for safety
  result = result.replace(
    /\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>'
  );
  return result;
};