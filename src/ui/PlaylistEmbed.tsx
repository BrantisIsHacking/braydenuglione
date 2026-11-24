import { useEffect, useRef, useState } from 'react';

export const SPOTIFY_ORIGIN = 'https://open.spotify.com';

/**
 * Click-to-load Spotify playlist player. Nothing is requested from spotify.com until "Play" is clicked:
 * the poster is plain CSS (no image) and the iframe is only created after the click.
 */
export function PlaylistEmbed({ spotifyId, name, blurb }: { spotifyId: string; name: string; blurb: string }) {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (playing) frameRef.current?.focus();
  }, [playing]);
  return (
    <div className="playlist">
      {playing ? (
        <iframe
          ref={frameRef}
          className="playlist__frame"
          src={`${SPOTIFY_ORIGIN}/embed/playlist/${spotifyId}`}
          title={`${name} — Spotify playlist`}
          loading="lazy"
          height={352}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        />
      ) : (
        <div className="playlist__poster">
          <p className="playlist__name">{name}</p>
          <p className="playlist__blurb">{blurb}</p>
          <button type="button" className="playlist__play" onClick={() => setPlaying(true)}>
            {`Play ${name}`}
          </button>
        </div>
      )}
      <p className="playlist__links">
        <a href={`${SPOTIFY_ORIGIN}/playlist/${spotifyId}`} target="_blank" rel="noopener noreferrer">
          Open in Spotify
        </a>
      </p>
      <p className="playlist__note">Full tracks play for listeners logged into Spotify; otherwise you hear 30-second previews.</p>
    </div>
  );
}
