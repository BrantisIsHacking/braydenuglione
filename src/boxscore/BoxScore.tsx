import { useEffect, useState } from 'react';
import { banners, buildings, COLLECTION_LABEL, exhibitsIn, getCollection, getExhibit, profile, stationsByCategory } from '../content';
import type { Exhibit } from '../content';
import { parseRoute } from '../routing/routes';
import { CollectionList } from '../ui/CollectionList';
import { ContactContent } from '../ui/ContactContent';
import { ExhibitContent } from '../ui/ExhibitContent';
import { Filters, type Filter } from './Filters';
import { StationCard } from './StationCard';
import './boxscore.css';

type InterestExhibit = Extract<Exhibit, { type: 'interest' }>;

const CAREER = buildings.filter((b) => b.district === 'career');

// Interests grouped by their home building, in building order (mirrors are not repeated).
const OFF_THE_CLOCK = buildings
  .map((b) => ({
    building: b,
    items: exhibitsIn(b.id).flatMap((p) => (!p.mirror && p.exhibit.type === 'interest' ? [p.exhibit] : [])),
  }))
  .filter((g) => g.items.length > 0);

function HeaderLinks() {
  return (
    <ul className="bs__contact" aria-label="Contact links">
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

function InterestItem({ exhibit }: { exhibit: InterestExhibit }) {
  const { collection } = exhibit.interest;
  const bare: InterestExhibit = { ...exhibit, interest: { ...exhibit.interest, collection: undefined } };
  return (
    <li id={exhibit.id} data-exhibit={exhibit.id} className="bs__item">
      <ExhibitContent exhibit={bare} headingLevel={3} />
      {collection && (
        <details className="bs__more">
          <summary>{`${COLLECTION_LABEL[collection]} (${getCollection(collection).length})`}</summary>
          <CollectionList id={collection} />
        </details>
      )}
    </li>
  );
}

export function BoxScore({ onExplore, notice }: { onExplore?: () => void; notice?: string } = {}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [target, setTarget] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const apply = (initial = false) => {
      const route = parseRoute(window.location.hash);
      const exhibitId = route.view === 'exhibit' ? route.id : null;
      const ex = exhibitId ? getExhibit(exhibitId) : undefined;
      if (!exhibitId || !ex) {
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
      if (ex.type === 'station') {
        const cat = ex.station.category;
        setFilter((f) => (f === 'all' || f === cat ? f : 'all'));
      }
      setTarget(exhibitId);
      setTick((t) => t + 1);
    };
    const onChange = () => apply();
    apply(true);
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  useEffect(() => {
    if (!target) return;
    const el = document.getElementById(target);
    if (!el) return;
    el.scrollIntoView({ block: 'start' });
    const h = el.querySelector<HTMLElement>('h1, h2, h3, h4');
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
          <HeaderLinks />
          {onExplore && (
            <button type="button" className="bs__enter" onClick={onExplore}>
              Explore Brayden&apos;s World
            </button>
          )}
        </div>
      </header>

      <Filters value={filter} onChange={setFilter} />

      <main>
        {CAREER.map(({ id: zone, name: title }) => {
          const list = visible.filter((s) => s.building === zone);
          if (list.length === 0) return null;
          return (
            <section key={zone} id={`section-${zone}`} className="zone" aria-labelledby={`section-${zone}-title`}>
              <h2 className="zone__title" id={`section-${zone}-title`}>
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

        <section id="section-hall-of-fame" className="zone" aria-labelledby="section-hall-of-fame-title">
          <h2 className="zone__title" id="section-hall-of-fame-title">
            Hall of Fame
          </h2>
          <ul className="bs__banners">
            {banners.map((b) => (
              <li key={b.id} id={b.id} data-exhibit={b.id} className="bs__item banner">
                <ExhibitContent exhibit={getExhibit(b.id)!} headingLevel={3} />
              </li>
            ))}
          </ul>
        </section>

        <section id="section-off-the-clock" className="zone" aria-labelledby="section-off-the-clock-title">
          <h2 className="zone__title" id="section-off-the-clock-title">
            Off the clock
          </h2>
          {OFF_THE_CLOCK.map(({ building, items }) => (
            <div key={building.id} className="bs__group">
              <h3 className="bs__group-title">{building.name}</h3>
              <ul className="bs__interests">
                {items.map((e) => (
                  <InterestItem key={e.id} exhibit={e} />
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section id="contact" data-exhibit="contact" className="zone press" aria-labelledby="contact-title">
          <h2 className="zone__title" id="contact-title">
            Contact
          </h2>
          <ContactContent />
        </section>
      </main>
    </div>
  );
}
