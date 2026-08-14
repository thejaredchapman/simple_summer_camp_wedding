import { useState } from 'react';
import { adminListPhotos, adminDeletePhoto } from '../lib/photosApi';
import { adminListVideos, adminDeleteVideo } from '../lib/videosApi';
import ContactHelpLink from '../components/ContactHelpLink';
import './AdminPage.css';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const [photoResult, videoResult] = await Promise.allSettled([
        adminListPhotos(password),
        adminListVideos(password),
      ]);

      if (photoResult.status === 'rejected' && videoResult.status === 'rejected') {
        throw photoResult.reason;
      }

      setPhotos(photoResult.status === 'fulfilled' ? photoResult.value : []);
      setVideos(videoResult.status === 'fulfilled' ? videoResult.value : []);
      setAuthed(true);

      const failed = [photoResult, videoResult].find(r => r.status === 'rejected');
      if (failed) {
        setError(failed.reason.message || 'Some content failed to load.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePhoto(id) {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await adminDeletePhoto(id, password);
      setPhotos(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteVideo(id) {
    if (!window.confirm('Delete this video?')) return;
    try {
      await adminDeleteVideo(id, password);
      setVideos(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (!authed) {
    return (
      <div className="admin-page">
        <form onSubmit={handleLogin} className="admin-login">
          <h1>Admin</h1>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Admin password"
            required
          />
          {error && <p className="admin-error" role="alert">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
        <ContactHelpLink />
      </div>
    );
  }

  return (
    <div className="admin-page">
      {error && <p className="admin-error" role="alert">{error}</p>}
      <h1>Photo Moderation</h1>
      <p className="admin-stats">
        {photos.length} photo{photos.length === 1 ? '' : 's'} uploaded
      </p>
      <div className="admin-grid">
        {photos.map(photo => (
          <div key={photo.id} className="admin-item">
            <img src={photo.url} alt={`Photo from ${photo.name}`} />
            <p>{photo.name}</p>
            <button type="button" onClick={() => handleDeletePhoto(photo.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>

      <h2>Video Moderation</h2>
      <p className="admin-stats">
        {videos.length} video{videos.length === 1 ? '' : 's'} uploaded
      </p>
      <div className="admin-grid">
        {videos.map(video => (
          <div key={video.id} className="admin-item">
            <video src={video.url} controls preload="metadata" />
            <p>{video.name}</p>
            <button type="button" onClick={() => handleDeleteVideo(video.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
      <ContactHelpLink />
    </div>
  );
}
