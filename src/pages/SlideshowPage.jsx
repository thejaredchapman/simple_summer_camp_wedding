import { useEffect, useState, useRef } from 'react';
import { listPhotos } from '../lib/photosApi';
import './SlideshowPage.css';

const POLL_INTERVAL_MS = 20000;
const SLIDE_INTERVAL_MS = 5000;

function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function SlideshowPage() {
  const [photos, setPhotos] = useState([]);
  const [index, setIndex] = useState(0);
  const knownIdsRef = useRef(new Set());

  useEffect(() => {
    let cancelled = false;

    async function fetchPhotos() {
      try {
        const data = await listPhotos();
        if (cancelled) return;
        const currentIds = new Set(data.map(p => p.id));
        const isSameSet =
          currentIds.size === knownIdsRef.current.size &&
          [...currentIds].every(id => knownIdsRef.current.has(id));
        if (!isSameSet) {
          knownIdsRef.current = currentIds;
          setPhotos(shuffle(data));
          setIndex(0);
        }
      } catch (err) {
        console.error('Slideshow fetch error:', err.message);
      }
    }

    fetchPhotos();
    const pollInterval = setInterval(fetchPhotos, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    if (photos.length === 0) return;
    const advance = setInterval(() => {
      setIndex(prev => (prev + 1) % photos.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(advance);
  }, [photos.length]);

  if (photos.length === 0) {
    return (
      <div className="slideshow-page slideshow-empty">
        <p>Waiting for the first photo…</p>
      </div>
    );
  }

  const current = photos[index];

  return (
    <div className="slideshow-page">
      <img
        key={current.id}
        src={current.url}
        alt={`Photo from ${current.name}`}
        className="slideshow-image"
      />
      <p className="slideshow-caption">{current.name}</p>
    </div>
  );
}
