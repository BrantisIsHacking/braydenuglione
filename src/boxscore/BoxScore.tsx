import { useEffect, useState } from 'react';
import { banners, lockerRoom, profile, stationsByCategory, getStation } from '../content';
import type { Zone } from '../content';
import { parseHash } from '../routing/hash';
import { Filters, type Filter } from './Filters';
import { StationCard } from './StationCard';
import './boxscore.css';

const ZONES: { zone: Zone; title: string }[] = [
  { zone: 'projects', title: 'Projects' },
  { zone: 'now', title: '2026' },
  { zone: 'rutgers', title: 'Rutgers' },
  { zone: 'bridge', title: 'Bridge Year' },
  { zone: 'bench', title: 'On the Bench' },
  { zone: 'throwback', title: 'Throwback: Morris Tech' },
];

function ContactLinks() {
  return (
    <ul className="bs__contact">
      <li>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
      </li>
      {profile.links.map((l) => (
        <li key={l.url}>
          <a href={l.url} target="_blank" rel="noopener noreferrer">
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function BoxScore({ onEnterArena, notice }: { onEnterArena?: () => void; notice?: string } = {}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [target, setTarget] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const apply = (initial = false) => {
      const { stationId } = parseHash(window.location.hash);
      if (!stationId) {
        setTarget(null);
        if (!initial) {
          const raw = window.location.hash.slice(1);
          let id = raw;
          try {
            id = decodeURIComponent(raw);
          } catch {
            /* malformed escape: use raw */
          }
          if (!(id && document.getElementById(id))) window.scrollTo(0, 0);
        }
        return;
      }
      const st = getStation(stationId)!;
      setFilter((f) => (f === 'all' || f === st.category ? f : 'all'));
      setTarget(stationId);
      setTick((t) => t + 1);
    };
    const onChange = () => apply();
    apply(true);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  useEffect(() => {
    if (!target) return;
    const card = document.getElementById(target);
    if (!card) return;
    card.scrollIntoView({ block: 'start' });
    const h = card.querySelector<HTMLElement>('.station__title');
    if (h) {
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
  }, [target, tick]);

  const visible = stationsByCategory(filter);

  return (
    <div className="bs">
      {notice && (
        <p role="status" className="bs__notice">
          {notice}
        </p>
      )}
      <header className="bs__head">
        <p className="bs__jersey" aria-hidden="true">
          {profile.jersey}
        </p>
        <div>
          <h1 className="bs__name">{profile.name}</h1>
          <p className="bs__tagline">{profile.tagline}</p>
          <p className="bs__school">{profile.school}</p>
          <p className="bs__targets">{profile.targets}</p>
          <ContactLinks />
          {onEnterArena && (
            <button type="button" className="bs__enter" onClick={onEnterArena}>
              Enter the arena
            </button>
          )}
        </div>
      </header>

      <Filters value={filter} onChange={setFilter} />

      <main>
        {ZONES.map(({ zone, title }) => {
          const list = visible.filter((s) => s.zone === zone);
          if (list.length === 0) return null;
          return (
            <section key={zone} className="zone" aria-labelledby={`zone-${zone}`}>
              <h2 className="zone__title" id={`zone-${zone}`}>
                {title}
              </h2>
              <div className="zone__grid">
                {list.map((s) => (
                  <StationCard key={s.id} station={s} />
                ))}
              </div>
            </section>
          );
        })}

        <section className="zone" aria-labelledby="section-rafters">
          <h2 className="zone__title" id="section-rafters">
            Rafters
          </h2>
          <ul className="rafters" aria-label="Rafters">
            {banners.map((b) => (
              <li key={b.id} className="banner">
                <h3 className="banner__title">{b.title}</h3>
                <p className="banner__meta">
                  {b.issuer} · {b.year}
                </p>
                <p className="banner__why">{b.why}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="zone" aria-labelledby="section-locker">
          <h2 className="zone__title" id="section-locker">
            Locker Room
          </h2>
          <ul className="locker" aria-label="Locker Room">
            {lockerRoom.map((i) => (
              <li key={i.id} className="locker__item">
                <h3 className="locker__title">{i.title}</h3>
                <p>{i.oneLiner}</p>
                {i.detail && <p className="locker__detail">{i.detail}</p>}
                {i.link && (
                  <p>
                    <a href={i.link.url} target="_blank" rel="noopener noreferrer">
                      {i.link.label}
                    </a>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="zone press" aria-labelledby="section-press">
          <h2 className="zone__title" id="section-press">
            Press Table
          </h2>
          <p className="press__lead">{profile.targets}.</p>
          <ContactLinks />
        </section>
      </main>
    </div>
  );
}
