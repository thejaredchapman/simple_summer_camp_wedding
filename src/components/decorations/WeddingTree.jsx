export default function WeddingTree({ className = '', flip = false, variant = 'default' }) {
  // Wedding-decorated pine trees with flowers
  const variants = {
    // Tall decorated tree
    tall: (
      <svg
        className={className}
        viewBox="0 0 50 130"
        fill="currentColor"
        style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
      >
        {/* Tree silhouette */}
        <polygon points="25,0 23,12 27,12" fill="#316B4F" />
        <polygon points="25,8 17,22 33,22" fill="#316B4F" />
        <polygon points="25,18 13,35 37,35" fill="#316B4F" />
        <polygon points="25,30 10,50 40,50" fill="#316B4F" />
        <polygon points="25,44 8,68 42,68" fill="#316B4F" />
        <polygon points="25,60 6,88 44,88" fill="#316B4F" />
        <polygon points="25,78 5,105 45,105" fill="#316B4F" />
        <rect x="21" y="102" width="8" height="18" fill="#5C4033" />

        {/* Small flowers/roses */}
        <circle cx="20" cy="35" r="3" fill="#E8A4B8" />
        <circle cx="30" cy="50" r="3" fill="#F5D7E3" />
        <circle cx="15" cy="68" r="3" fill="#E8A4B8" />
        <circle cx="35" cy="85" r="3" fill="#F5D7E3" />
        <circle cx="25" cy="22" r="2.5" fill="#F5D7E3" />
        <circle cx="22" cy="55" r="2.5" fill="#E8A4B8" />
      </svg>
    ),
    // Medium decorated tree
    medium: (
      <svg
        className={className}
        viewBox="0 0 45 110"
        fill="currentColor"
        style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
      >
        {/* Tree silhouette */}
        <polygon points="22.5,0 20.5,10 24.5,10" fill="#316B4F" />
        <polygon points="22.5,7 15,20 30,20" fill="#316B4F" />
        <polygon points="22.5,16 11,32 34,32" fill="#316B4F" />
        <polygon points="22.5,28 8,48 37,48" fill="#316B4F" />
        <polygon points="22.5,42 6,65 39,65" fill="#316B4F" />
        <polygon points="22.5,58 5,85 40,85" fill="#316B4F" />
        <rect x="19" y="82" width="7" height="18" fill="#5C4033" />

        {/* Small flowers */}
        <circle cx="18" cy="32" r="2.5" fill="#E8A4B8" />
        <circle cx="28" cy="48" r="2.5" fill="#F5D7E3" />
        <circle cx="12" cy="65" r="2.5" fill="#E8A4B8" />
        <circle cx="32" cy="72" r="2.5" fill="#F5D7E3" />
        <circle cx="22" cy="20" r="2" fill="#F5D7E3" />
      </svg>
    ),
    // Short decorated tree
    short: (
      <svg
        className={className}
        viewBox="0 0 40 90"
        fill="currentColor"
        style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
      >
        {/* Tree silhouette */}
        <polygon points="20,0 18,8 22,8" fill="#316B4F" />
        <polygon points="20,5 13,16 27,16" fill="#316B4F" />
        <polygon points="20,13 9,28 31,28" fill="#316B4F" />
        <polygon points="20,24 6,42 34,42" fill="#316B4F" />
        <polygon points="20,38 5,62 35,62" fill="#316B4F" />
        <rect x="17" y="59" width="6" height="21" fill="#5C4033" />

        {/* Small flowers */}
        <circle cx="16" cy="28" r="2" fill="#E8A4B8" />
        <circle cx="26" cy="42" r="2" fill="#F5D7E3" />
        <circle cx="12" cy="52" r="2" fill="#E8A4B8" />
        <circle cx="20" cy="16" r="1.8" fill="#F5D7E3" />
      </svg>
    ),
    // Default decorated tree
    default: (
      <svg
        className={className}
        viewBox="0 0 50 120"
        fill="currentColor"
        style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
      >
        {/* Tree silhouette */}
        <polygon points="25,0 22,12 28,12" fill="#316B4F" />
        <polygon points="25,8 16,22 34,22" fill="#316B4F" />
        <polygon points="25,18 12,36 38,36" fill="#316B4F" />
        <polygon points="25,32 9,52 41,52" fill="#316B4F" />
        <polygon points="25,46 7,70 43,70" fill="#316B4F" />
        <polygon points="25,62 5,92 45,92" fill="#316B4F" />
        <rect x="21" y="89" width="8" height="21" fill="#5C4033" />

        {/* Small pink/white flowers */}
        <circle cx="19" cy="36" r="2.5" fill="#E8A4B8" />
        <circle cx="31" cy="52" r="2.5" fill="#F5D7E3" />
        <circle cx="14" cy="70" r="2.5" fill="#E8A4B8" />
        <circle cx="36" cy="85" r="2.5" fill="#F5D7E3" />
        <circle cx="25" cy="22" r="2" fill="#F5D7E3" />
        <circle cx="22" cy="58" r="2" fill="#E8A4B8" />
      </svg>
    )
  };

  return variants[variant] || variants.default;
}
