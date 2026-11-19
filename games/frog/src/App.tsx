import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SpeedLevel, Student, Bug, FrogState, GameMode } from './types';
import { Arena } from './components/Arena';
import { Sidebar } from './components/Sidebar';
import { HeaderBar } from './components/HeaderBar';
import { soundManager } from './utils/audio';

// Helper to calculate shortest distance from point (px, py) to line segment (x1, y1)-(x2, y2)
function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

const FLY_COLORS = [
  '#0284c7', // metallic sky
  '#059669', // metallic emerald
  '#d97706', // amber
  '#db2777', // pink
  '#7c3aed', // purple
  '#2563eb', // royal blue
  '#ea580c', // orange
  '#0d9488', // teal
  '#e11d48', // rose
  '#4f46e5', // indigo
];

const SPEED_CONFIG: Record<
  SpeedLevel,
  {
    shootSpeed: number;
    retractSpeed: number;
    chewDurationMs: number;
    waveDelayMs: number;
    flySpeedMultiplier: number;
    wingFlutterMultiplier: number;
  }
> = {
  slow: {
    shootSpeed: 0.85,
    retractSpeed: 0.8,
    chewDurationMs: 1500,
    waveDelayMs: 2500,
    flySpeedMultiplier: 0.4,
    wingFlutterMultiplier: 0.45,
  },
  normal: {
    shootSpeed: 1.4,
    retractSpeed: 1.3,
    chewDurationMs: 900,
    waveDelayMs: 1600,
    flySpeedMultiplier: 0.6,
    wingFlutterMultiplier: 0.65,
  },
  fast: {
    shootSpeed: 2.3,
    retractSpeed: 2.1,
    chewDurationMs: 500,
    waveDelayMs: 950,
    flySpeedMultiplier: 0.8,
    wingFlutterMultiplier: 0.85,
  },
  turbo: {
    shootSpeed: 3.6,
    retractSpeed: 3.2,
    chewDurationMs: 300,
    waveDelayMs: 550,
    flySpeedMultiplier: 1.05,
    wingFlutterMultiplier: 1.05,
  },
};

// Helper to generate numbered default student list
const generateDefaultStudents = (count: number): Student[] => {
  const list: Student[] = [];
  for (let i = 1; i <= count; i++) {
    list.push({
      id: i,
      number: i,
      name: `Số ${i}`,
      isAbsent: false,
      hasAnswered: false,
    });
  }
  return list;
};

export default function App() {
  // Game Configuration State
  const [studentCount, setStudentCount] = useState<number>(40);
  const [students, setStudents] = useState<Student[]>(() => generateDefaultStudents(40));
  const [winnerCount, setWinnerCount] = useState<number>(1);
  const [speed, setSpeed] = useState<SpeedLevel>('normal');
  const [frogCount, setFrogCount] = useState<number>(2);
  const [gameMode, setGameMode] = useState<GameMode>('auto');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Authoritative speed & gameMode refs for real-time responsiveness without stale closures
  const speedRef = useRef<SpeedLevel>(speed);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const gameModeRef = useRef<GameMode>(gameMode);
  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  const manualAngleRef = useRef<number>(0);

  // Runtime Game State (for React rendering)
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [frogs, setFrogs] = useState<FrogState[]>([]);
  const [winners, setWinners] = useState<Student[] | null>(null);
  const [classRosterLoaded, setClassRosterLoaded] = useState(false);

  // The host app supplies the selected classroom after the game frame is ready.
  useEffect(() => {
    if (window.parent === window) return;
    const receiveRoster = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      if (event.data?.type !== 'goi-ten:roster' || !Array.isArray(event.data.students)) return;
      const names = event.data.students.filter((name: unknown): name is string => typeof name === 'string' && name.trim().length > 0).map((name: string) => name.trim().slice(0, 100));
      setStudents(names.map((name: string, index: number) => ({ id: index + 1, number: index + 1, name, isAbsent: false, hasAnswered: false })));
      setClassRosterLoaded(true);
      setStudentCount(names.length);
      setWinnerCount(1);
      setIsPlaying(false);
      setWinners(null);
    };
    window.addEventListener('message', receiveRoster);
    window.parent.postMessage({ type: 'goi-ten:ready' }, window.location.origin);
    return () => window.removeEventListener('message', receiveRoster);
  }, []);

  // Authoritative refs for high-performance 60fps game loop without stale closures
  const bugsRef = useRef<Bug[]>([]);
  const frogsRef = useRef<FrogState[]>([]);
  const arenaContainerRef = useRef<HTMLDivElement>(null);
  const arenaBoundsRef = useRef<{ width: number; height: number }>({ width: 900, height: 700 });
  const animFrameRef = useRef<number | null>(null);
  const lastWaveTimeRef = useRef<number>(0);

  // Handle changing student count from UI input
  const handleStudentCountChange = (count: number) => {
    setStudentCount(count);
    setStudents(generateDefaultStudents(count));
  };

  // Recalculate frog positions to keep center lotus leaf completely unobstructed
  const recalculateFrogPositions = useCallback((width: number, height: number, count: number, mode?: GameMode) => {
    const activeMode = mode !== undefined ? mode : gameModeRef.current;
    const frogY = height - 55;
    const newFrogs: FrogState[] = [];

    if (activeMode === 'manual') {
      // Chế độ tự bắt (Đào vàng): Duy nhất 1 chú ếch ở chính giữa sân khấu
      newFrogs.push({
        index: 0,
        x: width * 0.5,
        y: frogY,
        mouthOpen: false,
        isChewing: false,
        chewTimer: 0,
        tongueActive: false,
        tongueProgress: 0,
        tongueTargetX: 0,
        tongueTargetY: 0,
        targetBugId: null,
        phase: 'idle',
        blinkTimer: 90,
        isBlinking: false,
        aimAngle: 0,
      });
    } else if (count === 1) {
      // 1 frog on the left, lotus leaf at center
      newFrogs.push({
        index: 0,
        x: width * 0.25,
        y: frogY,
        mouthOpen: false,
        isChewing: false,
        chewTimer: 0,
        tongueActive: false,
        tongueProgress: 0,
        tongueTargetX: 0,
        tongueTargetY: 0,
        targetBugId: null,
        phase: 'idle',
        blinkTimer: 80,
        isBlinking: false,
      });
    } else if (count === 2) {
      // 2 frogs: left and right, center open for lotus leaf
      newFrogs.push({
        index: 0,
        x: width * 0.22,
        y: frogY,
        mouthOpen: false,
        isChewing: false,
        chewTimer: 0,
        tongueActive: false,
        tongueProgress: 0,
        tongueTargetX: 0,
        tongueTargetY: 0,
        targetBugId: null,
        phase: 'idle',
        blinkTimer: 80,
        isBlinking: false,
      });
      newFrogs.push({
        index: 1,
        x: width * 0.78,
        y: frogY,
        mouthOpen: false,
        isChewing: false,
        chewTimer: 0,
        tongueActive: false,
        tongueProgress: 0,
        tongueTargetX: 0,
        tongueTargetY: 0,
        targetBugId: null,
        phase: 'idle',
        blinkTimer: 115,
        isBlinking: false,
      });
    } else {
      // 3 or more frogs: spread evenly on left and right wings around center lotus leaf
      const leftCount = Math.ceil(count / 2);
      const rightCount = count - leftCount;

      for (let i = 0; i < leftCount; i++) {
        const x = leftCount === 1
          ? width * 0.2
          : width * (0.09 + (0.24 / (leftCount - 1)) * i);
        newFrogs.push({
          index: i,
          x,
          y: frogY,
          mouthOpen: false,
          isChewing: false,
          chewTimer: 0,
          tongueActive: false,
          tongueProgress: 0,
          tongueTargetX: 0,
          tongueTargetY: 0,
          targetBugId: null,
          phase: 'idle',
          blinkTimer: 80 + i * 25,
          isBlinking: false,
        });
      }

      for (let j = 0; j < rightCount; j++) {
        const x = rightCount === 1
          ? width * 0.8
          : width * (0.67 + (0.24 / (rightCount - 1)) * j);
        newFrogs.push({
          index: leftCount + j,
          x,
          y: frogY,
          mouthOpen: false,
          isChewing: false,
          chewTimer: 0,
          tongueActive: false,
          tongueProgress: 0,
          tongueTargetX: 0,
          tongueTargetY: 0,
          targetBugId: null,
          phase: 'idle',
          blinkTimer: 90 + j * 25,
          isBlinking: false,
        });
      }
    }

    frogsRef.current = newFrogs;
    setFrogs(newFrogs);
  }, []);

  // Update arena size using ResizeObserver on the Arena container
  useEffect(() => {
    const el = arenaContainerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          arenaBoundsRef.current = { width, height };
          recalculateFrogPositions(width, height, frogCount);
        }
      }
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [frogCount, recalculateFrogPositions]);

  // Switch game mode and automatically reset to initial state
  const handleGameModeChange = useCallback((newMode: GameMode) => {
    setGameMode(newMode);
    gameModeRef.current = newMode;
    if (newMode === 'manual') {
      setSpeed('slow');
      speedRef.current = 'slow';
    }

    // Tự reset lại ban đầu khi chuyển chế độ
    setStudents((prev) => prev.map((s) => ({ ...s, hasAnswered: false })));
    setWinners(null);
    lastWaveTimeRef.current = 0;

    const { width, height } = arenaBoundsRef.current;
    recalculateFrogPositions(width, height, frogCount, newMode);

    // Reset tất cả các chú ruồi mới hoàn toàn
    const activeStudents = students.map((s) => ({ ...s, hasAnswered: false }));
    const safeW = Math.max(width - 80, 300);
    const safeH = Math.max(height - 240, 260);

    const initialBugs: Bug[] = activeStudents
      .filter((s) => !s.isAbsent)
      .map((s, index) => {
        const angle = Math.random() * Math.PI * 2;
        const flySpeed = 0.9 + Math.random() * 1.4;
        return {
          id: s.id,
          number: s.number,
          name: s.name,
          x: 40 + Math.random() * (safeW - 80),
          y: 75 + Math.random() * (safeH - 95),
          vx: Math.cos(angle) * flySpeed,
          vy: Math.sin(angle) * flySpeed,
          baseRadius: 18,
          color: FLY_COLORS[index % FLY_COLORS.length],
          wingAngle: 0,
          wingSpeed: 0.35 + Math.random() * 0.2,
          isAlive: true,
          state: 'flying',
          caughtProgress: 0,
          targetFrogIndex: -1,
        };
      });

    for (let i = initialBugs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [initialBugs[i], initialBugs[j]] = [initialBugs[j], initialBugs[i]];
    }

    bugsRef.current = initialBugs;
    setBugs(initialBugs);
    setIsPlaying(newMode === 'manual');
  }, [students, frogCount, recalculateFrogPositions]);

  // Trigger manual shoot (Gold Miner hook style)
  const triggerManualShoot = useCallback(() => {
    if (gameModeRef.current !== 'manual') return;
    const currentFrogs = frogsRef.current;
    if (currentFrogs.length === 0) return;
    const frog = currentFrogs[0];
    if (frog.phase !== 'idle' || frog.isChewing) return;

    const currentBugs = bugsRef.current;
    const flyingFlies = currentBugs.filter((b) => b.isAlive && b.state === 'flying');
    if (flyingFlies.length === 0) return;

    // Start flying if paused
    setIsPlaying(true);

    const { width, height } = arenaBoundsRef.current;
    const frogSize = Math.max(95, Math.min(185, Math.floor(880 / Math.max(currentFrogs.length, 1))));
    const mouthOffset = Math.round(frogSize * 0.19);
    const mouthX = frog.x;
    const mouthY = frog.y - mouthOffset;

    const angle = manualAngleRef.current;
    const dirX = Math.sin(angle);
    const dirY = -Math.cos(angle);

    const minX = 40;
    const maxX = Math.max(width - 40, 320);
    const minY = 65;

    let maxDist = (mouthY - minY) / Math.max(0.08, Math.cos(angle));
    if (dirX > 0) {
      maxDist = Math.min(maxDist, (maxX - mouthX) / dirX);
    } else if (dirX < 0) {
      maxDist = Math.min(maxDist, (minX - mouthX) / Math.abs(dirX));
    }
    if (maxDist <= 0 || !isFinite(maxDist)) maxDist = height * 0.9;

    const targetX = mouthX + dirX * maxDist;
    const targetY = mouthY + dirY * maxDist;

    frog.phase = 'shooting';
    frog.tongueActive = true;
    frog.mouthOpen = true;
    frog.tongueProgress = 0;
    frog.tongueTargetX = targetX;
    frog.tongueTargetY = targetY;
    frog.targetBugId = null;

    soundManager.playTongueShoot();
    soundManager.playCroak(1.0);
  }, []);

  // Listen for Spacebar to trigger shoot in manual mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        if (gameModeRef.current === 'manual') {
          triggerManualShoot();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerManualShoot]);

  // Reset Flies based on active students (neither absent nor already answered)
  const resetBugs = useCallback(() => {
    const { width, height } = arenaBoundsRef.current;
    const activeStudents = students.filter((s) => !s.isAbsent && !s.hasAnswered);

    const safeW = Math.max(width - 80, 300);
    const safeH = Math.max(height - 240, 260);

    const initialBugs: Bug[] = activeStudents.map((s, index) => {
      const angle = Math.random() * Math.PI * 2;
      const flySpeed = 0.9 + Math.random() * 1.4;
      return {
        id: s.id,
        number: s.number,
        name: s.name,
        x: 40 + Math.random() * (safeW - 80),
        y: 75 + Math.random() * (safeH - 95),
        vx: Math.cos(angle) * flySpeed,
        vy: Math.sin(angle) * flySpeed,
        baseRadius: 18,
        color: FLY_COLORS[index % FLY_COLORS.length],
        wingAngle: 0,
        wingSpeed: 0.35 + Math.random() * 0.2, // fast fly wing flutter
        isAlive: true,
        state: 'flying',
        caughtProgress: 0,
        targetFrogIndex: -1,
      };
    });

    // Shuffle the initial bugs array with Fisher-Yates so internal array order is completely unbiased
    for (let i = initialBugs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [initialBugs[i], initialBugs[j]] = [initialBugs[j], initialBugs[i]];
    }

    bugsRef.current = initialBugs;
    setBugs(initialBugs);
    setWinners(null);
    setIsPlaying(gameModeRef.current === 'manual');
    lastWaveTimeRef.current = 0;

    const { width: w, height: h } = arenaBoundsRef.current;
    recalculateFrogPositions(w, h, frogCount, gameModeRef.current);
  }, [students, frogCount, recalculateFrogPositions]);

  // Automatically reset bugs when students list changes
  useEffect(() => {
    resetBugs();
  }, [students, resetBugs]);

  // Sound mute toggle
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    soundManager.setMuted(nextMuted);
  };

  // Toggle student absent or toggle answered back to ready
  const handleToggleAbsent = (id: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (s.hasAnswered) {
          return { ...s, hasAnswered: false };
        }
        return { ...s, isAbsent: !s.isAbsent };
      })
    );
  };

  // Handle custom student names update
  const handleUpdateStudentsList = (newList: Student[]) => {
    setStudents(newList);
    setStudentCount(newList.length);
  };

  // Start game
  const handleStart = () => {
    const active = students.filter((s) => !s.isAbsent && !s.hasAnswered);
    const activeAliveBugs = bugsRef.current.filter((b) => b.isAlive && b.state !== 'eaten');

    // If previous game already reached winner state or no bugs left, reset round automatically
    if (winners !== null || activeAliveBugs.length <= winnerCount) {
      if (active.length <= winnerCount) {
        const presentCount = students.filter((s) => !s.isAbsent).length;
        if (presentCount > winnerCount) {
          setStudents((prev) => prev.map((s) => ({ ...s, hasAnswered: false })));
        }
      }
      resetBugs();
    }

    setIsPlaying(true);
    lastWaveTimeRef.current = performance.now() - (SPEED_CONFIG[speedRef.current]?.waveDelayMs || 1600) + 500;
    soundManager.playCroak(1.0);
  };

  // Pause game
  const handlePause = () => {
    setIsPlaying(false);
  };

  // Reset game: reset answered students back to ready
  const handleReset = () => {
    setStudents((prev) => prev.map((s) => ({ ...s, hasAnswered: false })));
    setWinners(null);
    setIsPlaying(false);
    resetBugs();
  };

  // Mark winners as answered and advance to next round
  const handleExcludeAndContinue = (winnerIds: number[]) => {
    setStudents((prev) =>
      prev.map((s) => (winnerIds.includes(s.id) ? { ...s, hasAnswered: true } : s))
    );
    setWinners(null);
  };

  // AUTHORITATIVE 60FPS GAME LOOP (ZERO LAG, ZERO STALE CLOSURES)
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const { width, height } = arenaBoundsRef.current;
      const minX = 40;
      const maxX = Math.max(width - 40, 320);
      const minY = 65;
      const maxY = height - 210;

      const currentBugs = bugsRef.current;
      const currentFrogs = frogsRef.current;

      const frogSize = Math.max(95, Math.min(185, Math.floor(880 / Math.max(currentFrogs.length, 1))));
      const mouthOffset = Math.round(frogSize * 0.19);

      // Get dynamic speed parameters based on currently selected speed option
      const config = SPEED_CONFIG[speedRef.current] || SPEED_CONFIG.normal;

      // 1. UPDATE FLY FLIGHT & WING OSCILLATION
      for (let i = 0; i < currentBugs.length; i++) {
        const fly = currentBugs[i];
        if (!fly.isAlive || fly.state === 'eaten') continue;

        // If this fly is the winner on the lotus leaf, gentle resting flutter
        if (fly.state === 'on_leaf_winner') {
          fly.wingAngle = Math.sin(currentTime * 0.005) * 12; // gentle resting wing flutter
          continue;
        }

        // Rapid wing fluttering scaled by speed option
        fly.wingAngle = Math.sin(currentTime * fly.wingSpeed * 0.25 * config.wingFlutterMultiplier) * 45;

        // Flying physics (if not caught)
        if (fly.state !== 'caught') {
          let nx = fly.x + fly.vx * (dt * 60) * config.flySpeedMultiplier;
          let ny = fly.y + fly.vy * (dt * 60) * config.flySpeedMultiplier;
          let nvx = fly.vx;
          let nvy = fly.vy;

          // Random gentle drift impulses characteristic of flies
          if (Math.random() < 0.04) {
            nvx += (Math.random() - 0.5) * 0.5;
            nvy += (Math.random() - 0.5) * 0.5;
            const spd = Math.hypot(nvx, nvy);
            const maxSpd = 3.2 * config.flySpeedMultiplier;
            if (spd > maxSpd) {
              nvx = (nvx / spd) * maxSpd;
              nvy = (nvy / spd) * maxSpd;
            }
          }

          // Bouncing off arena bounds
          if (nx < minX) {
            nx = minX;
            nvx = Math.abs(nvx);
          } else if (nx > maxX) {
            nx = maxX;
            nvx = -Math.abs(nvx);
          }

          if (ny < minY) {
            ny = minY;
            nvy = Math.abs(nvy);
          } else if (ny > maxY) {
            ny = maxY;
            nvy = -Math.abs(nvy);
          }

          fly.x = nx;
          fly.y = ny;
          fly.vx = nvx;
          fly.vy = nvy;
        }
      }

      // 2. UPDATE FROGS & TONGUE EXTENSION / RETRACTION
      // 2. UPDATE FROGS & TONGUE EXTENSION / RETRACTION
      // In manual mode: update pendulum angle while idle
      if (gameModeRef.current === 'manual') {
        const swingSpeed = 1.9 * (config.flySpeedMultiplier / 0.6);
        const maxAngle = (60 * Math.PI) / 180;
        const curAngle = Math.sin((currentTime * 0.001) * swingSpeed) * maxAngle;
        manualAngleRef.current = curAngle;
        if (currentFrogs.length > 0 && currentFrogs[0].phase === 'idle') {
          currentFrogs[0].aimAngle = curAngle;
        }
      }

      for (let f = 0; f < currentFrogs.length; f++) {
        const frog = currentFrogs[f];

        // Eye blink simulation
        frog.blinkTimer -= 1;
        if (frog.blinkTimer <= 0) {
          frog.isBlinking = !frog.isBlinking;
          frog.blinkTimer = frog.isBlinking ? 12 : 120 + Math.random() * 180;
        }

        // Chewing phase
        if (frog.phase === 'chewing') {
          frog.chewTimer -= dt * 1000;
          if (frog.chewTimer <= 0) {
            frog.phase = 'idle';
            frog.isChewing = false;
            frog.mouthOpen = false;
          }
        }

        // Shooting phase
        if (frog.phase === 'shooting') {
          if (gameModeRef.current === 'manual') {
            // Chế độ tự bắt (Đào vàng): Quét va chạm chính xác theo từng bước di chuyển của đầu lưỡi (Swept Capsule)
            // Khắc phục hoàn toàn lỗi bắt nhầm con phía sau và không bắt con đã chạm vào
            const prevProgress = frog.tongueProgress;
            frog.tongueProgress += dt * config.shootSpeed * 1.8;
            if (frog.tongueProgress > 1) frog.tongueProgress = 1;

            const mouthX = frog.x;
            const mouthY = frog.y - mouthOffset;
            const prevTipX = mouthX + (frog.tongueTargetX - mouthX) * prevProgress;
            const prevTipY = mouthY + (frog.tongueTargetY - mouthY) * prevProgress;
            const curTipX = mouthX + (frog.tongueTargetX - mouthX) * frog.tongueProgress;
            const curTipY = mouthY + (frog.tongueTargetY - mouthY) * frog.tongueProgress;

            const dirBeamX = frog.tongueTargetX - mouthX;
            const dirBeamY = frog.tongueTargetY - mouthY;
            const beamLength = Math.hypot(dirBeamX, dirBeamY) || 1;
            const unitDirX = dirBeamX / beamLength;
            const unitDirY = dirBeamY / beamLength;

            const flyingFlies = currentBugs.filter((b) => b.isAlive && b.state === 'flying');
            let hitFly: Bug | null = null;
            let minDistanceAlongTongue = Infinity;

            for (const fly of flyingFlies) {
              // Đo khoảng cách từ tâm ruồi đến đoạn quét của đầu lưỡi từ prevTip đến curTip
              const dist = distToSegment(fly.x, fly.y, prevTipX, prevTipY, curTipX, curTipY);
              // Hitbox: bán kính đầu lưỡi + bán kính ruồi = 40px
              if (dist <= 40) {
                // Tính khoảng cách từ miệng ếch dọc theo hướng tia bắn:
                // Con ruồi gần miệng ếch nhất dọc theo tia bắn là con va chạm ĐẦU TIÊN
                const distAlongTongue = (fly.x - mouthX) * unitDirX + (fly.y - mouthY) * unitDirY;
                if (distAlongTongue < minDistanceAlongTongue) {
                  minDistanceAlongTongue = distAlongTongue;
                  hitFly = fly;
                }
              }
            }

            if (hitFly) {
              soundManager.playCatch();
              frog.targetBugId = hitFly.id;
              // Khóa vị trí đầu lưỡi chính xác vào con ruồi bị bắt và gán progress = 1.0 để rút về mượt mà
              frog.tongueTargetX = hitFly.x;
              frog.tongueTargetY = hitFly.y;
              frog.tongueProgress = 1.0;
              hitFly.state = 'caught';
              hitFly.targetFrogIndex = frog.index;
              frog.phase = 'retracting';
            } else if (frog.tongueProgress >= 1) {
              // Phóng trượt, chạm viền sân khấu -> thu lưỡi về
              frog.tongueProgress = 1.0;
              frog.phase = 'retracting';
            }
          } else {
            // Chế độ mặc định: Khóa mục tiêu chuẩn xác vào chú ruồi được nhắm
            if (frog.targetBugId !== null) {
              const target = currentBugs.find((b) => b.id === frog.targetBugId);
              if (target) {
                frog.tongueTargetX = target.x;
                frog.tongueTargetY = target.y;
              }
            }

            frog.tongueProgress += dt * config.shootSpeed;

            if (frog.tongueProgress >= 1) {
              frog.tongueProgress = 1;
              frog.phase = 'retracting';

              // Bug is caught
              soundManager.playCatch();

              if (frog.targetBugId !== null) {
                const target = currentBugs.find((b) => b.id === frog.targetBugId);
                if (target) {
                  target.state = 'caught';
                  target.targetFrogIndex = frog.index;
                }
              }
            }
          }
        }

        // Retracting phase: pull the fly into mouth
        if (frog.phase === 'retracting') {
          frog.tongueProgress -= dt * config.retractSpeed * (gameModeRef.current === 'manual' ? 1.6 : 1.0);

          // Pull the caught fly along with tongue tip
          if (frog.targetBugId !== null) {
            const target = currentBugs.find((b) => b.id === frog.targetBugId);
            if (target) {
              const mouthX = frog.x;
              const mouthY = frog.y - mouthOffset;
              target.x = mouthX + (frog.tongueTargetX - mouthX) * frog.tongueProgress;
              target.y = mouthY + (frog.tongueTargetY - mouthY) * frog.tongueProgress;
            }
          }

          // Tongue reached mouth: swallow and process winner/elimination
          if (frog.tongueProgress <= 0) {
            frog.tongueProgress = 0;
            frog.tongueActive = false;
            frog.phase = 'chewing';
            frog.isChewing = true;
            frog.mouthOpen = false;
            frog.chewTimer = config.chewDurationMs;

            if (frog.targetBugId !== null) {
              soundManager.playChewGulp();

              if (gameModeRef.current === 'manual') {
                // Ở chế độ tự bắt: Chú ruồi bắt được sẽ được đưa vào đóa sen như bạn được chọn!
                const target = currentBugs.find((b) => b.id === frog.targetBugId);
                if (target) {
                  target.state = 'on_leaf_winner';
                  const leafCenterX = Math.min(width * 0.76, width - 140);
                  const leafCenterY = height - 90;

                  // Tính thứ tự bắt (caughtOrder) cho chú ruồi mới
                  const currentWinners = currentBugs.filter((b) => b.state === 'on_leaf_winner');
                  target.caughtOrder = currentWinners.length;

                  // Sắp xếp lại vị trí TẤT CẢ các chú ruồi trên đóa sen cạnh nhau, không đè lên nhau
                  const leafFlies = currentBugs.filter((b) => b.state === 'on_leaf_winner');
                  leafFlies.sort((a, b) => (a.caughtOrder ?? 0) - (b.caughtOrder ?? 0));
                  const totalWinners = leafFlies.length;
                  const spacing = Math.min(48, 160 / Math.max(totalWinners, 1));

                  leafFlies.forEach((w, idx) => {
                    const offsetX = (idx - (totalWinners - 1) / 2) * spacing;
                    w.targetLeafX = leafCenterX + offsetX;
                    w.targetLeafY = leafCenterY;
                    w.x = w.targetLeafX;
                    w.y = w.targetLeafY;
                    w.vx = 0;
                    w.vy = 0;
                  });

                  const winningStudent = students.find((s) => s.id === target.id);
                  if (winningStudent) {
                    setWinners((prev) => (prev ? [...prev, winningStudent] : [winningStudent]));
                    soundManager.playFanfare();
                  }
                }
              } else {
                // Ở chế độ mặc định: Chú ruồi bị loại bỏ
                const target = currentBugs.find((b) => b.id === frog.targetBugId);
                if (target) {
                  target.isAlive = false;
                  target.state = 'eaten';
                }
              }
              frog.targetBugId = null;
            }
          }
        }
      }

      // 3. HUNTING COORDINATION: TẤT CẢ CÁC CHÚ ẾCH ĐỚP CÙNG 1 LẦN (CHẾ ĐỘ MẶC ĐỊNH)
      if (isPlaying && gameModeRef.current === 'auto') {
        // Kiểm tra xem tất cả các chú ếch đã sẵn sàng chưa (không chú nào đang bận đớp/nhai)
        const allFrogsReady = currentFrogs.every((f) => f.phase === 'idle' && !f.isChewing);
        const aliveFlies = currentBugs.filter((b) => b.isAlive && b.state !== 'eaten');

        // Khi số lượng ruồi còn sống đạt đúng số bạn cần chọn -> Hoàn thành!
        if (allFrogsReady && aliveFlies.length <= winnerCount && aliveFlies.length > 0) {
          setIsPlaying(false);
          const winningStudents = students.filter((s) =>
            aliveFlies.some((b) => b.id === s.id)
          );
          setWinners(winningStudents);
          soundManager.playFanfare();

          const leafCenterX = width * 0.5;
          const leafCenterY = height - 90;

          aliveFlies.forEach((w, idx) => {
            w.state = 'on_leaf_winner';
            w.targetLeafX = leafCenterX + (idx - (aliveFlies.length - 1) / 2) * 55;
            w.targetLeafY = leafCenterY;
            w.x = w.targetLeafX;
            w.y = w.targetLeafY;
            w.vx = 0;
            w.vy = 0;
          });
        } else if (allFrogsReady) {
          // Khi tất cả ếch đều đang rảnh và sẵn sàng cho đợt đớp đồng loạt tiếp theo
          const now = currentTime;
          const delay = config.waveDelayMs;

          if (now - lastWaveTimeRef.current >= delay) {
            lastWaveTimeRef.current = now;

            const flyingFlies = currentBugs.filter((b) => b.isAlive && b.state === 'flying');
            const toEliminate = aliveFlies.length - winnerCount;

            if (toEliminate > 0 && flyingFlies.length > 0) {
              // TẤT CẢ CÁC CHÚ ẾCH CÙNG PHÓNG LƯỠI 1 LẦN
              const frogsToDispatch = Math.min(
                currentFrogs.length,
                toEliminate,
                flyingFlies.length
              );

              if (frogsToDispatch > 0) {
                // Thuật toán chọn ngẫu nhiên đồng đều tuyệt đối (Uniform Random Sampling Without Replacement)
                // Đảm bảo mọi con ruồi từ 1 đến N đều có xác suất bị nhắm hoàn toàn bằng nhau, loại bỏ 100% thiên vị vị trí
                const pool = [...flyingFlies];
                const targets: Bug[] = [];

                for (let i = 0; i < frogsToDispatch; i++) {
                  const randIdx = Math.floor(Math.random() * pool.length);
                  targets.push(pool[randIdx]);
                  // Swap với phần tử cuối và pop để chọn độc lập không lặp lại với xác suất toán học đồng nhất
                  pool[randIdx] = pool[pool.length - 1];
                  pool.pop();
                }

                soundManager.playTongueShoot();
                soundManager.playCroak(1.0);

                for (let i = 0; i < frogsToDispatch; i++) {
                  const frog = currentFrogs[i];
                  const fly = targets[i];

                  frog.phase = 'shooting';
                  frog.tongueActive = true;
                  frog.mouthOpen = true;
                  frog.tongueProgress = 0;
                  frog.tongueTargetX = fly.x;
                  frog.tongueTargetY = fly.y;
                  frog.targetBugId = fly.id;

                  fly.state = 'targeted';
                }
              }
            }
          }
        }
      }

      // 4. COMMIT STATE ONCE PER ANIMATION FRAME TO REACT
      setBugs([...currentBugs]);
      setFrogs([...currentFrogs]);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    isPlaying,
    winnerCount,
    students,
  ]);

  // Count flies currently in the arena (excluding eaten and on-leaf winners)
  const aliveCount = bugs.filter(
    (b) => b.isAlive && b.state !== 'eaten' && b.state !== 'on_leaf_winner'
  ).length;
  const totalStudentsCount = students.filter((s) => !s.isAbsent).length;

  return (
    <div className="relative w-screen h-screen overflow-hidden flex bg-emerald-950 font-sans select-none">
      {/* Main Game Stage Area */}
      <div ref={arenaContainerRef} className="relative flex-1 h-full overflow-hidden">
        {/* Top Banner & Quick Controls */}
        <HeaderBar
          aliveCount={aliveCount}
          totalCount={totalStudentsCount}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          gameMode={gameMode}
        />

        {/* Interactive Arena - Kết quả cuối cùng và Lá sen hiển thị trực tiếp trên sân khấu */}
        <Arena
          bugs={bugs}
          frogs={frogs}
          winners={winners}
          gameMode={gameMode}
          onArenaClick={triggerManualShoot}
        />
      </div>

      {/* Control Sidebar */}
      <Sidebar
        students={students}
        studentCount={studentCount}
        onStudentCountChange={handleStudentCountChange}
        winnerCount={winnerCount}
        onWinnerCountChange={setWinnerCount}
        speed={speed}
        onSpeedChange={setSpeed}
        frogCount={frogCount}
        onFrogCountChange={setFrogCount}
        gameMode={gameMode}
        onGameModeChange={handleGameModeChange}
        isPlaying={isPlaying}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onToggleAbsent={handleToggleAbsent}
        onUpdateStudentsList={handleUpdateStudentsList}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        winners={winners}
        onExcludeAndContinue={handleExcludeAndContinue}
        onManualShoot={triggerManualShoot}
        rosterLocked={classRosterLoaded}
      />
    </div>
  );
}
