import React, { useRef, useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Bug, FrogState, Student, GameMode } from '../types';
import { CartoonFrog } from './CartoonFrog';

interface ArenaProps {
  bugs: Bug[];
  frogs: FrogState[];
  winners: Student[] | null;
  gameMode?: GameMode;
  onArenaClick?: () => void;
}

export const Arena: React.FC<ArenaProps> = ({
  bugs,
  frogs,
  winners,
  gameMode = 'auto',
  onArenaClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [arenaWidth, setArenaWidth] = useState<number>(900);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setArenaWidth(entry.contentRect.width);
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Dynamic frog size based on total number of frogs
  const frogSize = Math.max(95, Math.min(185, Math.floor(880 / Math.max(frogs.length, 1))));
  const mouthYOffset = Math.round(frogSize * 0.19);

  // Trigger celebration confetti when winner is determined
  useEffect(() => {
    if (winners && winners.length > 0) {
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0.1, y: 0.7 },
          colors: ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#ec4899'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 0.9, y: 0.7 },
          colors: ['#22c55e', '#eab308', '#ef4444', '#3b82f6', '#ec4899'],
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [winners]);

  // Find highest caughtOrder among winners on leaf to highlight the latest one
  const maxCaughtOrder = Math.max(
    0,
    ...bugs.filter((b) => b.state === 'on_leaf_winner').map((b) => b.caughtOrder ?? 0)
  );

  return (
    <div
      ref={containerRef}
      onClick={() => {
        if (gameMode === 'manual' && onArenaClick) {
          onArenaClick();
        }
      }}
      className={`relative w-full h-full overflow-hidden select-none bg-gradient-to-b from-sky-200 via-teal-100 to-emerald-400 ${
        gameMode === 'manual' ? 'cursor-crosshair' : ''
      }`}
    >
      {/* =========================================================================
          CHIBI POND ATMOSPHERE & BACKGROUND SCENERY
          ========================================================================= */}

      {/* Soft Pastel Clouds drifting gently */}
      <div className="absolute top-5 left-12 w-32 h-11 bg-white/75 rounded-full blur-[1px] shadow-sm pointer-events-none animate-pulse" />
      <div className="absolute top-3 left-20 w-16 h-12 bg-white/80 rounded-full blur-[0.5px] pointer-events-none" />

      <div className="absolute top-10 right-28 w-44 h-12 bg-white/70 rounded-full blur-[1px] shadow-sm pointer-events-none" />
      <div className="absolute top-7 right-40 w-20 h-14 bg-white/75 rounded-full blur-[0.5px] pointer-events-none" />

      {/* Gentle Morning Warm Sun with soft halos */}
      <div
        className="absolute top-6 left-10 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-100 opacity-80 blur-xs pointer-events-none animate-pulse"
        style={{ animationDuration: '4s' }}
      >
        <div className="w-full h-full rounded-full bg-amber-400/20 blur-md scale-150" />
      </div>

      {/* Floating Water Motes / Soft Ambient Fireflies */}
      <div className="absolute top-1/4 left-1/4 w-2.5 h-2.5 bg-yellow-200/80 rounded-full blur-[1px] animate-ping pointer-events-none" style={{ animationDuration: '3.5s' }} />
      <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-emerald-200/90 rounded-full blur-[1px] animate-pulse pointer-events-none" style={{ animationDuration: '2.5s' }} />
      <div className="absolute top-1/2 left-1/6 w-3 h-3 bg-amber-200/70 rounded-full blur-[1.5px] animate-ping pointer-events-none" style={{ animationDuration: '4.5s' }} />
      <div className="absolute top-2/5 right-1/5 w-2 h-2 bg-teal-200/80 rounded-full blur-[1px] animate-pulse pointer-events-none" style={{ animationDuration: '3s' }} />

      {/* Soft Water Caustics / Ripple Shimmer */}
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_2.5px,transparent_2.5px)] [background-size:36px_36px]" />

      {/* Distant soft background lily pads creating natural depth of field */}
      <div className="absolute top-24 left-[18%] w-16 h-8 opacity-40 pointer-events-none blur-[0.5px]">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <ellipse cx="50" cy="25" rx="46" ry="18" fill="#15803d" />
          <ellipse cx="50" cy="24" rx="42" ry="16" fill="#22c55e" />
          <path d="M 50 25 L 30 15 M 50 25 L 70 15" stroke="#14532d" strokeWidth="1.5" opacity="0.5" />
        </svg>
      </div>
      <div className="absolute top-32 right-[22%] w-20 h-9 opacity-45 pointer-events-none blur-[0.5px]">
        <svg viewBox="0 0 100 50" className="w-full h-full">
          <ellipse cx="50" cy="25" rx="46" ry="18" fill="#15803d" />
          <ellipse cx="50" cy="24" rx="42" ry="16" fill="#22c55e" />
          <path d="M 50 25 L 30 15 M 50 25 L 70 15" stroke="#14532d" strokeWidth="1.5" opacity="0.5" />
          <circle cx="72" cy="20" r="5" fill="#f472b6" />
        </svg>
      </div>

      {/* Weeping Willow Branches (Cành liễu rủ thanh thoát góc trên) */}
      <div className="absolute top-0 left-0 w-36 h-48 pointer-events-none z-5 opacity-75">
        <svg viewBox="0 0 120 180" className="w-full h-full overflow-visible">
          {/* Main graceful curved vine */}
          <path d="M 0 0 Q 40 40 50 110 Q 55 140 45 175" stroke="#166534" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 0 15 Q 60 50 70 130 Q 75 160 65 180" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Cute anime willow leaves */}
          <ellipse cx="20" cy="25" rx="4" ry="10" fill="#4ade80" transform="rotate(35 20 25)" />
          <ellipse cx="38" cy="50" rx="4" ry="11" fill="#22c55e" transform="rotate(25 38 50)" />
          <ellipse cx="48" cy="80" rx="4" ry="12" fill="#4ade80" transform="rotate(15 48 80)" />
          <ellipse cx="52" cy="115" rx="3.5" ry="11" fill="#86efac" transform="rotate(10 52 115)" />
          <ellipse cx="48" cy="148" rx="3" ry="10" fill="#22c55e" transform="rotate(-5 48 148)" />

          <ellipse cx="35" cy="30" rx="3.5" ry="9" fill="#22c55e" transform="rotate(45 35 30)" />
          <ellipse cx="58" cy="65" rx="4" ry="11" fill="#4ade80" transform="rotate(20 58 65)" />
          <ellipse cx="68" cy="100" rx="3.5" ry="11" fill="#86efac" transform="rotate(15 68 100)" />
          <ellipse cx="72" cy="135" rx="3" ry="10" fill="#22c55e" transform="rotate(5 72 135)" />
        </svg>
      </div>

      <div className="absolute top-0 right-0 w-36 h-48 pointer-events-none z-5 opacity-75 scale-x-[-1]">
        <svg viewBox="0 0 120 180" className="w-full h-full overflow-visible">
          <path d="M 0 0 Q 40 40 50 110 Q 55 140 45 175" stroke="#166534" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 0 15 Q 60 50 70 130 Q 75 160 65 180" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round" />
          <ellipse cx="20" cy="25" rx="4" ry="10" fill="#4ade80" transform="rotate(35 20 25)" />
          <ellipse cx="38" cy="50" rx="4" ry="11" fill="#22c55e" transform="rotate(25 38 50)" />
          <ellipse cx="48" cy="80" rx="4" ry="12" fill="#4ade80" transform="rotate(15 48 80)" />
          <ellipse cx="52" cy="115" rx="3.5" ry="11" fill="#86efac" transform="rotate(10 52 115)" />
          <ellipse cx="48" cy="148" rx="3" ry="10" fill="#22c55e" transform="rotate(-5 48 148)" />

          <ellipse cx="35" cy="30" rx="3.5" ry="9" fill="#22c55e" transform="rotate(45 35 30)" />
          <ellipse cx="58" cy="65" rx="4" ry="11" fill="#4ade80" transform="rotate(20 58 65)" />
          <ellipse cx="68" cy="100" rx="3.5" ry="11" fill="#86efac" transform="rotate(15 68 100)" />
          <ellipse cx="72" cy="135" rx="3" ry="10" fill="#22c55e" transform="rotate(5 72 135)" />
        </svg>
      </div>

      {/* =========================================================================
          CHIẾC LÁ SEN TRUNG TÂM (CHIBI LOTUS LEAF & FLOWER ĐÓN BẠN LÊN BẢNG)
          ========================================================================= */}
      <div
        className="absolute pointer-events-none z-10 transition-all duration-700 ease-out"
        style={{
          left: gameMode === 'manual' ? `${Math.min(arenaWidth * 0.76, arenaWidth - 140)}px` : '50%',
          bottom: '22px',
          transform: 'translateX(-50%)',
        }}
      >
        {gameMode === 'manual' && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-amber-100/95 text-amber-950 font-black text-[10px] px-2.5 py-0.5 rounded-full border border-amber-300 shadow-sm whitespace-nowrap flex items-center gap-1">
            <span>🪷</span>
            <span>Đóa sen đón bạn</span>
          </div>
        )}
        <div className="w-56 h-32 relative drop-shadow-2xl">
          <svg viewBox="0 0 240 135" className="w-full h-full overflow-visible">
            <defs>
              <radialGradient id="centerLeafGrad" cx="50%" cy="50%" r="55%">
                <stop offset="0%" stopColor="#86efac" />
                <stop offset="35%" stopColor="#4ade80" />
                <stop offset="70%" stopColor="#22c55e" />
                <stop offset="90%" stopColor="#15803d" />
                <stop offset="100%" stopColor="#14532d" />
              </radialGradient>

              <radialGradient id="waterRippleGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="60%" stopColor="#38bdf8" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="centerDewGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                <stop offset="45%" stopColor="#bae6fd" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#0284c7" stopOpacity="0.3" />
              </linearGradient>

              <linearGradient id="lotusPetalGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="60%" stopColor="#fbcfe8" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>

            {/* Glowing Water Rings under the main leaf */}
            <ellipse cx="120" cy="78" rx="112" ry="36" fill="url(#waterRippleGrad)" className="animate-pulse" />
            <ellipse cx="120" cy="78" rx="106" ry="32" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeDasharray="14 8" />

            {/* Soft Shadow */}
            <ellipse cx="120" cy="74" rx="98" ry="30" fill="#064e3b" opacity="0.35" />

            {/* Organic, Wavy Chibi Lotus Leaf Rim */}
            <path
              d="M 16 66 C 14 30, 226 30, 224 66 C 222 98, 156 114, 120 102 C 114 86, 126 84, 120 72 C 114 84, 126 86, 120 102 C 84 114, 18 98, 16 66 Z"
              fill="url(#centerLeafGrad)"
              stroke="#14532d"
              strokeWidth="3"
            />
            {/* Lighter sculpted inner rim */}
            <path
              d="M 26 63 C 24 38, 216 38, 214 63 C 212 90, 152 104, 120 94 C 116 80, 124 78, 120 72 C 116 78, 124 80, 120 94 C 88 104, 28 90, 26 63 Z"
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth="2"
            />

            {/* Delicate radiating leaf veins */}
            <path
              d="M 120 72 Q 60 52 28 48 M 120 72 Q 180 52 212 48 M 120 72 Q 50 72 24 70 M 120 72 Q 190 72 216 70 M 120 72 Q 70 94 44 92 M 120 72 Q 170 94 196 92"
              stroke="#14532d"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.45"
              fill="none"
            />
            {/* Subtle secondary branching veins */}
            <path
              d="M 75 58 Q 55 45 42 42 M 165 58 Q 185 45 198 42 M 72 80 Q 56 86 42 86 M 168 80 Q 184 86 198 86"
              stroke="#15803d"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.35"
              fill="none"
            />

            {/* Sparkling crystal dewdrops */}
            <circle cx="82" cy="62" r="5.5" fill="url(#centerDewGrad)" />
            <circle cx="80" cy="60" r="1.8" fill="#ffffff" />
            <circle cx="162" cy="74" r="4.2" fill="url(#centerDewGrad)" />
            <circle cx="160.8" cy="72.8" r="1.4" fill="#ffffff" />
            <circle cx="120" cy="85" r="3.2" fill="url(#centerDewGrad)" />
            <circle cx="119" cy="84" r="1" fill="#ffffff" />

            {/* Blooming Chibi Pink Lotus Flower (Hoa sen hồng tươi tắn) */}
            <g transform="translate(196, 50)">
              {/* Green sepal */}
              <ellipse cx="0" cy="10" rx="14" ry="5" fill="#15803d" />
              {/* Outer pink petals */}
              <path d="M -16 8 C -22 -6, 0 -24, 0 -24 C 0 -24, 22 -6, 16 8 Z" fill="url(#lotusPetalGrad)" stroke="#db2777" strokeWidth="1.2" />
              <path d="M -22 6 C -28 -2, -8 -16, 0 -22 C -8 -10, -14 0, -22 6 Z" fill="#f472b6" opacity="0.8" />
              <path d="M 22 6 C 28 -2, 8 -16, 0 -22 C 8 -10, 14 0, 22 6 Z" fill="#f472b6" opacity="0.8" />
              {/* Inner delicate petals */}
              <path d="M -11 8 C -14 -4, 0 -18, 0 -18 C 0 -18, 14 -4, 11 8 Z" fill="url(#lotusPetalGrad)" stroke="#f472b6" strokeWidth="1" />
              {/* Golden central stamen / nhụy sen vàng */}
              <circle cx="0" cy="-4" r="5" fill="#fef08a" stroke="#eab308" strokeWidth="1" />
              <circle cx="0" cy="-4" r="2" fill="#ca8a04" />
            </g>
          </svg>
        </div>
      </div>

      {/* =========================================================================
          FLYING FLIES LAYER (CHIBI KAWAII FLIES - z-25 NẰM TRÊN THÂN ẾCH)
          ========================================================================= */}
      <div className="absolute inset-0 z-25 pointer-events-none">
        {bugs
          .filter((b) => b.isAlive && b.state !== 'eaten')
          .map((fly) => {
            const isTarget = fly.state === 'targeted';
            const isCaught = fly.state === 'caught';
            const isWinnerOnLeaf = fly.state === 'on_leaf_winner';
            const isLatestWinner =
              gameMode === 'manual' &&
              isWinnerOnLeaf &&
              (fly.caughtOrder ?? 0) === maxCaughtOrder &&
              maxCaughtOrder > 0;

            return (
              <div
                key={fly.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer"
                style={{
                  left: `${fly.x}px`,
                  top: `${fly.y}px`,
                  transform: `translate(-50%, -50%) scale(${
                    isCaught ? 0.75 : isTarget ? 1.25 : isWinnerOnLeaf ? (isLatestWinner ? 1.4 : 1.3) : 1
                  }) rotate(${isWinnerOnLeaf ? 0 : fly.vx * 4}deg)`,
                  transition: isWinnerOnLeaf
                    ? 'left 0.85s cubic-bezier(0.25, 1, 0.5, 1), top 0.85s cubic-bezier(0.25, 1, 0.5, 1), transform 0.3s ease-out'
                    : 'transform 75ms linear',
                  zIndex: isWinnerOnLeaf ? 50 + (fly.caughtOrder ?? 1) * 5 : isTarget || isCaught ? 30 : 25,
                }}
              >
                {/* Kawaii Target Reticle when frog locks on */}
                {isTarget && (
                  <div className="absolute -inset-4 border-2 border-dashed border-rose-500 rounded-full animate-spin [animation-duration:2.5s]">
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-rose-500 rounded-full" />
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-rose-500 rounded-full" />
                  </div>
                )}

                {/* Chibi Kawaii Fly Representation */}
                <div className="relative flex flex-col items-center">
                  {/* Celebratory golden crown / sparkles when on lotus leaf */}
                  {isWinnerOnLeaf && (
                    <div className="absolute -top-6 select-none pointer-events-none z-30 flex flex-col items-center animate-bounce">
                      {isLatestWinner ? (
                        <span className="bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md border border-white tracking-wide whitespace-nowrap animate-pulse flex items-center gap-0.5">
                          <span>🎯</span>
                          <span>MỚI BẮT!</span>
                        </span>
                      ) : (
                        <span className="text-lg drop-shadow-md">👑</span>
                      )}
                    </div>
                  )}

                  {/* Pearlescent Fairy-like Wings: flap fast in air or rest gently */}
                  <div className="absolute -top-4 flex items-center justify-center w-full z-10 pointer-events-none">
                    {/* Left Wing */}
                    <div
                      className="w-7 h-9 origin-bottom-right transition-transform duration-75"
                      style={{
                        transform: `rotate(${isWinnerOnLeaf ? -28 : fly.wingAngle - 18}deg)`,
                      }}
                    >
                      <svg viewBox="0 0 45 65" className="w-full h-full drop-shadow-sm overflow-visible">
                        <defs>
                          <linearGradient id={`wingGradL-${fly.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                            <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.75" />
                            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.55" />
                          </linearGradient>
                        </defs>
                        {/* Rounded organic teardrop fairy wing */}
                        <path
                          d="M 22 60 C 5 45, 0 20, 20 5 C 38 -5, 45 25, 22 60 Z"
                          fill={`url(#wingGradL-${fly.id})`}
                          stroke="#38bdf8"
                          strokeWidth="1.8"
                        />
                        {/* Delicate filigree wing veins */}
                        <path
                          d="M 22 60 Q 20 32 20 8 M 22 42 Q 32 28 38 18 M 22 48 Q 12 36 8 26"
                          stroke="#7dd3fc"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          fill="none"
                          opacity="0.85"
                        />
                      </svg>
                    </div>

                    {/* Right Wing */}
                    <div
                      className="w-7 h-9 origin-bottom-left transition-transform duration-75 -ml-1.5"
                      style={{
                        transform: `rotate(${isWinnerOnLeaf ? 28 : -fly.wingAngle + 18}deg)`,
                      }}
                    >
                      <svg viewBox="0 0 45 65" className="w-full h-full drop-shadow-sm scale-x-[-1] overflow-visible">
                        <defs>
                          <linearGradient id={`wingGradR-${fly.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
                            <stop offset="50%" stopColor="#e0f2fe" stopOpacity="0.75" />
                            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.55" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 22 60 C 5 45, 0 20, 20 5 C 38 -5, 45 25, 22 60 Z"
                          fill={`url(#wingGradR-${fly.id})`}
                          stroke="#38bdf8"
                          strokeWidth="1.8"
                        />
                        <path
                          d="M 22 60 Q 20 32 20 8 M 22 42 Q 32 28 38 18 M 22 48 Q 12 36 8 26"
                          stroke="#7dd3fc"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                          fill="none"
                          opacity="0.85"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Chibi Fly Body & Kawaii Face */}
                  <div className="relative flex flex-col items-center">
                    {/* Cute tiny round-tipped antennae */}
                    <div className="flex gap-2 -mb-1 z-20">
                      <div className="flex flex-col items-center -rotate-20">
                        <div className="w-1.5 h-1.5 bg-stone-700 rounded-full" />
                        <div className="w-0.5 h-2 bg-stone-700 rounded-full -mt-0.5" />
                      </div>
                      <div className="flex flex-col items-center rotate-20">
                        <div className="w-1.5 h-1.5 bg-stone-700 rounded-full" />
                        <div className="w-0.5 h-2 bg-stone-700 rounded-full -mt-0.5" />
                      </div>
                    </div>

                    {/* Big Kawaii Compound Eyes with Twinkle Stars & Soft Blush */}
                    <div className="flex gap-0.5 z-20 -mb-2">
                      {/* Left Big Eye */}
                      <div className="w-4 h-4 bg-gradient-to-tr from-rose-950 via-rose-600 to-red-400 rounded-full border-1.5 border-stone-800 shadow-xs flex items-start justify-end p-0.5 relative">
                        {/* Big glint */}
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        {/* Small secondary glint */}
                        <div className="w-0.5 h-0.5 bg-white rounded-full absolute bottom-1 left-1 opacity-90" />
                      </div>
                      {/* Right Big Eye */}
                      <div className="w-4 h-4 bg-gradient-to-tr from-rose-950 via-rose-600 to-red-400 rounded-full border-1.5 border-stone-800 shadow-xs flex items-start justify-start p-0.5 relative">
                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        <div className="w-0.5 h-0.5 bg-white rounded-full absolute bottom-1 right-1 opacity-90" />
                      </div>
                    </div>

                    {/* Chubby Plump Abdomen with Student Number */}
                    <div
                      className={`relative w-10 h-12 rounded-full shadow-lg border-2 border-stone-800 flex items-center justify-center transition-all ${
                        isWinnerOnLeaf
                          ? 'ring-4 ring-amber-400 border-amber-300 shadow-amber-300/70 scale-105'
                          : isTarget
                          ? 'ring-4 ring-rose-500 scale-105'
                          : 'ring-1.5 ring-white/30'
                      }`}
                      style={{
                        backgroundColor: isTarget ? '#e11d48' : fly.color,
                        backgroundImage: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
                      }}
                    >
                      {/* Cute subtle striped body bands */}
                      <div className="absolute inset-x-1.5 top-3 h-0.5 bg-black/25 rounded-full pointer-events-none" />
                      <div className="absolute inset-x-2 top-6 h-0.5 bg-black/25 rounded-full pointer-events-none" />
                      <div className="absolute inset-x-2.5 top-9 h-0.5 bg-black/25 rounded-full pointer-events-none" />

                      {/* Number Badge with Crisp Shadow */}
                      <span className="font-black text-xs text-white drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.8)] select-none z-10 tracking-tight">
                        {fly.number}
                      </span>

                      {/* Cute tiny webbed side legs */}
                      <div className="absolute -left-2 top-3.5 w-1.5 h-2.5 border-t-2 border-l-2 border-stone-800 rounded-tl-sm pointer-events-none" />
                      <div className="absolute -left-2 top-7 w-1.5 h-2.5 border-b-2 border-l-2 border-stone-800 rounded-bl-sm pointer-events-none" />
                      <div className="absolute -right-2 top-3.5 w-1.5 h-2.5 border-t-2 border-r-2 border-stone-800 rounded-tr-sm pointer-events-none" />
                      <div className="absolute -right-2 top-7 w-1.5 h-2.5 border-b-2 border-r-2 border-stone-800 rounded-br-sm pointer-events-none" />
                    </div>
                  </div>

                  {/* Clean Chibi Student Name Pill */}
                  <div
                    className={`mt-1 px-2.5 py-0.5 rounded-full font-black whitespace-nowrap shadow-md border transition-all ${
                      isWinnerOnLeaf
                        ? isLatestWinner
                          ? 'bg-rose-100 text-rose-950 border-rose-400 ring-2 ring-rose-400 text-xs scale-105 shadow-rose-300/60 font-black'
                          : 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-300 text-xs scale-105 shadow-amber-200/60'
                        : 'bg-white/95 text-stone-800 border-stone-200 text-[11px]'
                    }`}
                  >
                    {isWinnerOnLeaf && (
                      <span className={isLatestWinner ? 'text-rose-600 mr-1' : 'text-amber-600 mr-1'}>
                        {isLatestWinner ? '🎯' : '⭐'}
                      </span>
                    )}
                    {fly.name || `Số ${fly.number}`}
                    {gameMode === 'manual' && fly.caughtOrder && (
                      <span className="ml-1 text-[10px] text-stone-600 font-bold">
                        (#{fly.caughtOrder})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {/* =========================================================================
          FROGS LAYER (Z-20)
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-20">
        {frogs.map((frog) => {
          let targetCoords: { x: number; y: number } | null = null;
          if (frog.targetBugId !== null) {
            const b = bugs.find((item) => item.id === frog.targetBugId);
            if (b) targetCoords = { x: b.x, y: b.y };
          } else {
            let minDist = Infinity;
            bugs.forEach((b) => {
              if (b.isAlive && b.state === 'flying') {
                const dist = Math.hypot(b.x - frog.x, b.y - frog.y);
                if (dist < minDist) {
                  minDist = dist;
                  targetCoords = { x: b.x, y: b.y };
                }
              }
            });
          }

          return (
            <div
              key={frog.index}
              className="absolute pointer-events-auto transition-transform"
              style={{
                left: `${frog.x}px`,
                top: `${frog.y}px`,
                transform: 'translate(-50%, -75%)',
              }}
            >
              <CartoonFrog
                frog={frog}
                targetPos={targetCoords}
                size={frogSize}
                isWinner={Boolean(winners && winners.length > 0)}
              />
            </div>
          );
        })}
      </div>

      {/* =========================================================================
          SVG LAYER FOR REALISTIC FROG TONGUES (Z-30: LUÔN TRÊN THÂN ẾCH)
          ========================================================================= */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-30">
        <defs>
          <linearGradient id="realTongueFlesh" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#880e4f" />
            <stop offset="30%" stopColor="#ad1457" />
            <stop offset="70%" stopColor="#d81b60" />
            <stop offset="100%" stopColor="#ff4081" />
          </linearGradient>

          <radialGradient id="stickyBulbGradient" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#ff80ab" />
            <stop offset="50%" stopColor="#e91e63" />
            <stop offset="85%" stopColor="#c2185b" />
            <stop offset="100%" stopColor="#880e4f" />
          </radialGradient>

          <radialGradient id="salivaGlint" cx="35%" cy="35%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>

        {frogs.map((frog) => {
          if (!frog.tongueActive || frog.phase === 'idle' || frog.phase === 'chewing') return null;

          const mouthX = frog.x;
          const mouthY = frog.y - mouthYOffset;

          const tipX = mouthX + (frog.tongueTargetX - mouthX) * frog.tongueProgress;
          const tipY = mouthY + (frog.tongueTargetY - mouthY) * frog.tongueProgress;

          const angle = Math.atan2(tipY - mouthY, tipX - mouthX);
          const dist = Math.hypot(tipX - mouthX, tipY - mouthY);
          const perpAngle = angle + Math.PI / 2;
          const curveAmp = Math.min(25, dist * 0.08) * Math.sin(frog.tongueProgress * Math.PI) * (frog.index % 2 === 0 ? -1 : 1);

          const midX = (mouthX + tipX) / 2 + Math.cos(perpAngle) * curveAmp;
          const midY = (mouthY + tipY) / 2 + Math.sin(perpAngle) * curveAmp;

          const baseThick = Math.max(9, 16 - frog.tongueProgress * 4);
          const midThick = Math.max(6, 11 - frog.tongueProgress * 3);
          const tipAngleDeg = (Math.atan2(tipY - midY, tipX - midX) * 180) / Math.PI;

          return (
            <g key={`tongue-${frog.index}`}>
              {/* Soft cast shadow */}
              <path
                d={`M ${mouthX} ${mouthY} Q ${midX} ${midY} ${tipX} ${tipY}`}
                stroke="#4a042a"
                strokeWidth={baseThick + 5}
                strokeLinecap="round"
                fill="none"
                opacity="0.45"
              />

              {/* Realistic Muscular Tongue Flesh */}
              <path
                d={`M ${mouthX} ${mouthY} Q ${midX} ${midY} ${tipX} ${tipY}`}
                stroke="url(#realTongueFlesh)"
                strokeWidth={baseThick}
                strokeLinecap="round"
                fill="none"
              />

              {/* Glossy Wet Top Highlight Strip */}
              <path
                d={`M ${mouthX} ${mouthY - 1} Q ${midX} ${midY - 1} ${tipX} ${tipY - 1}`}
                stroke="#ff80ab"
                strokeWidth={Math.max(2, midThick * 0.45)}
                strokeLinecap="round"
                fill="none"
                opacity="0.85"
              />
              <path
                d={`M ${mouthX} ${mouthY - 1.5} Q ${midX} ${midY - 1.5} ${tipX} ${tipY - 1.5}`}
                stroke="#ffffff"
                strokeWidth={Math.max(1, midThick * 0.22)}
                strokeLinecap="round"
                fill="none"
                opacity="0.75"
              />

              {/* Saliva droplets */}
              <circle
                cx={midX}
                cy={midY + 3}
                r={2.8}
                fill="url(#salivaGlint)"
                opacity={0.8 * frog.tongueProgress}
              />
              <circle
                cx={(mouthX + midX) / 2}
                cy={(mouthY + midY) / 2 + 2}
                r={2}
                fill="#ffffff"
                opacity={0.6 * frog.tongueProgress}
              />

              {/* Sticky Bulb Tip with Saliva Glint */}
              <g transform={`translate(${tipX}, ${tipY}) rotate(${tipAngleDeg})`}>
                <ellipse
                  cx="0"
                  cy="0"
                  rx={12}
                  ry={9}
                  fill="url(#stickyBulbGradient)"
                  stroke="#880e4f"
                  strokeWidth="1.5"
                />
                <path
                  d="M -3 0 L 8 0"
                  stroke="#4a042a"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  opacity="0.6"
                />
                <ellipse
                  cx="-3"
                  cy="-3"
                  rx={4.5}
                  ry={2.5}
                  fill="#ffffff"
                  opacity="0.85"
                  transform="rotate(-15)"
                />
              </g>
            </g>
          );
        })}

        {/* =========================================================================
            CHẾ ĐỘ TỰ BẮT (ĐÀO VÀNG): TIA NGẮM LASER & ĐẦU LƯỠI LẮC LƯ QUA LẠI
            ========================================================================= */}
        {gameMode === 'manual' && frogs.length > 0 && frogs[0].phase === 'idle' && !frogs[0].isChewing && (
          <g key="manual-aiming-pendulum">
            {(() => {
              const frog = frogs[0];
              const mouthX = frog.x;
              const mouthY = frog.y - mouthYOffset;
              const angle = frog.aimAngle ?? 0;
              const dirX = Math.sin(angle);
              const dirY = -Math.cos(angle);
              const beamLen = 320;
              const tipX = mouthX + dirX * beamLen;
              const tipY = mouthY + dirY * beamLen;

              // Đầu lưỡi ngắn đung đưa như móc câu đào vàng
              const hookLen = 32;
              const hookX = mouthX + dirX * hookLen;
              const hookY = mouthY + dirY * hookLen;
              const tipAngleDeg = (angle * 180) / Math.PI;

              return (
                <>
                  {/* Tia laser ngắm đứt quãng */}
                  <line
                    x1={mouthX}
                    y1={mouthY}
                    x2={tipX}
                    y2={tipY}
                    stroke="#f43f5e"
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                    opacity="0.65"
                  />

                  {/* Vệt hào quang mờ theo tia ngắm */}
                  <line
                    x1={mouthX}
                    y1={mouthY}
                    x2={tipX}
                    y2={tipY}
                    stroke="#fda4af"
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity="0.2"
                  />

                  {/* Tâm ngắm tròn ở đầu tia */}
                  <g transform={`translate(${tipX}, ${tipY})`}>
                    <circle cx="0" cy="0" r="12" fill="none" stroke="#f43f5e" strokeWidth="1.8" opacity="0.8" />
                    <circle cx="0" cy="0" r="3" fill="#f43f5e" opacity="0.9" />
                    <line x1="-16" y1="0" x2="16" y2="0" stroke="#f43f5e" strokeWidth="1.5" opacity="0.8" />
                    <line x1="0" y1="-16" x2="0" y2="16" stroke="#f43f5e" strokeWidth="1.5" opacity="0.8" />
                  </g>

                  {/* Đoạn cuống lưỡi thịt ngắn đang lắc lư */}
                  <path
                    d={`M ${mouthX} ${mouthY} L ${hookX} ${hookY}`}
                    stroke="url(#realTongueFlesh)"
                    strokeWidth="11"
                    strokeLinecap="round"
                  />
                  <path
                    d={`M ${mouthX} ${mouthY - 1} L ${hookX} ${hookY - 1}`}
                    stroke="#ff80ab"
                    strokeWidth="4"
                    strokeLinecap="round"
                    opacity="0.8"
                  />

                  {/* Đầu mút lưỡi có giọt dính và điểm sáng bóng */}
                  <g transform={`translate(${hookX}, ${hookY}) rotate(${tipAngleDeg})`}>
                    <ellipse
                      cx="0"
                      cy="0"
                      rx={12}
                      ry={9}
                      fill="url(#stickyBulbGradient)"
                      stroke="#880e4f"
                      strokeWidth="1.8"
                    />
                    <circle cx="-2" cy="-2.5" r="3.2" fill="#ffffff" opacity="0.85" />
                    <circle cx="2" cy="1.5" r="1.5" fill="#ffffff" opacity="0.6" />
                  </g>
                </>
              );
            })()}
          </g>
        )}
      </svg>

      {/* Floating Helper Banner in Manual Mode */}
      {gameMode === 'manual' && frogs.length > 0 && frogs[0].phase === 'idle' && !frogs[0].isChewing && (
        <div className="absolute top-18 left-1/2 -translate-x-1/2 z-35 pointer-events-none flex flex-col items-center animate-bounce">
          <div className="bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500 text-white font-black text-xs md:text-sm px-4 py-2 rounded-full shadow-xl border-2 border-white flex items-center gap-2 whitespace-nowrap">
            <span className="text-base">🎯</span>
            <span>Click vào hồ nước hoặc bấm phím Space để phóng lưỡi bắt bọ!</span>
          </div>
        </div>
      )}
    </div>
  );
};
