import type { TerminalRow } from '../content/types';

export function TerminalBlock({ command, rows, note }: { command: string; rows: TerminalRow[]; note?: string }) {
  return (
    <div className="terminal" role="group" aria-label="Metrics">
      <p className="terminal__cmd">
        <span className="terminal__prompt" aria-hidden="true">$ </span>
        {command}
      </p>
      {rows.length > 0 && (
        <dl className="terminal__rows">
          {rows.map((r) => (
            <div key={r.label} className="terminal__row">
              <dt>{r.label}</dt>
              <dd>{r.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {note && <p className="terminal__note"># {note}</p>}
    </div>
  );
}
