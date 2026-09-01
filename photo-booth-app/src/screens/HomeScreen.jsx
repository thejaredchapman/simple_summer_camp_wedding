import './HomeScreen.css';

export default function HomeScreen({ onSelectMode }) {
  return (
    <div className="screen home-screen">
      <img src="/camp-sign-new.png" alt="Camp Javery" className="home-sign" />
      <h1>Camp Javery Photo Booth</h1>
      <p className="home-subtitle">Pick how many photos for your strip</p>
      <div className="mode-buttons">
        {[1, 2, 3, 4].map(count => (
          <button
            key={count}
            type="button"
            className="mode-button"
            onClick={() => onSelectMode(count)}
          >
            {count} Photo{count > 1 ? 's' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
