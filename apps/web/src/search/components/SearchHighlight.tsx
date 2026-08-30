type SearchHighlightProps = {
  text: string;
  query: string;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function SearchHighlight({ text, query }: SearchHighlightProps) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, 'ig'));
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark key={`${part}-${index}`} className="search-highlight">
            {part}
          </mark>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}
