import { Fragment, useState } from 'react';
import {
  adminListPhotos,
  adminDeletePhoto,
  adminGetPhotoMetadata,
  adminGetOriginalPhotoUrl,
} from '../lib/photosApi';
import { adminListVideos, adminDeleteVideo } from '../lib/videosApi';
import ContactHelpLink from '../components/ContactHelpLink';
import './AdminPage.css';

const UPLOADER_INFO_LABELS = {
  Make: 'Camera Make',
  Model: 'Camera Model',
  LensModel: 'Lens',
};

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // photoId -> { state: 'loading'|'loaded'|'empty'|'error', metadata }
  const [uploaderInfo, setUploaderInfo] = useState({});

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

  async function handleToggleUploaderInfo(id) {
    const current = uploaderInfo[id];
    if (current) {
      // Already fetched (or in flight) — toggle away just collapses it;
      // clicking again re-expands without re-fetching.
      setUploaderInfo(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    setUploaderInfo(prev => ({ ...prev, [id]: { state: 'loading', metadata: null } }));
    try {
      const metadata = await adminGetPhotoMetadata(id, password);
      setUploaderInfo(prev => ({
        ...prev,
        [id]: { state: metadata ? 'loaded' : 'empty', metadata },
      }));
    } catch {
      setUploaderInfo(prev => ({ ...prev, [id]: { state: 'error', metadata: null } }));
    }
  }

  async function handleViewOriginal(id) {
    try {
      const url = await adminGetOriginalPhotoUrl(id, password);
      if (!url) {
        window.alert('No unwatermarked original was captured for this photo.');
        return;
      }
      window.open(url, '_blank');
    } catch (err) {
      setError(err.message);
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
            <button
              type="button"
              className="admin-uploader-toggle"
              onClick={() => handleToggleUploaderInfo(photo.id)}
            >
              Uploader Info
            </button>
            <button
              type="button"
              className="admin-uploader-toggle"
              onClick={() => handleViewOriginal(photo.id)}
            >
              View Original
            </button>
            <button type="button" onClick={() => handleDeletePhoto(photo.id)}>
              Delete
            </button>

            {uploaderInfo[photo.id] && (
              <div className="admin-uploader-info">
                {uploaderInfo[photo.id].state === 'loading' && <p>Loading…</p>}
                {uploaderInfo[photo.id].state === 'error' && <p>Couldn't load uploader info.</p>}
                {uploaderInfo[photo.id].state === 'empty' && <p>No info captured for this photo.</p>}
                {uploaderInfo[photo.id].state === 'loaded' && (
                  <dl>
                    <dt>IP address</dt>
                    <dd>{uploaderInfo[photo.id].metadata.admin?.ip || 'Unknown'}</dd>
                    <dt>Device / browser</dt>
                    <dd>{uploaderInfo[photo.id].metadata.admin?.userAgent || 'Unknown'}</dd>
                    {Object.entries(UPLOADER_INFO_LABELS).map(([field, label]) => {
                      const value = uploaderInfo[photo.id].metadata.exif?.[field];
                      if (!value) return null;
                      return (
                        <Fragment key={field}>
                          <dt>{label}</dt>
                          <dd>{value}</dd>
                        </Fragment>
                      );
                    })}
                  </dl>
                )}
              </div>
            )}
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
