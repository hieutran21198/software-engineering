// Wording notes (specifications/review-brief.md): established or delivered text that
// still says work is pending. The match is by wording, so the note is an inference.
const PENDING = /[^.\n]*\b(?:remain pending|is pending|not started|proposed for team review)\b[^.\n]*\.?/i;
// frontMatter: also read YAML values, as flow records keep their gaps there.
export function pendingSentence(markdown = '', {frontMatter = false} = {}) {
  let text = frontMatter ? markdown : markdown.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
  // Join wrapped YAML and list lines, then drop code blocks.
  text = text.replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, '').replace(/\r?\n[ \t]+(?![-*] )/g, ' ');
  return text.match(PENDING)?.[0].replace(/^\s*(?:[-*]\s+|[\w-]+:\s+)+/, '').trim() || null;
}
