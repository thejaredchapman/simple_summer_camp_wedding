export default function PineTree({ className = '', flip = false, variant = 'pine', color = 'green' }) {
  // Color palettes for natural tree colors
  const colorPalettes = {
    green: {
      dark: '#1a4d3e',
      mid: '#2d6b5a',
      light: '#4a9080',
      trunk: '#5D4037'
    },
    teal: {
      dark: '#1a5c5c',
      mid: '#2d8080',
      light: '#4aa3a3',
      trunk: '#6D4C41'
    },
    sage: {
      dark: '#3d5c4a',
      mid: '#5a8068',
      light: '#7ba38a',
      trunk: '#5D4037'
    },
    forest: {
      dark: '#1a3d2e',
      mid: '#2d5a45',
      light: '#4a8068',
      trunk: '#4E342E'
    },
    mint: {
      dark: '#2d6b60',
      mid: '#4a9085',
      light: '#6bb5a8',
      trunk: '#5D4037'
    }
  };

  const palette = colorPalettes[color] || colorPalettes.green;

  // Classic pine tree - triangular evergreen shape
  const pineTree = (
    <svg
      className={className}
      viewBox="0 0 60 100"
      fill="none"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      {/* Top tier */}
      <polygon points="30,5 20,25 40,25" fill={palette.light} />
      <polygon points="30,5 22,22 38,22" fill={palette.mid} />

      {/* Second tier */}
      <polygon points="30,18 15,40 45,40" fill={palette.mid} />
      <polygon points="30,18 18,37 42,37" fill={palette.dark} />

      {/* Third tier */}
      <polygon points="30,32 10,58 50,58" fill={palette.dark} />
      <polygon points="30,32 13,55 47,55" fill={palette.mid} opacity="0.7" />

      {/* Bottom tier - largest */}
      <polygon points="30,48 5,78 55,78" fill={palette.dark} />

      {/* Trunk */}
      <rect x="24" y="75" width="12" height="20" fill={palette.trunk} />
      <rect x="26" y="75" width="3" height="20" fill={palette.trunk} opacity="0.7" />
    </svg>
  );

  // Oak tree - round leafy canopy
  const oakTree = (
    <svg
      className={className}
      viewBox="0 0 70 100"
      fill="none"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      {/* Trunk and branches */}
      <path d="M32 95 L32 55 Q28 50 22 48" stroke={palette.trunk} strokeWidth="6" fill="none" strokeLinecap="round" />
      <path d="M38 95 L38 55 Q42 50 48 48" stroke={palette.trunk} strokeWidth="6" fill="none" strokeLinecap="round" />
      <rect x="30" y="55" width="10" height="42" fill={palette.trunk} />

      {/* Main canopy - overlapping circles for leafy effect */}
      <ellipse cx="22" cy="35" rx="15" ry="18" fill={palette.dark} />
      <ellipse cx="48" cy="35" rx="15" ry="18" fill={palette.dark} />
      <ellipse cx="35" cy="25" rx="18" ry="16" fill={palette.mid} />
      <ellipse cx="25" cy="42" rx="12" ry="14" fill={palette.mid} />
      <ellipse cx="45" cy="42" rx="12" ry="14" fill={palette.mid} />
      <ellipse cx="35" cy="38" rx="16" ry="15" fill={palette.dark} />

      {/* Highlight spots */}
      <ellipse cx="28" cy="28" rx="8" ry="7" fill={palette.light} opacity="0.6" />
      <ellipse cx="42" cy="32" rx="6" ry="5" fill={palette.light} opacity="0.5" />
    </svg>
  );

  // Tall pine - slender evergreen
  const tallPine = (
    <svg
      className={className}
      viewBox="0 0 50 120"
      fill="none"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      {/* Top point */}
      <polygon points="25,3 18,18 32,18" fill={palette.light} />

      {/* Upper tiers */}
      <polygon points="25,12 15,30 35,30" fill={palette.mid} />
      <polygon points="25,22 12,42 38,42" fill={palette.dark} />

      {/* Middle tiers */}
      <polygon points="25,35 8,58 42,58" fill={palette.mid} />
      <polygon points="25,48 5,75 45,75" fill={palette.dark} />

      {/* Bottom tier */}
      <polygon points="25,62 2,92 48,92" fill={palette.dark} />

      {/* Trunk */}
      <rect x="20" y="88" width="10" height="28" fill={palette.trunk} />
    </svg>
  );

  // Short bushy pine
  const shortPine = (
    <svg
      className={className}
      viewBox="0 0 60 80"
      fill="none"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      {/* Top */}
      <polygon points="30,5 18,22 42,22" fill={palette.light} />

      {/* Middle */}
      <polygon points="30,15 10,40 50,40" fill={palette.mid} />

      {/* Bottom - wide */}
      <polygon points="30,30 3,60 57,60" fill={palette.dark} />

      {/* Trunk */}
      <rect x="24" y="57" width="12" height="18" fill={palette.trunk} />
    </svg>
  );

  // Deciduous tree - like maple or birch
  const deciduousTree = (
    <svg
      className={className}
      viewBox="0 0 65 100"
      fill="none"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      {/* Trunk */}
      <path d="M30 95 L30 50 Q27 45 20 42" stroke={palette.trunk} strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M35 95 L35 50 Q38 45 45 42" stroke={palette.trunk} strokeWidth="5" fill="none" strokeLinecap="round" />
      <rect x="28" y="50" width="9" height="47" fill={palette.trunk} />

      {/* Canopy - cloud-like shape */}
      <ellipse cx="20" cy="32" rx="14" ry="16" fill={palette.dark} />
      <ellipse cx="45" cy="32" rx="14" ry="16" fill={palette.dark} />
      <ellipse cx="32" cy="20" rx="16" ry="14" fill={palette.mid} />
      <ellipse cx="32" cy="40" rx="18" ry="12" fill={palette.dark} />
      <ellipse cx="15" cy="42" rx="10" ry="10" fill={palette.mid} />
      <ellipse cx="50" cy="42" rx="10" ry="10" fill={palette.mid} />

      {/* Highlights */}
      <ellipse cx="25" cy="22" rx="7" ry="6" fill={palette.light} opacity="0.5" />
    </svg>
  );

  // Narrow/columnar pine (like Italian cypress but pine-like)
  const narrowPine = (
    <svg
      className={className}
      viewBox="0 0 40 110"
      fill="none"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      {/* Top point */}
      <polygon points="20,3 14,15 26,15" fill={palette.light} />

      {/* Tiers getting slightly wider */}
      <polygon points="20,10 12,25 28,25" fill={palette.mid} />
      <polygon points="20,20 10,38 30,38" fill={palette.dark} />
      <polygon points="20,32 8,52 32,52" fill={palette.mid} />
      <polygon points="20,45 6,68 34,68" fill={palette.dark} />
      <polygon points="20,58 4,85 36,85" fill={palette.dark} />

      {/* Trunk */}
      <rect x="16" y="82" width="8" height="25" fill={palette.trunk} />
    </svg>
  );

  // Select tree variant
  const variants = {
    pine: pineTree,
    oak: oakTree,
    tall: tallPine,
    short: shortPine,
    medium: deciduousTree,
    narrow: narrowPine,
    default: pineTree
  };

  return variants[variant] || variants.default;
}
