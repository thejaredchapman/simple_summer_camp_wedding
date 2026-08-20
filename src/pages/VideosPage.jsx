import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listVideos } from '../lib/videosApi';
import ContactHelpLink from '../components/ContactHelpLink';
import './VideosPage.css';

const POLL_INTERVAL_MS = 20000;

export default function VideosPage() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchVideos() {
      try {
        const data = await listVideos();
        if (!cancelled) {
          setVideos(data);
          setError('');
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    }

    fetchVideos();
    const interval = setInterval(fetchVideos, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="videos-page">
      <h1>Camp Javery Videos</h1>
      <p className="videos-upload-link">
        <Link to="/upload-video">Upload More Videos</Link>
      </p>
      {error && <p className="videos-error">{error}</p>}
      <div className="videos-grid">
        {videos.map(video => (
          <div key={video.id} className="videos-item">
            <video src={video.url} controls preload="metadata" />
            <span className="videos-item-name">{video.name}</span>
          </div>
        ))}
      </div>
      {videos.length === 0 && !error && (
        <p className="videos-empty">No videos yet — be the first to share one!</p>
      )}
      <ContactHelpLink />
    </div>
  );
}
