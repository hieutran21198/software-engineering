import React, {useMemo} from "react";
import {marked} from "marked";
import DOMPurify from "dompurify";
export default function Markdown({ text }) {
  const html = useMemo(() => {
    const content = text.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
    return DOMPurify.sanitize(marked.parse(content), {
      // Details have no external resources or navigation; references use UI buttons.
      FORBID_TAGS: [
        "img",
        "svg",
        "math",
        "iframe",
        "form",
        "input",
        "button",
        "style",
      ],
      FORBID_ATTR: ["href", "src", "style", "id", "name", "target"],
    });
  }, [text]);
  return (
    <div className="markdown" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
