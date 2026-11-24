import { useEffect, useState } from 'react';
import { banners, buildings, COLLECTION_LABEL, exhibitsIn, getCollection, getExhibit, profile, stations } from '../content';
import type { Exhibit } from '../content';
import { parseRoute } from '../routing/routes';
import { CollectionList } from '../ui/CollectionList';
import { ContactContent } from '../ui/ContactContent';
import { ExhibitContent } from '../ui/ExhibitContent';
import { Entry } from './Entry';
import { ICONS, MailIcon } from './icons';
import { SECTIONS, sortByRecency } from './logic';
import { useActiveSection } from './useActiveSection';
import { useSpotlight } from './useSpotlight';
import './boxscore.css';

type InterestExhibit = Extract<Exhibit, { type: 'interest' }>;

const ROLE_LINE = 'SWE · Data Science · ML';
const SECTION_IDS = SECTIONS.map((s) => s.id);

const EXPERIENCE = sortByRecency(stations.filter((s) => s.category === 'experience'));
const PROJECTS = stations.filter((s) => s.category === 'project'); // authored order: strongest first
const LEADERSHIP = sortByRecency(stations.filter((s) => s.category === 'leadership'));
const EDUCATION = sortByRecency(stations.filter((s) => s.category === 'education'));
const EARLIER = sortByRecency(stations.filter((s) => s.category === 'throwback'));

// Interests grouped by their home building, in building order (mirrors are not repeated).
const OFF_THE_CLOCK = buildings
  .map((b) => ({
    building: b,
    items: exhibitsIn(b.id).flatMap((p) => (!p.mirror && p.exhibit.type === 'interest' ? [p.exhibit] : [])),
  }))
  .filter((g) => g.items.length > 0);

const reduceMotion = () => typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** In-page navigation without touching the hash: the hash router would read `#about` as a route change. */
function goTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ block: 'start', behavior: reduceMotion() ? 'auto' : 'smooth' });
  const h = el.querySelector<HTMLElement>('h2');
  if (h) {
    h.tabIndex = -1;
    h.focus({ preventScroll: true });
  }
}

function IconLinks({ className }: { className?: string }) {
  return (
    <ul className={className} aria-label="Contact and profile links">
      {profile.links.map((l) => {
        const Icon = ICONS[l.label];
        return (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noopener noreferrer" aria-label={`${l.label} (opens in a new tab)`} title={l.label}>
              {Icon ? <Icon /> : l.label}
            </a>
          </li>
        );
      })}
      <li>
        <a href={`mailto:${profile.email}`} aria-label={`Email ${profile.email}`} title="Email">
          <MailIcon />
        </a>
      </li>
    </ul>
  );
}

function InterestItem({ exhibit, targeted }: { exhibit: InterestExhibit; targeted: boolean }) {
  const { collection } = exhibit.interest;
  // The long lists (75 books, films, games...) are only built once opened, which keeps first render light.
  const [opened, setOpened] = useState(false);
  const bare: InterestExhibit = { ...exhibit, interest: { ...exhibit.interest, collection: undefined } };
  return (
    <li id={exhibit.id} data-exhibit={exhibit.id} className={`bs__item bs__interest${collection || exhibit.interest.playlist ? ' bs__interest--wide' : ''}${targeted ? ' is-target' : ''}`}>
      <ExhibitContent exhibit={bare} headingLevel={4} />
      {collection && (
        <details className="bs__more" onToggle={(e) => e.currentTarget.open && setOpened(true)}>
          <summary>{`${COLLECTION_LABEL[collection]} (${getCollection(collection).length})`}</summary>
          {opened && <CollectionList id={collection} headingLevel={5} />}
        </details>
      )}
    </li>
  );
}

function Section({ id, title, children, className = '' }: { id: string; title: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`bs__section ${className}`} aria-labelledby={`${id}-title`}>
      <h2 className="bs__h2" id={`${id}-title`}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function BoxScore({ onExplore, notice }: { onExplore?: () => void; notice?: string } = {}) {
  const [target, setTarget] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const active = useActiveSection(SECTION_IDS, 'bs-end');
  const rootRef = useSpotlight<HTMLDivElement>();

  // On phones the nav is a horizontal strip: keep the active item in view.
  useEffect(() => {
    const a = document.querySelector<HTMLElement>('.bs__nav [aria-current="true"]');
    const ul = a?.closest('ul');
    if (a && ul && ul.scrollWidth > ul.clientWidth) {
      ul.scrollTo?.({ left: a.offsetLeft - ul.clientWidth / 2 + a.offsetWidth / 2, behavior: reduceMotion() ? 'auto' : 'smooth' });
    }
  }, [active]);

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

  const list = (items: typeof stations) => (
    <div className="bs__entries">
      {items.map((s) => (
        <Entry key={s.id} station={s} targeted={target === s.id} />
      ))}
    </div>
  );

  return (
    <div className="bs" ref={rootRef}>
      <div className="bs__spot" aria-hidden="true" />
      <a
        className="bs__skip"
        href="#content"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById('content');
          main?.focus();
          main?.scrollIntoView({ block: 'start' });
        }}
      >
        Skip to content
      </a>
      {notice && (
        <p role="status" className="bs__notice">
          {notice}
        </p>
      )}
      <div className="bs__layout">
        <header className="bs__side">
          <div className="bs__id">
            <h1 className="bs__name">{profile.name}</h1>
            <p className="bs__role">{ROLE_LINE}</p>
            <p className="bs__pitch">{profile.pitch}</p>
            {onExplore && (
              <button type="button" className="bs__enter" onClick={onExplore}>
                Explore Brayden&apos;s World <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
          <nav className="bs__nav" aria-label="Sections">
            <ul>
              {SECTIONS.map((s) => (
                <li key={s.id}>
                  <a
                    href="#/box-score"
                    className="bs__nav-link"
                    aria-current={active === s.id ? 'true' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      goTo(s.id);
                    }}
                  >
                    <span className="bs__nav-bar" aria-hidden="true" />
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <IconLinks className="bs__icons" />
        </header>

        <main id="content" className="bs__main" tabIndex={-1}>
          <Section id="section-about" title="About" className="bs__about">
            <p className="bs__lead">{profile.intro}</p>
            <p>{profile.school}</p>
            <p className="bs__targets">{profile.targets}</p>
          </Section>

          <Section id="section-experience" title="Experience">
            {list(EXPERIENCE)}
          </Section>

          <Section id="section-projects" title="Projects">
            {list(PROJECTS)}
          </Section>

          <Section id="section-leadership" title="Leadership">
            {list(LEADERSHIP)}
          </Section>

          <Section id="section-education" title="Education">
            {list(EDUCATION)}
            <p className="bs__group-title">Before college</p>
            {list(EARLIER)}
          </Section>

          <Section id="section-awards" title="Awards">
            <ul className="bs__banners">
              {banners.map((b) => (
                <li key={b.id} id={b.id} data-exhibit={b.id} className={`bs__item banner${target === b.id ? ' is-target' : ''}`}>
                  <ExhibitContent exhibit={getExhibit(b.id)!} headingLevel={3} />
                </li>
              ))}
            </ul>
          </Section>

          <Section id="section-off-the-clock" title="Off the clock">
            {OFF_THE_CLOCK.map(({ building, items }) => (
              <div key={building.id} className="bs__group">
                <h3 className="bs__group-title">{building.name}</h3>
                <ul className="bs__interests">
                  {items.map((e) => (
                    <InterestItem key={e.id} exhibit={e} targeted={target === e.id} />
                  ))}
                </ul>
              </div>
            ))}
          </Section>

          <section id="contact" data-exhibit="contact" className={`bs__section press${target === 'contact' ? ' is-target' : ''}`} aria-labelledby="contact-title">
            <h2 className="bs__h2" id="contact-title">
              Contact
            </h2>
            <ContactContent />
          </section>
        </main>
      </div>
      <footer className="bs__foot">
        <p>Designed and built by {profile.name}.</p>
        <div id="bs-end" className="bs__end" aria-hidden="true" />
      </footer>
    </div>
  );
}
