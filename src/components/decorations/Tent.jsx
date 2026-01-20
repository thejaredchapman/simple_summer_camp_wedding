export default function Tent({ className = '' }) {
  return (
    <svg className={`tent ${className}`} viewBox="0 0 120 80" fill="none">
      {/* Tent body */}
      <polygon points="60,5 10,75 110,75" fill="#D4845F" stroke="#316B4F" strokeWidth="2" />

      {/* Tent opening */}
      <polygon points="60,25 40,75 80,75" fill="#316B4F" />

      {/* Tent flaps detail */}
      <line x1="60" y1="5" x2="60" y2="25" stroke="#316B4F" strokeWidth="2" />
      <line x1="60" y1="5" x2="35" y2="40" stroke="#316B4F" strokeWidth="1" opacity="0.5" />
      <line x1="60" y1="5" x2="85" y2="40" stroke="#316B4F" strokeWidth="1" opacity="0.5" />

      {/* Flag on top */}
      <line x1="60" y1="5" x2="60" y2="-5" stroke="#5D4037" strokeWidth="2" />
      <polygon points="60,-5 75,0 60,5" fill="#E8C07D" />

      {/* Ground line */}
      <line x1="5" y1="75" x2="115" y2="75" stroke="#5D4037" strokeWidth="2" />
    </svg>
  );
}
