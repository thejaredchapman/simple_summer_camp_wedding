import { useState } from 'react';
import { adminListPhotos, adminDeletePhoto } from '../lib/photosApi';
import './AdminPage.css';

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await adminListPhotos(password);
      setPhotos(data);
      setAuthed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this photo?')) return;
    try {
      await adminDeletePhoto(id, password);
      setPhotos(prev => prev.filter(p => p.id !== id));
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
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1>Photo Moderation</h1>
      <p className="admin-stats">
        {photos.length} photo{photos.length === 1 ? '' : 's'} uploaded
      </p>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <div className="admin-grid">
        {photos.map(photo => (
          <div key={photo.id} className="admin-item">
            <img src={photo.url} alt={`Photo from ${photo.name}`} />
            <p>{photo.name}</p>
            <button type="button" onClick={() => handleDelete(photo.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
