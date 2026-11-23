import { useState } from 'react';
import { COLLECTION_LABEL, getCollection } from '../content/collections';
import type { Book, CollectionId, Film, Game, Team } from '../content/types';
import './exhibit.css';

const LEAD = /^(the|a|an)\s+/i;
const sortKey = (t: string) => t.trim().replace(LEAD, '').toLowerCase();

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

function BookList({ books }: { books: readonly Book[] }) {
  const [q, setQ] = useState('');
  const shown = filterBooks(sortBooks(books), q);
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
          <li key={`${b.title}|${b.author}`}>
            {b.favorite && <span className="collection__fav"><span aria-hidden="true">★ </span><span className="sr-only">Favorite: </span></span>}
            {b.title} <span className="collection__sub">by {b.author}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function CollectionList({ id, items }: { id: CollectionId; items?: readonly unknown[] }) {
  const data = (items ?? getCollection(id)) as readonly unknown[];
  let body;
  switch (id) {
    case 'books':
      body = <BookList books={data as readonly Book[]} />;
      break;
    case 'films':
      body = (
        <ol className="collection__list">
          {(data as readonly Film[]).map((f) => (
            <li key={`${f.title}|${f.year}`}>{`${f.title} (${f.year})`}</li>
          ))}
        </ol>
      );
      break;
    case 'games':
      body = (
        <ul className="collection__list">
          {(data as readonly Game[]).map((g) => (
            <li key={g.title}>{g.note ? `${g.title} — ${g.note}` : g.title}</li>
          ))}
        </ul>
      );
      break;
    case 'artists':
      body = (
        <ol className="collection__list">
          {(data as readonly string[]).map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ol>
      );
      break;
    case 'teams': {
      const teams = data as readonly Team[];
      const sports = [...new Set(teams.map((t) => t.sport))];
      body = sports.map((s) => (
        <div key={s}>
          <h4 className="collection__heading">{s}</h4>
          <ul className="collection__list">
            {teams.filter((t) => t.sport === s).map((t) => (
              <li key={t.name}>{t.name}</li>
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
