import { useEffect, useRef, useState } from 'react';
import { COLLECTION_LABEL, getCollection } from '../content/collections';
import type { Book, CollectionId, Film, Game, Team } from '../content/types';
import './exhibit.css';

const LEAD = /^(the|a|an)\s+/i;
export const titleSortKey = (t: string) => t.trim().replace(LEAD, '').toLowerCase();
const sortKey = titleSortKey;
const FOCUS_CLASS = 'collection__item--focus';

/** Props for the one list item whose key is the focus: `aria-current` (not colour alone), a class, and a ref to scroll to. */
function useFocusItem(focus: string | null | undefined, token?: number) {
  const ref = useRef<HTMLLIElement | null>(null);
  useEffect(() => {
    // 'nearest' scrolls only the list's own scroller; 'center' would also move ancestors (the page) on mobile.
    ref.current?.scrollIntoView?.({ block: 'nearest' });
  }, [focus, token]);
  return (key: string) => (focus != null && key === focus ? { ref, 'aria-current': 'true' as const, className: FOCUS_CLASS } : {});
}

export function sortBooks(list: readonly Book[]): Book[] {
  const favs = list.filter((b) => b.favorite);
  const rest = list.filter((b) => !b.favorite).sort((a, b) => sortKey(a.title).localeCompare(sortKey(b.title)));
  return [...favs, ...rest];
}

export function filterBooks(list: readonly Book[], q: string): Book[] {
  const n = q.trim().toLowerCase();
  if (!n) return [...list];
  return list.filter((b) => b.title.toLowerCase().includes(n) || b.author.toLowerCase().includes(n));
}

function BookList({ books, focus, focusToken }: { books: readonly Book[]; focus?: string | null; focusToken?: number }) {
  const [q, setQ] = useState('');
  const [seen, setSeen] = useState(focus);
  if (seen !== focus) {
    // a new focus clears the filter so a hidden book is still shown (state adjusted during render, before commit)
    setSeen(focus);
    if (focus != null) setQ('');
  }
  const item = useFocusItem(focus, focusToken);
  const shown = filterBooks(sortBooks(books), seen !== focus ? '' : q);
  return (
    <>
      <div className="collection__filter">
        <input
          className="collection__input"
          type="search"
          aria-label="Filter books"
          placeholder="Filter by title or author"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <span className="collection__count" role="status">{`${shown.length} of ${books.length}`}</span>
      </div>
      <ul className="collection__list collection__list--plain">
        {shown.map((b) => (
          <li key={`${b.title}|${b.author}`} {...item(b.title)}>
            {b.favorite && <span className="collection__fav"><span aria-hidden="true">★ </span><span className="sr-only">Favorite: </span></span>}
            {b.title} <span className="collection__sub">by {b.author}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** `headingLevel` is the level of the sub-headings (teams by sport): one below the heading that introduces the list. */
export function CollectionList({ id, items, focus, focusToken, headingLevel = 3 }: { id: CollectionId; items?: readonly unknown[]; focus?: string | null; focusToken?: number; headingLevel?: 3 | 4 | 5 }) {
  const item = useFocusItem(focus, focusToken);
  const H = `h${headingLevel}` as 'h3' | 'h4' | 'h5';
  const data = (items ?? getCollection(id)) as readonly unknown[];
  let body;
  switch (id) {
    case 'books':
      body = <BookList books={data as readonly Book[]} focus={focus} focusToken={focusToken} />;
      break;
    case 'films':
      body = (
        <ol className="collection__list">
          {(data as readonly Film[]).map((f) => (
            <li key={`${f.title}|${f.year}`} {...item(f.title)}>{`${f.title} (${f.year})`}</li>
          ))}
        </ol>
      );
      break;
    case 'games':
      body = (
        <ul className="collection__list">
          {(data as readonly Game[]).map((g) => (
            <li key={g.title} {...item(g.title)}>{g.note ? `${g.title} — ${g.note}` : g.title}</li>
          ))}
        </ul>
      );
      break;
    case 'artists':
      body = (
        <ol className="collection__list">
          {(data as readonly string[]).map((a) => (
            <li key={a} {...item(a)}>{a}</li>
          ))}
        </ol>
      );
      break;
    case 'teams': {
      const teams = data as readonly Team[];
      const sports = [...new Set(teams.map((t) => t.sport))];
      body = sports.map((s) => (
        <div key={s}>
          <H className="collection__heading">{s}</H>
          <ul className="collection__list">
            {teams.filter((t) => t.sport === s).map((t) => (
              <li key={t.name} {...item(t.name)}>{t.name}</li>
            ))}
          </ul>
        </div>
      ));
      break;
    }
  }
  return (
    <section className="collection" aria-label={COLLECTION_LABEL[id]}>
      {body}
    </section>
  );
}
