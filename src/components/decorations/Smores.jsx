export default function Smores({ className = '' }) {
  return (
    <svg className={`smores ${className}`} viewBox="0 0 80 60" fill="none">
      {/* Bottom graham cracker */}
      <rect x="10" y="40" width="60" height="12" rx="2" fill="#C4A26D" />
      <rect x="10" y="40" width="60" height="12" rx="2" fill="none" stroke="#8B7355" strokeWidth="1" />

      {/* Chocolate */}
      <rect x="15" y="32" width="50" height="10" rx="1" fill="#5D4037" />

      {/* Marshmallow */}
      <ellipse cx="40" cy="24" rx="22" ry="12" fill="#FDF6E3" />
      <ellipse cx="40" cy="24" rx="22" ry="12" fill="none" stroke="#E8C07D" strokeWidth="1" />

      {/* Top graham cracker */}
      <rect x="10" y="8" width="60" height="12" rx="2" fill="#C4A26D" />
      <rect x="10" y="8" width="60" height="12" rx="2" fill="none" stroke="#8B7355" strokeWidth="1" />

      {/* Graham cracker texture */}
      <line x1="25" y1="10" x2="25" y2="18" stroke="#8B7355" strokeWidth="0.5" opacity="0.5" />
      <line x1="40" y1="10" x2="40" y2="18" stroke="#8B7355" strokeWidth="0.5" opacity="0.5" />
      <line x1="55" y1="10" x2="55" y2="18" stroke="#8B7355" strokeWidth="0.5" opacity="0.5" />
      <line x1="25" y1="42" x2="25" y2="50" stroke="#8B7355" strokeWidth="0.5" opacity="0.5" />
      <line x1="40" y1="42" x2="40" y2="50" stroke="#8B7355" strokeWidth="0.5" opacity="0.5" />
      <line x1="55" y1="42" x2="55" y2="50" stroke="#8B7355" strokeWidth="0.5" opacity="0.5" />
    </svg>
  );
}
