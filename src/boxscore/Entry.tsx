import type { Station } from '../content';
import { formatRange } from '../ui/StationContent';
import { TerminalBlock } from '../ui/TerminalBlock';
import { VideoEmbed } from '../ui/VideoEmbed';
import { ArrowIcon } from './icons';
import { entryHeading, primaryLink } from './logic';

/**
 * One experience / project / leadership / education entry: dates, "Role · Company", a short blurb, tags.
 * With a primary link the whole card is clickable through a stretched link on the heading (other links sit above it).
 */
export function Entry({ station: s, targeted }: { station: Station; targeted?: boolean }) {
  const { title, sub } = entryHeading(s);
  const link = primaryLink(s);
  const rest = s.links.slice(link ? 1 : 0);
  const isProject = s.category === 'project';
  const thumb = isProject ? s.media[0] : undefined;
  const gallery = s.media.slice(thumb ? 1 : 0);
  const hasMore = Boolean(s.body || s.bullets.length || s.terminal || s.video || gallery.length || s.credits);
  const cls = ['bs__entry', link ? 'bs__entry--link' : '', targeted ? 'is-target' : ''].filter(Boolean).join(' ');

  return (
    <article className={cls} id={s.id} data-station={s.id} data-exhibit={s.id} data-target={targeted ? 'true' : undefined}>
      <p className="bs__dates">{formatRange(s.start, s.end)}</p>
      <div className="bs__entry-main">
        <h3 className="station__title bs__entry-title">
          {link ? (
            <a className="bs__entry-link" href={link.url} target="_blank" rel="noopener noreferrer">
              {title}
              <ArrowIcon className="bs__arrow" />
              <span className="sr-only"> ({link.label}, opens in a new tab)</span>
            </a>
          ) : (
            title
          )}
        </h3>
        {sub && <p className="bs__sub">{sub}</p>}
        <p className="station__one bs__blurb">{s.oneLiner}</p>
        {s.stat && (
          <p className="station__stat bs__stat">
            <span className="station__stat-value">{s.stat.value}</span>
            <span className="station__stat-label">{s.stat.label}</span>
          </p>
        )}
        {s.tech.length > 0 && (
          <ul className="bs__tags" aria-label="Technologies">
            {s.tech.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        )}
        {(rest.length > 0 || hasMore) && (
          <div className="bs__extras">
            {rest.length > 0 && (
              <ul className="bs__links">
                {rest.map((l) => (
                  <li key={l.url}>
                    <a href={l.url} target="_blank" rel="noopener noreferrer">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
            {hasMore && (
              <details className="bs__more">
                <summary>
                  Details<span className="sr-only">{` for ${s.title}`}</span>
                </summary>
                <div className="bs__more-body">
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
                  {gallery.length > 0 && (
                    <div className="station__gallery">
                      {gallery.map((m) => (
                        <figure key={m.src}>
                          <img src={m.src} alt={m.alt} width={m.width} height={m.height} loading="lazy" decoding="async" />
                        </figure>
                      ))}
                    </div>
                  )}
                  {s.credits && <p className="station__credits">{s.credits}</p>}
                </div>
              </details>
            )}
          </div>
        )}
      </div>
      {thumb && (
        <img className="bs__thumb" src={thumb.src} alt={thumb.alt} width={thumb.width} height={thumb.height} loading="lazy" decoding="async" />
      )}
    </article>
  );
}
