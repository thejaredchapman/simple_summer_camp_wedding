export default function Lantern({ className = '' }) {
  return (
    <svg className={`lantern ${className}`} viewBox="0 0 60 100" fill="none">
      {/* Hook */}
      <path d="M30 0 L30 10" stroke="#4E342E" strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="5" r="5" fill="none" stroke="#4E342E" strokeWidth="2" />

      {/* Top cap */}
      <rect x="20" y="12" width="20" height="6" rx="2" fill="#5D4037" />

      {/* Glass body */}
      <rect x="15" y="18" width="30" height="50" rx="3" fill="#FDF6E3" opacity="0.9" />
      <rect x="15" y="18" width="30" height="50" rx="3" fill="none" stroke="#4E342E" strokeWidth="2" />

      {/* Inner glow */}
      <ellipse cx="30" cy="43" rx="10" ry="15" fill="#E8C07D" className="lantern-glow" />

      {/* Flame */}
      <path
        className="lantern-flame"
        d="M30 30 Q35 38 33 45 Q31 50 30 52 Q29 50 27 45 Q25 38 30 30"
        fill="#D4845F"
      />
      <path
        d="M30 35 Q33 40 32 45 Q30 48 30 50 Q30 48 28 45 Q27 40 30 35"
        fill="#FFCC02"
      />

      {/* Cross bars */}
      <line x1="15" y1="30" x2="45" y2="30" stroke="#4E342E" strokeWidth="1.5" />
      <line x1="15" y1="55" x2="45" y2="55" stroke="#4E342E" strokeWidth="1.5" />

      {/* Bottom */}
      <rect x="18" y="68" width="24" height="8" rx="2" fill="#5D4037" />
      <rect x="22" y="76" width="16" height="4" rx="1" fill="#4E342E" />
    </svg>
  );
}
