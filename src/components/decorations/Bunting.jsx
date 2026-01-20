export default function Bunting({ className = '' }) {
  return (
    <svg className={`bunting ${className}`} viewBox="0 0 400 60" preserveAspectRatio="none">
      {/* String */}
      <path
        d="M0 5 Q100 20 200 10 Q300 0 400 15"
        fill="none"
        stroke="#5D4037"
        strokeWidth="2"
      />

      {/* Flags */}
      <polygon points="40,8 55,45 25,45" fill="#D4845F" />
      <polygon points="80,12 95,50 65,50" fill="#1a3c34" />
      <polygon points="120,10 135,48 105,48" fill="#E8C07D" />
      <polygon points="160,6 175,44 145,44" fill="#D4845F" />
      <polygon points="200,10 215,48 185,48" fill="#2C1810" />
      <polygon points="240,8 255,46 225,46" fill="#E8C07D" />
      <polygon points="280,5 295,43 265,43" fill="#1a3c34" />
      <polygon points="320,10 335,48 305,48" fill="#D4845F" />
      <polygon points="360,12 375,50 345,50" fill="#E8C07D" />
    </svg>
  );
}
