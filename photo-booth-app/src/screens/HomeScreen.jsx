import './HomeScreen.css';

const MODES = [
  { count: 1, label: 'Solo Shot' },
  { count: 2, label: 'Duo Strip' },
  { count: 3, label: 'Trio Strip' },
  { count: 4, label: 'Squad Strip' },
];

export default function HomeScreen({ onSelectMode, onOpenGallery }) {
  return (
    <div className="screen home-screen">
      <div className="app-bar">
        <img src="/camp-sign-new.png" alt="" className="app-bar-icon" />
        <span className="app-bar-title">Camp Javery Photo Booth</span>
      </div>

      <p className="home-subtitle">Pick how many photos you want in your strip</p>

      <div className="mode-grid">
        {MODES.map(({ count, label }) => (
          <button
            key={count}
            type="button"
            className="mode-card"
            onClick={() => onSelectMode(count)}
          >
            <span className="mode-card-count">{count}</span>
            <span className="mode-card-label">{label}</span>
          </button>
        ))}
      </div>

      <button type="button" className="btn btn-secondary btn-block home-gallery-button" onClick={onOpenGallery}>
        🖼️ View Photo Booth Gallery
      </button>
    </div>
  );
}
