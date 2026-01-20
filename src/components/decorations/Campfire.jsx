export default function Campfire({ className = '' }) {
  return (
    <svg className={`campfire ${className}`} viewBox="0 0 100 100" fill="none">
      {/* Logs */}
      <ellipse cx="50" cy="90" rx="40" ry="8" fill="#5D4037" />
      <rect x="15" y="75" width="70" height="12" rx="6" fill="#6D4C41" transform="rotate(-5 50 81)" />
      <rect x="15" y="78" width="70" height="12" rx="6" fill="#4E342E" transform="rotate(5 50 84)" />

      {/* Fire glow */}
      <ellipse cx="50" cy="70" rx="25" ry="10" fill="#FF6B35" opacity="0.3" className="fire-glow" />

      {/* Flames */}
      <path
        className="flame flame-1"
        d="M50 20 Q60 40 55 55 Q50 65 50 70 Q50 65 45 55 Q40 40 50 20"
        fill="#FF6B35"
      />
      <path
        className="flame flame-2"
        d="M40 35 Q48 50 45 60 Q42 68 42 70 Q40 65 38 58 Q32 45 40 35"
        fill="#FFA726"
      />
      <path
        className="flame flame-3"
        d="M60 35 Q52 50 55 60 Q58 68 58 70 Q60 65 62 58 Q68 45 60 35"
        fill="#FFA726"
      />
      <path
        className="flame flame-4"
        d="M50 30 Q55 45 52 55 Q50 62 50 65 Q50 62 48 55 Q45 45 50 30"
        fill="#FFCC02"
      />

      {/* Sparks */}
      <circle className="spark spark-1" cx="45" cy="25" r="2" fill="#FFCC02" />
      <circle className="spark spark-2" cx="55" cy="20" r="1.5" fill="#FFA726" />
      <circle className="spark spark-3" cx="50" cy="15" r="1" fill="#FF6B35" />
    </svg>
  );
}
