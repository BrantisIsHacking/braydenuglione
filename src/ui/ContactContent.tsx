import { profile } from '../content';
import './exhibit.css';

export function ContactContent() {
  return (
    <div className="contact">
      <p className="exhibit__one">{profile.targets}</p>
      <ul className="contact__list">
        <li>
          <a href={`mailto:${profile.email}`}>{profile.email}</a>
        </li>
      </ul>
      <ul className="exhibit__links" aria-label="Profiles">
        {profile.links.map((l) => (
          <li key={l.url}>
            <a href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
