import { Fragment, useMemo } from "react";

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function HighlightedText({ text, query }: { text: string; query: string }) {
  const terms = useMemo(() => query.trim().split(/\s+/).map((term) => term.replace(/^[-+]+/, "")).filter(Boolean), [query]);
  if (!terms.length) return <>{text}</>;
  const expression = new RegExp(`(${terms.map(escape).join("|")})`, "gi");
  const lowerTerms = new Set(terms.map((term) => term.toLowerCase()));
  return <>{text.split(expression).map((part, index) => lowerTerms.has(part.toLowerCase()) ? <mark key={index}>{part}</mark> : <Fragment key={index}>{part}</Fragment>)}</>;
}
