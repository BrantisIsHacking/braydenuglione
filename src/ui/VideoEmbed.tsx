import { useEffect, useRef, useState } from 'react';
import type { Media } from '../content/types';

export function VideoEmbed({ youtubeId, poster, title }: { youtubeId: string; poster: Media; title: string }) {
  const [playing, setPlaying] = useState(false);
  const frameRef = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    if (playing) frameRef.current?.focus();
  }, [playing]);
  const watchUrl = `https://www.youtube.com/watch?v=${youtubeId}`;
  return (
    <div className="video">
      <div className="video__frame">
        {playing ? (
          <iframe
            ref={frameRef}
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            <img src={poster.src} alt={poster.alt} width={poster.width} height={poster.height} loading="lazy" />
            <button type="button" className="video__play" onClick={() => setPlaying(true)} aria-label={`Play ${title}`}>
              <span aria-hidden="true">&#9654;</span>
            </button>
          </>
        )}
      </div>
      <a className="video__link" href={watchUrl} target="_blank" rel="noopener noreferrer">
        Watch on YouTube
      </a>
    </div>
  );
}
