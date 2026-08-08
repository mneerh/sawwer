/**
 * Illustrated stand-ins for photographs, used by the sample Diriyah journey.
 *
 * The demo has to work with no assets and no network, but a grey placeholder
 * box would undercut a product whose whole premise is photography. These are
 * flat, editorial scenes of Najdi mud architecture — clearly drawings rather
 * than photos, so nothing is passed off as a real image of a real place.
 */

type Props = { imageId: string; className?: string };

const SCENES: Record<string, () => React.ReactElement> = {
  "demo-1": AlleyAtDawn,
  "demo-2": PalaceFacade,
  "demo-3": WadiPalms,
  "demo-4": SquareAtSunset,
  "demo-5": WallDetail,
};

export function DemoPhoto({ imageId, className = "" }: Props) {
  const Scene = SCENES[imageId] ?? AlleyAtDawn;
  return (
    <svg
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      className={`h-full w-full ${className}`}
      role="img"
      aria-label="رسم توضيحي لمشهد من الدرعية"
    >
      <Scene />
    </svg>
  );
}

/* ------------------------------------------------------------------ */

function Grain({ id }: { id: string }) {
  return (
    <>
      <filter id={id}>
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="1200" height="800" filter={`url(#${id})`} opacity="0.06" />
    </>
  );
}

function AlleyAtDawn() {
  return (
    <>
      <defs>
        <linearGradient id="a-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#EBDFC8" />
          <stop offset="100%" stopColor="#F6EFE1" />
        </linearGradient>
        <linearGradient id="a-left" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#8E6A4C" />
          <stop offset="100%" stopColor="#B08A64" />
        </linearGradient>
        <linearGradient id="a-right" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#D8BE96" />
          <stop offset="100%" stopColor="#C2A277" />
        </linearGradient>
      </defs>

      <rect width="1200" height="800" fill="url(#a-sky)" />

      {/* A gatehouse closes the far end of the alley. Without it, a tall or
          wide crop lands on empty sky — every crop needs something to hold. */}
      <rect x="470" y="250" width="260" height="400" fill="#C4A379" />
      <rect x="512" y="196" width="80" height="60" fill="#BE9C71" />
      <rect x="620" y="214" width="70" height="42" fill="#BE9C71" />
      {Array.from({ length: 6 }).map((_, index) => (
        <path key={index} d={`M${478 + index * 42} 250 l17 -26 l17 26 Z`} fill="#A78458" />
      ))}
      <path d="M545 650 v-150 a55 55 0 0 1 110 0 v150 Z" fill="#6E5236" opacity="0.85" />
      {Array.from({ length: 2 }).map((_, index) => (
        <path key={index} d={`M${520 + index * 130} 380 l22 -34 l22 34 Z`} fill="#7C5C3C" opacity="0.5" />
      ))}

      {/* right wall, catching the low sun */}
      <path d="M1200 0 H700 L742 650 H1200 Z" fill="url(#a-right)" />
      {/* left wall, still in shadow */}
      <path d="M0 0 H500 L458 650 H0 Z" fill="url(#a-left)" />

      {/* crenellations */}
      {Array.from({ length: 9 }).map((_, index) => (
        <path key={index} d={`M${716 + index * 56} ${16 + index * 5} l24 -32 l24 32 Z`} fill="#B79A72" />
      ))}
      {Array.from({ length: 9 }).map((_, index) => (
        <path key={index} d={`M${8 + index * 56} ${52 - index * 5} l24 -30 l24 30 Z`} fill="#7C5C41" />
      ))}

      {/* wall openings */}
      {Array.from({ length: 5 }).map((_, index) => (
        <rect key={index} x={790 + index * 78} y={230 + index * 20} width="28" height="50" rx="3" fill="#8B6A4A" opacity="0.5" />
      ))}
      {Array.from({ length: 4 }).map((_, index) => (
        <rect key={index} x={70 + index * 90} y={300 - index * 16} width="30" height="54" rx="3" fill="#6B4E36" opacity="0.5" />
      ))}

      {/* ground and long morning shadow */}
      <path d="M0 650 H1200 V800 H0 Z" fill="#D3B98F" />
      <path d="M458 650 L742 650 L830 800 H330 Z" fill="#C4A87C" />
      <path d="M458 650 L600 650 L500 800 H250 Z" fill="#A98A62" opacity="0.5" />

      <Grain id="grain-1" />
    </>
  );
}

function PalaceFacade() {
  return (
    <>
      <defs>
        <linearGradient id="p-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CFDCE4" />
          <stop offset="100%" stopColor="#EFE6D6" />
        </linearGradient>
        <linearGradient id="p-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#CBA87C" />
          <stop offset="100%" stopColor="#A5825C" />
        </linearGradient>
      </defs>

      <rect width="1200" height="800" fill="url(#p-sky)" />

      {/* stacked towers of the palace complex */}
      <rect x="90" y="300" width="240" height="360" fill="#B08D65" />
      <rect x="300" y="200" width="300" height="460" fill="url(#p-wall)" />
      <rect x="570" y="260" width="220" height="400" fill="#BC9A70" />
      <rect x="760" y="160" width="330" height="500" fill="url(#p-wall)" />

      {/* crenellated tops */}
      {[
        { x: 90, y: 300, w: 240 },
        { x: 300, y: 200, w: 300 },
        { x: 570, y: 260, w: 220 },
        { x: 760, y: 160, w: 330 },
      ].map((block) =>
        Array.from({ length: Math.floor(block.w / 40) }).map((_, index) => (
          <path
            key={`${block.x}-${index}`}
            d={`M${block.x + 6 + index * 40} ${block.y} l17 -26 l17 26 Z`}
            fill="#8E6E4C"
          />
        )),
      )}

      {/* triangular vents, the signature Najdi motif */}
      {Array.from({ length: 5 }).map((_, row) =>
        Array.from({ length: 6 }).map((_, col) => (
          <path
            key={`${row}-${col}`}
            d={`M${790 + col * 50} ${290 + row * 66} l14 -22 l14 22 Z`}
            fill="#6F5238"
            opacity="0.45"
          />
        )),
      )}

      {/* windows */}
      {Array.from({ length: 3 }).map((_, index) => (
        <rect key={index} x={340 + index * 82} y={300} width="34" height="62" rx="4" fill="#7A5C3F" opacity="0.6" />
      ))}
      <rect x="410" y="540" width="76" height="120" rx="38" fill="#6B4F35" opacity="0.75" />

      <rect y="660" width="1200" height="140" fill="#DBC49C" />
      <rect y="660" width="1200" height="26" fill="#C9AE83" />

      <Grain id="grain-2" />
    </>
  );
}

function WadiPalms() {
  const palms = [
    { x: 180, y: 470, s: 1.05 },
    { x: 400, y: 440, s: 1.25 },
    { x: 640, y: 480, s: 0.95 },
    { x: 850, y: 445, s: 1.15 },
    { x: 1050, y: 490, s: 0.9 },
  ];

  return (
    <>
      <defs>
        <linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#DCE4D8" />
          <stop offset="100%" stopColor="#F1EADB" />
        </linearGradient>
      </defs>

      <rect width="1200" height="800" fill="url(#w-sky)" />
      {/* far escarpment */}
      <path d="M0 380 L220 320 L470 366 L700 300 L950 350 L1200 310 V800 H0 Z" fill="#C9B48D" />

      <rect y="560" width="1200" height="240" fill="#B8A176" />

      {/* the watercourse */}
      <path d="M0 690 C260 650 420 730 640 700 C860 670 1010 726 1200 694 V800 H0 Z" fill="#7E9686" opacity="0.85" />

      {palms.map((palm, index) => (
        <g key={index} transform={`translate(${palm.x} ${palm.y}) scale(${palm.s})`}>
          <path d="M0 200 C-6 120 -4 60 4 0 L18 2 C12 62 12 122 16 200 Z" fill="#7A6144" />
          {Array.from({ length: 7 }).map((_, frond) => {
            const angle = -90 + (frond - 3) * 26;
            return (
              <path
                key={frond}
                d="M8 4 C60 -18 104 -6 130 22 C96 12 52 14 8 26 Z"
                fill={frond % 2 === 0 ? "#4F6B4C" : "#5F7B57"}
                transform={`rotate(${angle} 8 4)`}
              />
            );
          })}
        </g>
      ))}

      <Grain id="grain-3" />
    </>
  );
}

function SquareAtSunset() {
  return (
    <>
      <defs>
        <linearGradient id="s-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#E8B07A" />
          <stop offset="55%" stopColor="#F0CB9D" />
          <stop offset="100%" stopColor="#F5E2C6" />
        </linearGradient>
        <linearGradient id="s-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C67F4E" />
          <stop offset="100%" stopColor="#9E5F3B" />
        </linearGradient>
      </defs>

      <rect width="1200" height="800" fill="url(#s-sky)" />
      <circle cx="880" cy="300" r="70" fill="#F6D9AE" opacity="0.8" />

      {/* far wall */}
      <rect x="0" y="330" width="1200" height="290" fill="url(#s-wall)" />
      {Array.from({ length: 24 }).map((_, index) => (
        <path key={index} d={`M${8 + index * 50} 330 l17 -26 l17 26 Z`} fill="#8A5233" />
      ))}
      {/* arcade */}
      {Array.from({ length: 8 }).map((_, index) => (
        <path
          key={index}
          d={`M${70 + index * 140} 620 v-90 a40 40 0 0 1 80 0 v90 Z`}
          fill="#6E3F27"
          opacity="0.7"
        />
      ))}

      <rect y="620" width="1200" height="180" fill="#D9AE80" />

      {/* a few unhurried figures */}
      {[300, 520, 760].map((x, index) => (
        <g key={x} opacity={0.72 - index * 0.08}>
          <ellipse cx={x} cy={716} rx="26" ry="6" fill="#8E5E3E" opacity="0.4" />
          <path d={`M${x - 12} 712 l10 -60 h14 l10 60 Z`} fill="#5B3B29" />
          <circle cx={x + 4} cy={640} r="11" fill="#5B3B29" />
        </g>
      ))}

      <Grain id="grain-4" />
    </>
  );
}

function WallDetail() {
  return (
    <>
      <defs>
        <linearGradient id="d-wall" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#D2A874" />
          <stop offset="100%" stopColor="#A87A50" />
        </linearGradient>
      </defs>

      <rect width="1200" height="800" fill="url(#d-wall)" />

      {/* courses of mud brick */}
      {Array.from({ length: 11 }).map((_, row) => (
        <rect key={row} y={row * 74} width="1200" height="3" fill="#8E653F" opacity="0.28" />
      ))}
      {Array.from({ length: 11 }).map((_, row) =>
        Array.from({ length: 13 }).map((_, col) => (
          <rect
            key={`${row}-${col}`}
            x={col * 96 + (row % 2 ? 48 : 0)}
            y={row * 74}
            width="94"
            height="72"
            fill="#000"
            opacity={((row * 7 + col * 13) % 5) * 0.012}
          />
        )),
      )}

      {/* the triangular vents, close up */}
      {Array.from({ length: 3 }).map((_, index) => (
        <path key={index} d={`M${300 + index * 300} 470 l60 -105 l60 105 Z`} fill="#4E3823" opacity="0.8" />
      ))}

      {/* last light raking across the surface */}
      <path d="M0 0 L1200 0 L1200 220 L0 470 Z" fill="#F3D4A6" opacity="0.28" />
      <path d="M0 620 L1200 470 L1200 800 L0 800 Z" fill="#5E4128" opacity="0.22" />

      <Grain id="grain-5" />
    </>
  );
}
