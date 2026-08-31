export type SourceOption = { value: string; label: string };

export function SourceSelect({ value, sources, onChange }: { value: string; sources: SourceOption[]; onChange: (value: string) => void }) {
  return (
    <div className="field">
      <label htmlFor="source">Source</label>
      <select id="source" value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">All sources</option>
        {sources.map((source) => <option value={source.value} key={source.value}>{source.label}</option>)}
      </select>
    </div>
  );
}
