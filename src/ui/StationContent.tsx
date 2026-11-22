import type { Station } from '../content/types';
import { TerminalBlock } from './TerminalBlock';
import { VideoEmbed } from './VideoEmbed';
import './station.css';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function fmt(d: string): string {
  if (d === 'present') return 'Present';
  const [y, m] = d.split('-');
  const idx = Number(m) - 1;
  return MONTHS[idx] ? `${MONTHS[idx]} ${y}` : y;
}

export function formatRange(start: string, end: string): string {
  const a = fmt(start);
  const b = fmt(end);
  return a === b ? a : `${a} – ${b}`;
}

export function StationContent({ station: s, headingLevel }: { station: Station; headingLevel: 2 | 3 }) {
  const H = `h${headingLevel}` as 'h2' | 'h3';
  const meta = [s.org, s.role, formatRange(s.start, s.end)].filter(Boolean).join(' · ');
  return (
    <article className="station">
      <H className="station__title">{s.title}</H>
      <p className="station__meta">{meta}</p>
      <p className="station__one">{s.oneLiner}</p>
      {s.stat && (
        <p className="station__stat">
          <span className="station__stat-value">{s.stat.value}</span>
          <span className="station__stat-label">{s.stat.label}</span>
        </p>
      )}
      {s.body && <p className="station__body">{s.body}</p>}
      {s.bullets.length > 0 && (
        <ul className="station__bullets">
          {s.bullets.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
      )}
      {s.kind === 'terminal' && s.terminal && <TerminalBlock {...s.terminal} />}
      {s.kind === 'video' && s.video && <VideoEmbed youtubeId={s.video.youtubeId} poster={s.video.poster} title={s.title} />}
      {s.media.length > 0 && (
        <div className="station__gallery">
          {s.media.map((m) => (
            <figure key={m.src}>
              <img src={m.src} alt={m.alt} width={m.width} height={m.height} loading="lazy" />
              <figcaption aria-hidden="true">{m.alt}</figcaption>
            </figure>
          ))}
        </div>
      )}
      {s.tech.length > 0 && (
        <ul className="station__tech" aria-label="Technologies">
          {s.tech.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      )}
      {s.links.length > 0 && (
        <ul className="station__links">
          {s.links.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noopener noreferrer">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}
      {s.credits && <p className="station__credits">{s.credits}</p>}
    </article>
  );
}
