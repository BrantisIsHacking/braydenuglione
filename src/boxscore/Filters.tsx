import type { Category } from '../content';

export type Filter = Category | 'all';

const CHIPS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'project', label: 'Projects' },
  { value: 'experience', label: 'Experience' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'education', label: 'Education' },
  { value: 'throwback', label: 'Throwback' },
];

export function Filters({ value, onChange }: { value: Filter; onChange: (f: Filter) => void }) {
  return (
    <div className="filters" role="group" aria-label="Filter stations">
      {CHIPS.map((c) => (
        <button key={c.value} type="button" className="chip" aria-pressed={value === c.value} onClick={() => onChange(c.value)}>
          {c.label}
        </button>
      ))}
    </div>
  );
}
