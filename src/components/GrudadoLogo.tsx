import React from 'react';

interface GrudadoLogoProps {
  className?: string;
  variant?: 'full' | 'horizontal' | 'icon' | 'badge';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  textColor?: 'dark' | 'white';
}

export const GrudadoLogo: React.FC<GrudadoLogoProps> = ({
  className = '',
  variant = 'horizontal',
  size = 'md',
  textColor = 'dark',
}) => {
  // Mascots SVG: Square character (cyan/green) and Triangle character with glasses (orange/pink)
  const renderMascots = (w: number, h: number) => (
    <svg
      width={w}
      height={h}
      viewBox="0 0 240 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-2xs"
    >
      <defs>
        {/* Gradient for Square mascot */}
        <linearGradient id="squareGrad" x1="20" y1="20" x2="105" y2="125" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#05C3DE" />
          <stop offset="60%" stopColor="#25BFCC" />
          <stop offset="100%" stopColor="#8EDD65" />
        </linearGradient>

        {/* Gradient for Triangle mascot */}
        <linearGradient id="triGrad" x1="180" y1="15" x2="180" y2="130" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF426F" />
          <stop offset="35%" stopColor="#FF6A39" />
          <stop offset="100%" stopColor="#F9E547" />
        </linearGradient>
      </defs>

      {/* ================= MASCOT 1: SQUARE (CYAN / GREEN) ================= */}
      <g id="mascot-square">
        {/* Body */}
        <rect
          x="16"
          y="20"
          width="90"
          height="90"
          rx="18"
          fill="url(#squareGrad)"
          stroke="#253746"
          strokeWidth="6"
        />

        {/* Spots / Stickers */}
        <circle cx="34" cy="74" r="11" fill="#F9E547" opacity="0.9" />
        <circle cx="86" cy="82" r="12" fill="#05C3DE" opacity="0.8" />
        <circle cx="48" cy="94" r="7" fill="#8EDD65" opacity="0.9" />

        {/* Left Eye */}
        <circle cx="44" cy="50" r="11" fill="#FFFFFF" stroke="#253746" strokeWidth="4" />
        <circle cx="47" cy="47" r="5" fill="#253746" />
        <circle cx="49" cy="45" r="1.8" fill="#FFFFFF" />

        {/* Right Eye */}
        <circle cx="74" cy="50" r="11" fill="#FFFFFF" stroke="#253746" strokeWidth="4" />
        <circle cx="77" cy="47" r="5" fill="#253746" />
        <circle cx="79" cy="45" r="1.8" fill="#FFFFFF" />

        {/* Nose line */}
        <path d="M59 62V72" stroke="#253746" strokeWidth="4" strokeLinecap="round" />

        {/* Happy Smile */}
        <path
          d="M44 80C44 80 50 88 59 88C68 88 74 80 74 80"
          fill="#FFFFFF"
          stroke="#253746"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* ================= MASCOT 2: TRIANGLE (PINK / ORANGE) ================= */}
      <g id="mascot-triangle">
        {/* Body: Rounded Triangle */}
        <path
          d="M178 18C182 11 190 11 194 18L230 84C234 92 229 102 220 102H152C143 102 138 92 142 84L178 18Z"
          fill="url(#triGrad)"
          stroke="#253746"
          strokeWidth="6"
          strokeLinejoin="round"
        />

        {/* Spots on triangle */}
        <circle cx="162" cy="85" r="9" fill="#F9E547" opacity="0.95" />
        <circle cx="210" cy="85" r="9" fill="#F9E547" opacity="0.95" />
        <circle cx="186" cy="45" r="6" fill="#EF426F" opacity="0.7" />

        {/* Glasses: Teal / Cyan Frames */}
        {/* Left Frame */}
        <circle cx="167" cy="48" r="15" fill="#FFFFFF" stroke="#05C3DE" strokeWidth="6" />
        <circle cx="167" cy="48" r="15" fill="none" stroke="#253746" strokeWidth="2.5" />
        {/* Left Pupil */}
        <circle cx="167" cy="48" r="4.5" fill="#253746" />
        <circle cx="169" cy="46" r="1.6" fill="#FFFFFF" />

        {/* Right Frame */}
        <circle cx="205" cy="48" r="15" fill="#FFFFFF" stroke="#05C3DE" strokeWidth="6" />
        <circle cx="205" cy="48" r="15" fill="none" stroke="#253746" strokeWidth="2.5" />
        {/* Right Pupil */}
        <circle cx="205" cy="48" r="4.5" fill="#253746" />
        <circle cx="207" cy="46" r="1.6" fill="#FFFFFF" />

        {/* Glasses Bridge */}
        <path d="M182 48H190" stroke="#05C3DE" strokeWidth="6" strokeLinecap="round" />
        <path d="M182 48H190" stroke="#253746" strokeWidth="2.5" strokeLinecap="round" />

        {/* Smiling Mouth */}
        <path
          d="M174 72C174 72 179 80 186 80C193 80 198 72 198 72"
          fill="#FFFFFF"
          stroke="#253746"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );

  // Dimensions based on size prop
  const sizeMap = {
    sm: { iconW: 48, iconH: 28, textClass: 'text-sm' },
    md: { iconW: 68, iconH: 40, textClass: 'text-base' },
    lg: { iconW: 96, iconH: 56, textClass: 'text-xl' },
    xl: { iconW: 130, iconH: 76, textClass: 'text-2xl' },
  };

  const { iconW, iconH } = sizeMap[size];
  const isWhite = textColor === 'white';

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{renderMascots(iconW, iconH)}</div>;
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {renderMascots(iconW * 1.3, iconH * 1.3)}
        <div className="mt-1 flex flex-col items-center">
          <span
            className={`font-extrabold tracking-tight leading-none ${
              size === 'lg' || size === 'xl' ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
            } ${isWhite ? 'text-white' : 'text-[#253746]'}`}
            style={{ fontFamily: "'Comfortaa', 'Nunito', 'Quicksand', system-ui, sans-serif" }}
          >
            grudado
          </span>
          <span
            className={`font-extrabold tracking-tight leading-none flex items-center ${
              size === 'lg' || size === 'xl' ? 'text-2xl sm:text-3xl' : 'text-lg sm:text-xl'
            } ${isWhite ? 'text-white' : 'text-[#253746]'}`}
            style={{ fontFamily: "'Comfortaa', 'Nunito', 'Quicksand', system-ui, sans-serif" }}
          >
            em você
            <span className="text-[10px] sm:text-xs font-bold align-top ml-0.5">®</span>
          </span>
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {renderMascots(iconW, iconH)}
      <div className="flex flex-col justify-center leading-tight">
        <span
          className={`font-extrabold tracking-tight ${
            size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : size === 'xl' ? 'text-2xl' : 'text-base'
          } ${isWhite ? 'text-white' : 'text-[#253746]'}`}
          style={{ fontFamily: "'Comfortaa', 'Nunito', 'Quicksand', system-ui, sans-serif" }}
        >
          grudado
        </span>
        <span
          className={`font-extrabold tracking-tight -mt-0.5 flex items-center ${
            size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : size === 'xl' ? 'text-2xl' : 'text-base'
          } ${isWhite ? 'text-white' : 'text-[#253746]'}`}
          style={{ fontFamily: "'Comfortaa', 'Nunito', 'Quicksand', system-ui, sans-serif" }}
        >
          em você
          <span className="text-[9px] font-bold align-top ml-0.5 opacity-80">®</span>
        </span>
      </div>
    </div>
  );
};
