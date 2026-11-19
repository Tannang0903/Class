import React, { useMemo } from 'react';
import { FrogState } from '../types';

interface CartoonFrogProps {
  frog: FrogState;
  targetPos: { x: number; y: number } | null;
  size?: number; // size in px
  isWinner?: boolean;
}

export const CartoonFrog: React.FC<CartoonFrogProps> = ({
  frog,
  targetPos,
  size = 180,
  isWinner = false,
}) => {
  // Eye tracking offset calculation based on targetPos or frog.aimAngle
  const eyeOffset = useMemo(() => {
    if (frog.aimAngle !== undefined && frog.phase === 'idle') {
      return {
        x: Math.sin(frog.aimAngle) * 5,
        y: -Math.cos(frog.aimAngle) * 3,
      };
    }
    if (!targetPos) return { x: 0, y: -2 };
    const dx = targetPos.x - frog.x;
    const dy = targetPos.y - frog.y;
    const angle = Math.atan2(dy, dx);
    const dist = Math.min(5, Math.hypot(dx, dy) / 45);
    return {
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist,
    };
  }, [targetPos, frog.x, frog.y, frog.aimAngle, frog.phase]);

  const isMouthOpen = frog.mouthOpen || frog.phase === 'shooting' || frog.phase === 'retracting';
  const isChewing = frog.isChewing || frog.phase === 'chewing';

  const uid = frog.index;

  return (
    <div
      className="relative select-none pointer-events-none transition-transform duration-200"
      style={{
        width: `${size}px`,
        height: `${size * 0.92}px`,
      }}
    >
      {/* Floating Lily Pad underneath with organic curves, dew and lotus blossom */}
      <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-[120%] h-[42%] z-0">
        <svg viewBox="0 0 220 80" className="w-full h-full drop-shadow-lg overflow-visible">
          <defs>
            <radialGradient id={`padGrad-${uid}`} cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="55%" stopColor="#22c55e" />
              <stop offset="85%" stopColor="#15803d" />
              <stop offset="100%" stopColor="#14532d" />
            </radialGradient>
            <radialGradient id={`padShadow-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#064e3b" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={`dewGrad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="40%" stopColor="#bae6fd" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.3" />
            </linearGradient>
          </defs>

          {/* Water ripple underneath */}
          <ellipse cx="110" cy="46" rx="100" ry="24" fill={`url(#padShadow-${uid})`} />
          <ellipse
            cx="110"
            cy="46"
            rx="102"
            ry="25"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="2.5"
            strokeDasharray="16 8"
            className="animate-pulse"
          />

          {/* Organic Chibi Lily Pad shape with delicate natural notch */}
          <path
            d="M 18 42 C 16 16, 204 16, 202 42 C 200 64, 142 72, 110 65 C 104 53, 114 51, 110 42 C 106 51, 116 53, 110 65 C 78 72, 20 64, 18 42 Z"
            fill={`url(#padGrad-${uid})`}
            stroke="#166534"
            strokeWidth="2.5"
          />
          {/* Subtle lighter inner rim for depth */}
          <path
            d="M 28 40 C 26 22, 194 22, 192 40 C 190 58, 140 64, 110 58 C 106 48, 114 47, 110 40 C 106 47, 114 48, 110 58 C 80 64, 30 58, 28 40 Z"
            fill="none"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="2"
          />

          {/* Delicate leaf veins radiating from center notch */}
          <path
            d="M 110 42 Q 65 30 36 28 M 110 42 Q 155 30 184 28 M 110 42 Q 55 48 30 46 M 110 42 Q 165 48 190 46 M 110 42 Q 80 58 56 60 M 110 42 Q 140 58 164 60"
            stroke="#14532d"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.45"
            fill="none"
          />

          {/* Cute Glistening Dewdrop */}
          <circle cx="58" cy="34" r="4.5" fill={`url(#dewGrad-${uid})`} />
          <circle cx="56.5" cy="32.5" r="1.5" fill="#ffffff" />
          <circle cx="152" cy="52" r="3" fill={`url(#dewGrad-${uid})`} />
          <circle cx="151" cy="51" r="1" fill="#ffffff" />

          {/* Little Cute Lotus Flower Bud on edge */}
          <g transform="translate(182, 34) scale(0.85)">
            <ellipse cx="0" cy="4" rx="8" ry="4" fill="#15803d" />
            <path d="M -8 2 C -8 -8, 0 -16, 0 -16 C 0 -16, 8 -8, 8 2 Z" fill="#f472b6" />
            <path d="M -5 2 C -5 -6, 0 -14, 0 -14 C 0 -14, 5 -6, 5 2 Z" fill="#fbcfe8" />
            <circle cx="0" cy="-4" r="2.5" fill="#fef08a" />
          </g>
        </svg>
      </div>

      {/* SVG Kawaii / Chibi Frog Body */}
      <svg
        viewBox="0 0 200 180"
        className={`w-full h-full relative z-10 filter drop-shadow-xl transition-transform duration-150 ${
          isChewing ? 'scale-y-[1.05] scale-x-[0.97]' : ''
        }`}
      >
        <defs>
          {/* Rich Chibi Frog Skin Gradient */}
          <linearGradient id={`chibiSkin-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="28%" stopColor="#4ade80" />
            <stop offset="70%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>

          {/* Top highlight for 3D squishy roundness */}
          <radialGradient id={`chibiHighlight-${uid}`} cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>

          {/* Soft Creamy Underbelly */}
          <radialGradient id={`chibiBelly-${uid}`} cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="55%" stopColor="#d9f99d" />
            <stop offset="100%" stopColor="#a3e635" />
          </radialGradient>

          {/* Soft Kawaii Rosy Cheeks */}
          <radialGradient id={`chibiBlush-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.75" />
            <stop offset="65%" stopColor="#fda4af" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
          </radialGradient>

          {/* Glossy Eye Shading */}
          <radialGradient id={`chibiIris-${uid}`} cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="70%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
        </defs>

        {/* Back chubby feet with soft webbed toes */}
        <g>
          <ellipse cx="32" cy="144" rx="25" ry="14" fill="#16a34a" transform="rotate(-12 32 144)" />
          <circle cx="15" cy="142" r="6.5" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
          <circle cx="26" cy="154" r="6.5" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
          <circle cx="42" cy="156" r="6.5" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />

          <ellipse cx="168" cy="144" rx="25" ry="14" fill="#16a34a" transform="rotate(12 168 144)" />
          <circle cx="185" cy="142" r="6.5" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
          <circle cx="174" cy="154" r="6.5" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
          <circle cx="158" cy="156" r="6.5" fill="#22c55e" stroke="#15803d" strokeWidth="1.5" />
        </g>

        {/* Squishy Chubby Body */}
        <ellipse
          cx="100"
          cy="114"
          rx={isChewing ? 75 : 72}
          ry={isChewing ? 55 : 51}
          fill={`url(#chibiSkin-${uid})`}
          stroke="#166534"
          strokeWidth="3.5"
        />
        {/* Top 3D glossy highlight on head/back */}
        <ellipse
          cx="100"
          cy="92"
          rx={62}
          ry={26}
          fill={`url(#chibiHighlight-${uid})`}
        />

        {/* Soft Custard-Yellow Chubby Belly */}
        <ellipse
          cx="100"
          cy="126"
          rx={isChewing ? 50 : 46}
          ry={isChewing ? 38 : 34}
          fill={`url(#chibiBelly-${uid})`}
          stroke="#65a30d"
          strokeWidth="1.5"
          opacity="0.95"
        />
        {/* Cute little belly button mark */}
        <circle cx="100" cy="132" r="1.5" fill="#4d7c0f" opacity="0.6" />

        {/* Little cute front paws resting on tummy/lily pad */}
        <g>
          <ellipse cx="66" cy="146" rx="11" ry="7" fill="#4ade80" stroke="#166534" strokeWidth="1.8" />
          <circle cx="58" cy="148" r="4" fill="#86efac" />
          <circle cx="66" cy="152" r="4" fill="#86efac" />
          <circle cx="74" cy="149" r="4" fill="#86efac" />

          <ellipse cx="134" cy="146" rx="11" ry="7" fill="#4ade80" stroke="#166534" strokeWidth="1.8" />
          <circle cx="126" cy="149" r="4" fill="#86efac" />
          <circle cx="134" cy="152" r="4" fill="#86efac" />
          <circle cx="142" cy="148" r="4" fill="#86efac" />
        </g>

        {/* Eye Sockets (Cute Round Green domes) */}
        <circle cx="62" cy="46" r="31" fill={`url(#chibiSkin-${uid})`} stroke="#166534" strokeWidth="3" />
        <circle cx="138" cy="46" r="31" fill={`url(#chibiSkin-${uid})`} stroke="#166534" strokeWidth="3" />

        {/* Big Bright White Eyeballs */}
        <ellipse cx="63" cy="46" rx="23" ry="25" fill="#ffffff" />
        <ellipse cx="137" cy="46" rx="23" ry="25" fill="#ffffff" />

        {/* Left Pupil / Kawaii Eye Shading with Specular Glints */}
        {isWinner ? (
          // Joyful smiling closed eyes (^.^)
          <path d="M 44 48 Q 63 32 82 48" stroke="#14532d" strokeWidth="5" strokeLinecap="round" fill="none" />
        ) : !frog.isBlinking ? (
          <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
            {/* Dark glossy iris */}
            <ellipse cx="64" cy="46" rx="14" ry="16" fill={`url(#chibiIris-${uid})`} />
            {/* Soft deep turquoise inner glow */}
            <ellipse cx="64" cy="52" rx="9" ry="6" fill="#0284c7" opacity="0.35" />
            {/* Big primary glint */}
            <circle cx="60" cy="40" r="5.5" fill="#ffffff" />
            {/* Secondary cute small glint */}
            <circle cx="70" cy="50" r="2.8" fill="#ffffff" />
            <circle cx="58" cy="52" r="1.8" fill="#ffffff" opacity="0.8" />
          </g>
        ) : (
          // Blinking gentle slit
          <path d="M 44 46 Q 63 56 82 46" stroke="#14532d" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        )}

        {/* Right Pupil / Kawaii Eye Shading with Specular Glints */}
        {isWinner ? (
          <path d="M 118 48 Q 137 32 156 48" stroke="#14532d" strokeWidth="5" strokeLinecap="round" fill="none" />
        ) : !frog.isBlinking ? (
          <g transform={`translate(${eyeOffset.x}, ${eyeOffset.y})`}>
            {/* Dark glossy iris */}
            <ellipse cx="136" cy="46" rx="14" ry="16" fill={`url(#chibiIris-${uid})`} />
            {/* Soft deep turquoise inner glow */}
            <ellipse cx="136" cy="52" rx="9" ry="6" fill="#0284c7" opacity="0.35" />
            {/* Big primary glint */}
            <circle cx="132" cy="40" r="5.5" fill="#ffffff" />
            {/* Secondary cute small glint */}
            <circle cx="142" cy="50" r="2.8" fill="#ffffff" />
            <circle cx="130" cy="52" r="1.8" fill="#ffffff" opacity="0.8" />
          </g>
        ) : (
          <path d="M 118 46 Q 137 56 156 46" stroke="#14532d" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        )}

        {/* Tiny cute curved eyebrows */}
        <path d="M 46 22 Q 62 14 76 21" stroke="#15803d" strokeWidth="2.8" strokeLinecap="round" fill="none" />
        <path d="M 124 21 Q 138 14 154 22" stroke="#15803d" strokeWidth="2.8" strokeLinecap="round" fill="none" />

        {/* Soft Airbrushed Rosy Cheeks (Chibi style) */}
        <circle cx={isChewing ? 40 : 44} cy="96" r="16" fill={`url(#chibiBlush-${uid})`} />
        <circle cx={isChewing ? 160 : 156} cy="96" r="16" fill={`url(#chibiBlush-${uid})`} />

        {/* Tiny cute nostrils */}
        <ellipse cx="94" cy="73" rx="2" ry="2.5" fill="#14532d" />
        <ellipse cx="106" cy="73" rx="2" ry="2.5" fill="#14532d" />

        {/* Mouth & Expressions */}
        {isMouthOpen ? (
          <g>
            {/* Cute Rounded Open Mouth Cavity */}
            <ellipse cx="100" cy="98" rx="33" ry="22" fill="#881337" />
            <ellipse cx="100" cy="103" rx="27" ry="15" fill="#e11d48" />
            {/* Cute glossy tongue root inside mouth */}
            <ellipse cx="100" cy="111" rx="18" ry="7" fill="#fb7185" />
            <circle cx="94" cy="109" r="2" fill="#ffffff" opacity="0.7" />
            {/* Mouth rim outline with clean rounded corners */}
            <path
              d="M 67 96 C 67 78, 133 78, 133 96 C 133 122, 67 122, 67 96 Z"
              stroke="#14532d"
              strokeWidth="4"
              fill="none"
              strokeLinejoin="round"
            />
          </g>
        ) : isChewing ? (
          /* Chewing mouth - adorable wavy squiggly munching mouth */
          <g>
            <path
              d="M 60 95 Q 80 106 100 93 Q 120 106 140 95"
              stroke="#14532d"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Cute chewing sparkles / satisfaction drops */}
            <circle cx="50" cy="88" r="3" fill="#fde047" className="animate-bounce" />
            <circle cx="150" cy="90" r="2.5" fill="#fde047" className="animate-ping" />
          </g>
        ) : (
          /* Sweet Wide Chibi Smile */
          <g>
            <path
              d="M 58 92 Q 100 115 142 92"
              stroke="#14532d"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Tiny cute dimples at smile corners */}
            <path d="M 56 89 Q 54 94 57 97" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M 144 89 Q 146 94 143 97" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
};
