export default function CampBadge({ children, className = '' }) {
  return (
    <div className={`camp-badge ${className}`}>
      <svg className="badge-border" viewBox="0 0 200 200" fill="none">
        {/* Outer scalloped edge */}
        <path
          d="M100 10
             Q115 10 120 20 Q130 15 135 25 Q145 22 148 32
             Q158 32 160 42 Q170 45 170 55 Q180 60 178 70
             Q188 78 185 88 Q193 98 188 108
             Q195 120 188 130 Q193 142 185 152
             Q188 165 178 172 Q180 185 170 188
             Q170 198 160 198 Q158 208 148 208
             Q145 218 135 215 Q130 225 120 220
             Q115 230 100 230
             Q85 230 80 220 Q70 225 65 215 Q55 218 52 208
             Q42 208 40 198 Q30 198 30 188 Q20 185 22 172
             Q12 165 15 152 Q7 142 12 130
             Q5 120 12 108 Q7 98 15 88
             Q12 78 22 70 Q20 60 30 55
             Q30 45 40 42 Q42 32 52 32
             Q55 22 65 25 Q70 15 80 20 Q85 10 100 10Z"
          fill="#316B4F"
          stroke="#E8C07D"
          strokeWidth="3"
        />

        {/* Inner circle */}
        <circle cx="100" cy="120" r="70" fill="#316B4F" stroke="#E8C07D" strokeWidth="2" />

        {/* Top banner */}
        <path
          d="M40 45 Q100 70 160 45 L155 65 Q100 85 45 65 Z"
          fill="#D4845F"
        />

        {/* Stars */}
        <polygon points="100,25 103,35 113,35 105,42 108,52 100,46 92,52 95,42 87,35 97,35" fill="#E8C07D" />
      </svg>
      <div className="badge-content">
        {children}
      </div>
    </div>
  );
}
