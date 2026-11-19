import React, { useEffect, useRef } from 'react';
import { Student, GameStatus } from '../types';
import { soundManager } from '../utils/audio';
import { securePickOne, getSecureRandomFloat } from '../utils/random';

interface UfoCanvasProps {
  students: Student[];
  exemptedStudentIds: Set<string>;
  targetCount: number;
  gameStatus: GameStatus;
  onGameStatusChange: (status: GameStatus) => void;
  onAbductedStudents: (abducted: Student[]) => void;
  animationSpeed: number;
}

const SCHOOL_SPEECHES = [
  'Trống đánh vô lớp chưa bây ơi?',
  'Tí nữa kiểm tra 15 phút đó!',
  'Thầy ơi tha em, em chưa học bài!',
  'Xuống căn tin mua bánh tráng đi!',
  'Đang ngồi ghế đá ôn bài mà!',
  'Đĩa bay tới rồi kìa trốn lẹ!',
  'Em thuộc bài rồi mà thầy!',
  'Cứu tui với, tui chưa làm bài tập!',
  'Hôm nay trực nhật mà!',
  'Đừng tóm tui đĩa bay ơi!',
  'Bắn chớt! Tui quên tập ở nhà!',
  'Trời ơi, đừng gọi tên em!',
  'Ai cứu bé với!',
  'Chừa em ra đi UFO ơi!',
  'Sao lại là tui??',
];

export const UfoCanvas: React.FC<UfoCanvasProps> = ({
  students,
  exemptedStudentIds,
  targetCount,
  gameStatus,
  onGameStatusChange,
  onAbductedStudents,
  animationSpeed,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeoutIdsRef = useRef<number[]>([]);

  const safeSetTimeout = (fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay);
    timeoutIdsRef.current.push(id);
    return id;
  };

  const clearAllTimeouts = () => {
    timeoutIdsRef.current.forEach(clearTimeout);
    timeoutIdsRef.current = [];
  };

  // Simulation state
  const stateRef = useRef<{
    students: (Student & {
      walkCycle: number;
      blinkTimer: number;
      hairStyle: number;
      hasGlasses: boolean;
      shakeOffset: number;
      lane: number;
    })[];
    ufo: {
      x: number;
      y: number;
      targetX: number;
      targetY: number;
      width: number;
      height: number;
      tilt: number;
      beamIntensity: number;
      lightsPhase: number;
      hudCount: number;
      targetCount: number;
      state: 'hidden' | 'entering' | 'scanning' | 'locking' | 'abducting' | 'leaving';
      targetStudentId: string | null;
    };
    nightFactor: number;
    screenShake: number;
    abductedThisRound: Student[];
    particles: Array<{ x: number; y: number; vy: number; vx: number; size: number; alpha: number; color: string }>;
    petals: Array<{ x: number; y: number; vx: number; vy: number; rot: number; rotSpeed: number; size: number }>;
    birds: Array<{ x: number; y: number; vx: number }>;
    flagWave: number;
    rescueEvent: {
      targetId: string;
      rescuerId: string;
      stage: 'running' | 'holding' | 'lifted';
    } | null;
    rescueHappenedThisRound: boolean;
  }>({
    students: [],
    ufo: {
      x: 600,
      y: -160,
      targetX: 600,
      targetY: 125,
      width: 250,
      height: 80,
      tilt: 0,
      beamIntensity: 0,
      lightsPhase: 0,
      hudCount: 0,
      targetCount: targetCount,
      state: 'hidden',
      targetStudentId: null,
    },
    nightFactor: 0,
    screenShake: 0,
    abductedThisRound: [],
    particles: [],
    petals: Array.from({ length: 22 }, () => ({
      x: Math.random() * 1200,
      y: Math.random() * 450,
      vx: 0.5 + Math.random() * 1.2,
      vy: 0.8 + Math.random() * 1.0,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.05,
      size: 4 + Math.random() * 3,
    })),
    birds: [
      { x: 150, y: 78, vx: 0.4 },
      { x: 620, y: 79, vx: -0.3 },
      { x: 920, y: 78, vx: 0.2 },
    ],
    flagWave: 0,
    rescueEvent: null,
    rescueHappenedThisRound: false,
  });

  // Sync target count
  useEffect(() => {
    stateRef.current.ufo.targetCount = targetCount;
  }, [targetCount]);

  // Sync students list with rich cartoon attributes & lane depth
  useEffect(() => {
    const current = stateRef.current.students;
    const canvas = canvasRef.current;
    const width = canvas ? canvas.width / (window.devicePixelRatio || 1) : 1200;

    const initialized = students.map((s, idx) => {
      const existing = current.find((c) => c.id === s.id);
      const lane = s.lane !== undefined ? s.lane : idx % 4;
      if (existing) {
        return {
          ...existing,
          name: s.name,
          lane,
        };
      }

      const spacing = Math.max(28, (width - 120) / (students.length + 1));
      const posX = 60 + idx * spacing + (Math.random() * 20 - 10);
      return {
        ...s,
        lane,
        x: Math.max(40, Math.min(width - 40, posX)),
        y: 0,
        targetX: Math.random() * (width - 100) + 50,
        speed: (0.4 + Math.random() * 0.45) * (Math.random() > 0.5 ? 1 : -1),
        direction: (Math.random() > 0.5 ? 1 : -1) as (1 | -1),
        state: 'walking' as const,
        liftProgress: 0,
        walkCycle: Math.random() * Math.PI * 2,
        blinkTimer: Math.random() * 100,
        hairStyle: idx % 4,
        hasGlasses: idx % 5 === 0,
        shakeOffset: 0,
      };
    });

    stateRef.current.students = initialized;
  }, [students]);

  // Handle Game Status Transitions
  useEffect(() => {
    clearAllTimeouts();
    const ufo = stateRef.current.ufo;

    if (gameStatus === 'preparing' || gameStatus === 'hunting') {
      soundManager.startUfoHum();
      stateRef.current.abductedThisRound = [];
      stateRef.current.rescueEvent = null;
      stateRef.current.rescueHappenedThisRound = false;
      ufo.hudCount = 0;
      ufo.state = 'entering';
      ufo.targetY = 125;
      ufo.targetX = canvasRef.current ? canvasRef.current.width / (2 * (window.devicePixelRatio || 1)) : 600;
      ufo.targetStudentId = null;
      ufo.beamIntensity = 0;
      // Reset all students states to walking for the new hunt
      stateRef.current.students.forEach((s) => {
        s.state = 'walking';
        s.liftProgress = 0;
        s.holdingStudentId = null;
        s.shakeOffset = 0;
      });
    } else if (gameStatus === 'idle') {
      soundManager.stopUfoHum();
      ufo.state = 'hidden';
      ufo.y = -160;
      ufo.beamIntensity = 0;
      stateRef.current.nightFactor = 0;
      stateRef.current.screenShake = 0;
      stateRef.current.rescueEvent = null;
      stateRef.current.rescueHappenedThisRound = false;
      stateRef.current.students.forEach((s) => {
        s.state = 'walking';
        s.liftProgress = 0;
        s.holdingStudentId = null;
        s.shakeOffset = 0;
      });
    }
  }, [gameStatus]);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();
    let lastSpeechTick = Date.now();

    const render = (currentTime: number) => {
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      const ufo = stateRef.current.ufo;
      const speedMult = animationSpeed;
      const now = Date.now();

      // Screen shake decay
      if (stateRef.current.screenShake > 0) {
        stateRef.current.screenShake = Math.max(0, stateRef.current.screenShake - dt * 15);
      }
      const shakeX = (Math.random() - 0.5) * stateRef.current.screenShake * 8;
      const shakeY = (Math.random() - 0.5) * stateRef.current.screenShake * 8;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(shakeX, shakeY);

      // Night Lighting Factor
      if (ufo.state !== 'hidden') {
        stateRef.current.nightFactor = Math.min(1, stateRef.current.nightFactor + dt * 0.8 * speedMult);
      } else {
        stateRef.current.nightFactor = Math.max(0, stateRef.current.nightFactor - dt * 1.2 * speedMult);
      }
      const nf = stateRef.current.nightFactor;

      // 1. SKY & DISTANT MOUNTAINS
      ctx.clearRect(-10, -10, width + 20, height + 20);

      // Sky
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.65);
      if (nf > 0) {
        const r1 = Math.round(15 - nf * 5);
        const g1 = Math.round(23 - nf * 10);
        const b1 = Math.round(42 - nf * 15);
        const r2 = Math.round(30 - nf * 10);
        const g2 = Math.round(41 - nf * 10);
        const b2 = Math.round(89 - nf * 20);
        skyGrad.addColorStop(0, `rgb(${r1}, ${g1}, ${b1})`);
        skyGrad.addColorStop(1, `rgb(${r2}, ${g2}, ${b2})`);
      } else {
        skyGrad.addColorStop(0, '#48b3f2');
        skyGrad.addColorStop(0.35, '#7dd3fc');
        skyGrad.addColorStop(0.7, '#bae6fd');
        skyGrad.addColorStop(1, '#e0f2fe');
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Sun or Moon (Chibi style)
      if (nf < 0.6) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - nf * 1.5);
        const sunX = width - 110;
        const sunY = 60;
        // Soft outer sun halo
        const haloGrad = ctx.createRadialGradient(sunX, sunY, 12, sunX, sunY, 52);
        haloGrad.addColorStop(0, 'rgba(254, 240, 138, 0.7)');
        haloGrad.addColorStop(0.45, 'rgba(253, 224, 71, 0.28)');
        haloGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 52, 0, Math.PI * 2);
        ctx.fill();

        // Chibi sun body
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(sunX, sunY, 23, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Cute anime shine highlights
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(sunX - 7, sunY - 7, 4.5, 0, Math.PI * 2);
        ctx.arc(sunX - 1, sunY - 12, 2.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        // Moon (Night mode)
        ctx.save();
        ctx.globalAlpha = (nf - 0.5) * 2;
        const moonX = width - 110;
        const moonY = 55;
        ctx.fillStyle = '#fef08a';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(moonX - 8, moonY - 4, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Stars
      if (nf > 0.25) {
        ctx.save();
        for (let i = 0; i < 40; i++) {
          const sx = (i * 127.3) % width;
          const sy = (i * 79.1) % (height * 0.42);
          const twinkle = (Math.sin(currentTime * 0.005 + i) + 1) * 0.5;
          ctx.fillStyle = `rgba(255, 255, 255, ${nf * twinkle * 0.9})`;
          ctx.beginPath();
          ctx.arc(sx, sy, i % 3 === 0 ? 2 : 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // Soft Distant Hills
      ctx.save();
      const hillGrad = ctx.createLinearGradient(0, height * 0.36, 0, height * 0.52);
      hillGrad.addColorStop(0, nf > 0.4 ? 'rgba(30, 41, 59, 0.45)' : 'rgba(167, 243, 208, 0.65)');
      hillGrad.addColorStop(1, nf > 0.4 ? 'rgba(15, 23, 42, 0.6)' : 'rgba(110, 231, 183, 0.85)');
      ctx.fillStyle = hillGrad;
      ctx.beginPath();
      ctx.moveTo(0, height * 0.5);
      for (let m = 0; m <= width; m += 90) {
        const peakY = height * 0.41 + Math.sin(m * 0.015) * 18;
        ctx.quadraticCurveTo(m + 45, peakY, m + 90, height * 0.5);
      }
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Rounded lush background treetops peeking behind school roof
      if (nf < 0.6) {
        ctx.fillStyle = 'rgba(74, 222, 128, 0.55)';
        for (let tx = 15; tx < width; tx += 48) {
          const ty = height * 0.45 + Math.sin(tx * 0.04) * 8;
          ctx.beginPath();
          ctx.arc(tx, ty, 28, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // Fluffy Chibi Clouds (soft, round, marshmallow-like with pastel shading)
      ctx.save();
      [60, 360, 720, 1080].forEach((cx, idx) => {
        const cX = ((currentTime * 0.01 * (idx + 1) + cx) % (width + 260)) - 130;
        const cY = 48 + (idx % 2) * 22;
        const scale = 0.85 + (idx % 3) * 0.12;

        ctx.save();
        ctx.translate(cX, cY);
        ctx.scale(scale, scale);

        // Cloud subtle pastel shadow base
        ctx.fillStyle = nf > 0.4 ? 'rgba(51, 65, 85, 0.45)' : 'rgba(224, 242, 254, 0.9)';
        ctx.beginPath();
        ctx.roundRect(-42, 4, 84, 22, 11);
        ctx.fill();

        // Cloud fluffy white puffs
        ctx.fillStyle = nf > 0.4 ? 'rgba(71, 85, 105, 0.6)' : 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.arc(-22, 4, 18, 0, Math.PI * 2);
        ctx.arc(4, -6, 24, 0, Math.PI * 2);
        ctx.arc(26, 6, 16, 0, Math.PI * 2);
        ctx.roundRect(-36, 0, 72, 20, 10);
        ctx.fill();

        ctx.restore();
      });
      ctx.restore();

      const groundY = height - 195;

      // ==========================================
      // CHIBI SCHOOL BUILDING (Classic French-Colonial Vietnamese School)
      // ==========================================
      const bldgY = groundY - 215;
      const bldgH = 215;
      const bldgW = width;

      // School building main wall: warm pleasant cream yellow
      ctx.fillStyle = nf > 0.3 ? '#854d0e' : '#fef3c7';
      ctx.fillRect(0, bldgY, bldgW, bldgH);

      // Bottom stone plinth
      ctx.fillStyle = nf > 0.3 ? '#713f12' : '#fde68a';
      ctx.fillRect(0, groundY - 14, width, 14);

      // Fluted columns
      const colSpacing = width / 8;
      ctx.fillStyle = nf > 0.3 ? '#713f12' : '#fffbeb';
      for (let c = 0; c <= 8; c++) {
        const cx = c * colSpacing - 6;
        ctx.fillRect(cx, bldgY, 12, bldgH);
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(cx, bldgY, 12, bldgH);
      }

      // Classic Red Terracotta Tile Roof
      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(0, bldgY);
      ctx.lineTo(0, bldgY - 16);
      ctx.lineTo(width, bldgY - 16);
      ctx.lineTo(width, bldgY);
      ctx.closePath();
      ctx.fill();

      // Top roof rim & scalloped tile texture
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, bldgY - 16, width, 5);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      for (let rx = 10; rx < width; rx += 22) {
        ctx.beginPath();
        ctx.arc(rx, bldgY - 8, 5, 0, Math.PI);
        ctx.stroke();
      }

      // Triangular Pediment
      const pedW = 300;
      const pedX = width / 2 - pedW / 2;
      const pedPeakY = bldgY - 58;

      ctx.fillStyle = '#b91c1c';
      ctx.beginPath();
      ctx.moveTo(pedX, bldgY - 16);
      ctx.lineTo(width / 2, pedPeakY);
      ctx.lineTo(pedX + pedW, bldgY - 16);
      ctx.closePath();
      ctx.fill();

      // Golden decorative eaves
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Inner pediment panel
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(pedX + 16, bldgY - 16);
      ctx.lineTo(width / 2, pedPeakY + 12);
      ctx.lineTo(pedX + pedW - 16, bldgY - 16);
      ctx.closePath();
      ctx.fill();

      // School Clock (Cute, detailed dial pointing at 7:15)
      const clockX = width / 2;
      const clockY = pedPeakY + 28;
      // Golden outer bezel
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(clockX, clockY, 18, 0, Math.PI * 2);
      ctx.fill();
      // White dial face
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(clockX, clockY, 15, 0, Math.PI * 2);
      ctx.fill();
      // Hour tick dots
      ctx.fillStyle = '#0f172a';
      for (let h = 0; h < 12; h++) {
        const rad = (h * Math.PI) / 6;
        const tx = clockX + Math.cos(rad) * 11.5;
        const ty = clockY + Math.sin(rad) * 11.5;
        ctx.beginPath();
        ctx.arc(tx, ty, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // Clock hands (7:15)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(clockX, clockY);
      ctx.lineTo(clockX + 8, clockY); // Minute hand pointing at 3 (15 mins)
      ctx.stroke();
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(clockX, clockY);
      ctx.lineTo(clockX - 4, clockY + 6); // Hour hand pointing towards 7
      ctx.stroke();
      // Clock center cap
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.arc(clockX, clockY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Glass shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(clockX, clockY, 14, -Math.PI * 0.7, -Math.PI * 0.1);
      ctx.lineTo(clockX, clockY);
      ctx.closePath();
      ctx.fill();

      // Motto Banner (Crimson Lacquer with Gold Border)
      const bannerW = 320;
      const bannerH = 28;
      const bannerX = width / 2 - bannerW / 2;
      const bannerY = bldgY + 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 2;
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 8);
      ctx.fill();
      ctx.restore();

      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐ TIÊN HỌC LỄ · HẬU HỌC VĂN ⭐', width / 2, bannerY + bannerH / 2);

      // Classrooms (3 Storeys with French-Colonial Arched Windows & Balconies)
      const floorH = (bldgH - 32) / 3;
      for (let f = 0; f < 3; f++) {
        const fy = bldgY + 32 + f * floorH;

        // White floor cornice divider
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, fy + floorH - 12, width, 12);
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, fy + floorH - 12, width, 12);

        // Balcony decorative balustrades on floors 1 and 2
        if (f < 2) {
          ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
          ctx.lineWidth = 1.5;
          for (let bx = 6; bx < width; bx += 18) {
            ctx.beginPath();
            ctx.moveTo(bx, fy + floorH - 11);
            ctx.lineTo(bx, fy + floorH - 1);
            ctx.stroke();
          }
        }

        // Classroom windows
        for (let c = 0; c < 8; c++) {
          const winX = c * colSpacing + 14;
          const winW = colSpacing - 28;
          const winY = fy + 6;
          const winH = floorH - 22;

          if (winW > 18) {
            // White window surround
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.roundRect(winX - 2, winY - 2, winW + 4, winH + 4, [6, 6, 2, 2]);
            ctx.fill();

            // Glass reflection gradient
            const glassGrad = ctx.createLinearGradient(winX, winY, winX, winY + winH);
            glassGrad.addColorStop(0, nf > 0.3 ? '#fef08a' : '#bae6fd');
            glassGrad.addColorStop(1, nf > 0.3 ? '#facc15' : '#e0f2fe');
            ctx.fillStyle = glassGrad;
            ctx.beginPath();
            ctx.roundRect(winX, winY, winW, winH, [4, 4, 1, 1]);
            ctx.fill();

            // French green louvered shutters on sides
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.roundRect(winX - 5, winY, 6, winH, [2, 0, 0, 2]);
            ctx.roundRect(winX + winW - 1, winY, 6, winH, [0, 2, 2, 0]);
            ctx.fill();

            // Shutter slats
            ctx.strokeStyle = '#166534';
            ctx.lineWidth = 1;
            for (let sy = winY + 4; sy < winY + winH - 2; sy += 5) {
              ctx.beginPath();
              ctx.moveTo(winX - 5, sy);
              ctx.lineTo(winX + 1, sy);
              ctx.moveTo(winX + winW - 1, sy);
              ctx.lineTo(winX + winW + 5, sy);
              ctx.stroke();
            }

            // Window frame & mullions
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            // Vertical divider
            ctx.moveTo(winX + winW / 2, winY);
            ctx.lineTo(winX + winW / 2, winY + winH);
            // Horizontal divider
            ctx.moveTo(winX, winY + winH * 0.45);
            ctx.lineTo(winX + winW, winY + winH * 0.45);
            ctx.stroke();

            // Cute diagonal anime shine streak on glass
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.beginPath();
            ctx.moveTo(winX + 4, winY + 4);
            ctx.lineTo(winX + 12, winY + 4);
            ctx.lineTo(winX + 6, winY + winH - 4);
            ctx.lineTo(winX + 2, winY + winH - 4);
            ctx.closePath();
            ctx.fill();

            // Potted flower boxes on balcony rails
            if (f < 2 && c % 2 === 1) {
              const potX = winX + winW / 2 - 10;
              const potY = fy + floorH - 12;
              // Pot
              ctx.fillStyle = '#b45309';
              ctx.beginPath();
              ctx.roundRect(potX, potY, 20, 6, 2);
              ctx.fill();
              // Tiny flowers
              ctx.fillStyle = c % 4 === 1 ? '#f43f5e' : '#f59e0b';
              ctx.beginPath();
              ctx.arc(potX + 4, potY - 2, 3, 0, Math.PI * 2);
              ctx.arc(potX + 10, potY - 3, 3, 0, Math.PI * 2);
              ctx.arc(potX + 16, potY - 2, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Central Welcoming Entrance Archway on Ground Floor
      const archW = 48;
      const archH = 50;
      const archX = width / 2 - archW / 2;
      const archY = groundY - archH;
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.arc(width / 2, archY + archW / 2, archW / 2, Math.PI, 0);
      ctx.rect(archX, archY + archW / 2, archW, archH - archW / 2);
      ctx.fill();
      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Traditional Vietnamese School Drum (Trống Trường)
      const drumX = width / 2 - 95;
      const drumY = groundY - 34;
      // Carved wooden X-stand
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(drumX - 9, drumY + 30);
      ctx.lineTo(drumX + 2, drumY + 8);
      ctx.lineTo(drumX + 9, drumY + 30);
      ctx.moveTo(drumX + 9, drumY + 30);
      ctx.lineTo(drumX - 2, drumY + 8);
      ctx.lineTo(drumX - 9, drumY + 30);
      ctx.stroke();

      // Red lacquered drum barrel
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.ellipse(drumX, drumY + 6, 20, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Cowhide drum head with golden studs
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(drumX - 5, drumY + 6, 9, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // School Yard Ground (Clean, smooth pavement gradient)
      const yardY = groundY;
      const yardH = height - yardY;
      const yardGrad = ctx.createLinearGradient(0, yardY, 0, height);
      yardGrad.addColorStop(0, nf > 0.4 ? '#1e293b' : '#f8fafc');
      yardGrad.addColorStop(1, nf > 0.4 ? '#0f172a' : '#e2e8f0');
      ctx.fillStyle = yardGrad;
      ctx.fillRect(0, yardY, width, yardH);

      // Flowerbeds along the school building base
      ctx.save();
      for (let fbx = 0; fbx < width; fbx += 80) {
        // Skip central entrance & drum
        if (Math.abs(fbx + 35 - width / 2) < 65) continue;
        // Brick planter box
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.roundRect(fbx + 6, yardY + 2, 68, 9, 3);
        ctx.fill();
        // Green lush hedge
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.arc(fbx + 18, yardY + 1, 9, 0, Math.PI * 2);
        ctx.arc(fbx + 40, yardY - 1, 11, 0, Math.PI * 2);
        ctx.arc(fbx + 62, yardY + 1, 9, 0, Math.PI * 2);
        ctx.fill();
        // Cute little blooming blossoms
        ctx.fillStyle = '#f43f5e';
        ctx.beginPath();
        ctx.arc(fbx + 24, yardY - 1, 2.5, 0, Math.PI * 2);
        ctx.arc(fbx + 46, yardY - 3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(fbx + 34, yardY + 1, 2.5, 0, Math.PI * 2);
        ctx.arc(fbx + 55, yardY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Soft Sports Court Lines (Badminton / Volleyball)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(width * 0.26, yardY + 16, width * 0.48, yardH - 32, 6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(width / 2, yardY + 16);
      ctx.lineTo(width / 2, height - 16);
      ctx.stroke();

      // Basketball Hoop (Cute Chibi Sports Goal)
      const hoopX = width - 75;
      const hoopY = yardY + 20;
      // Pole with blue safety pad
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(hoopX - 3, hoopY - 80, 6, 80);
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.roundRect(hoopX - 5, hoopY - 35, 10, 35, 4);
      ctx.fill();
      // Backboard with rounded corners
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(hoopX - 24, hoopY - 86, 32, 24, 4);
      ctx.fill();
      ctx.stroke();
      // Inner target box
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(hoopX - 16, hoopY - 76, 16, 12);
      // Rim & Net
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(hoopX - 16, hoopY - 64);
      ctx.lineTo(hoopX - 2, hoopY - 64);
      ctx.stroke();
      // Net mesh
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hoopX - 16, hoopY - 64);
      ctx.lineTo(hoopX - 12, hoopY - 52);
      ctx.lineTo(hoopX - 6, hoopY - 52);
      ctx.lineTo(hoopX - 2, hoopY - 64);
      ctx.stroke();

      // ==========================================
      // CHIBI FLAGPOLE & VIETNAMESE NATIONAL FLAG
      // ==========================================
      const flagX = width * 0.16;
      const flagBaseY = yardY + 25;

      // 3-tiered Stone Pedestal (Bệ tam cấp)
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.roundRect(flagX - 32, flagBaseY + 10, 64, 8, 2);
      ctx.roundRect(flagX - 24, flagBaseY + 4, 48, 6, 2);
      ctx.roundRect(flagX - 16, flagBaseY - 1, 32, 5, 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Polished Silver-White Mast
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(flagX - 2.5, flagBaseY - 146, 5, 146);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(flagX - 2.5, flagBaseY - 146, 5, 146);

      // Golden Spherical Finial (Quả cầu đỉnh cột cờ)
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(flagX, flagBaseY - 148, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Waving Flag (Cờ đỏ sao vàng)
      stateRef.current.flagWave += dt * 5;
      const fw = stateRef.current.flagWave;
      const flagW = 46;
      const flagH = 28;
      const flagTopY = flagBaseY - 143;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(flagX + 2.5, flagTopY);
      for (let fx = 0; fx <= flagW; fx += 5) {
        ctx.lineTo(flagX + 2.5 + fx, flagTopY + Math.sin(fw + fx * 0.15) * 3);
      }
      ctx.lineTo(flagX + 2.5 + flagW, flagTopY + flagH + Math.sin(fw + flagW * 0.15) * 3);
      for (let fx = flagW; fx >= 0; fx -= 5) {
        ctx.lineTo(flagX + 2.5 + fx, flagTopY + flagH + Math.sin(fw + fx * 0.15) * 3);
      }
      ctx.closePath();
      ctx.fillStyle = '#dc2626';
      ctx.fill();

      // Golden 5-pointed star (Cờ đỏ sao vàng)
      const starX = flagX + 2.5 + flagW / 2;
      const starY = flagTopY + flagH / 2 + Math.sin(fw + (flagW / 2) * 0.15) * 3;
      const outerR = 7.5;
      const innerR = 3.2;
      const points = 5;

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      for (let i = 0; i < points * 2; i++) {
        const r = i % 2 === 0 ? outerR : innerR;
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const sx = starX + Math.cos(angle) * r;
        const sy = starY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // ==========================================
      // CHIBI TREES (Cây Phượng Vĩ & Cây Bàng Sân Trường)
      // ==========================================
      // Left Tree: Cây Bàng (Lush tiered umbrella shade tree)
      const bangX = width * 0.08;
      const bangY = yardY + 12;
      // Trunk
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(bangX - 5, bangY);
      ctx.lineTo(bangX - 4, bangY - 80);
      ctx.lineTo(bangX + 4, bangY - 80);
      ctx.lineTo(bangX + 5, bangY);
      ctx.closePath();
      ctx.fill();
      // Tiered green umbrella foliage
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(bangX, bangY - 70, 36, 15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(bangX, bangY - 86, 30, 13, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(bangX, bangY - 100, 24, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Right Tree: Cây Phượng Vĩ (Organic curved trunk & blooming flowers)
      const phuongX = width * 0.84;
      const phuongY = yardY + 10;
      // Trunk with organic curve & branches
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(phuongX - 7, phuongY);
      ctx.quadraticCurveTo(phuongX - 9, phuongY - 45, phuongX - 4, phuongY - 88);
      ctx.lineTo(phuongX + 4, phuongY - 88);
      ctx.quadraticCurveTo(phuongX - 1, phuongY - 45, phuongX + 7, phuongY);
      ctx.closePath();
      ctx.fill();
      // Branches
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(phuongX - 2, phuongY - 70);
      ctx.quadraticCurveTo(phuongX - 20, phuongY - 85, phuongX - 28, phuongY - 95);
      ctx.moveTo(phuongX + 1, phuongY - 70);
      ctx.quadraticCurveTo(phuongX + 18, phuongY - 85, phuongX + 26, phuongY - 95);
      ctx.stroke();

      // Lush layered leaf puffs (Rich multi-shade greens)
      ctx.fillStyle = '#14532d';
      ctx.beginPath();
      ctx.arc(phuongX - 22, phuongY - 110, 32, 0, Math.PI * 2);
      ctx.arc(phuongX + 24, phuongY - 110, 32, 0, Math.PI * 2);
      ctx.arc(phuongX, phuongY - 128, 36, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(phuongX - 16, phuongY - 115, 28, 0, Math.PI * 2);
      ctx.arc(phuongX + 18, phuongY - 115, 28, 0, Math.PI * 2);
      ctx.arc(phuongX, phuongY - 132, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(phuongX - 10, phuongY - 120, 20, 0, Math.PI * 2);
      ctx.arc(phuongX + 12, phuongY - 120, 20, 0, Math.PI * 2);
      ctx.arc(phuongX, phuongY - 136, 22, 0, Math.PI * 2);
      ctx.fill();

      // Blooming Red Phượng Flowers
      ctx.fillStyle = '#ef4444';
      [
        [-24, -120], [18, -125], [-12, -138], [14, -140],
        [-30, -102], [28, -104], [2, -118], [-6, -145], [0, -106]
      ].forEach(([fx, fy]) => {
        ctx.beginPath();
        ctx.arc(phuongX + fx, phuongY + fy, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.arc(phuongX + fx + 1.5, phuongY + fy - 1.5, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ef4444';
      });

      // Falling Petals
      ctx.save();
      ctx.fillStyle = '#ef4444';
      stateRef.current.petals.forEach((p) => {
        p.x += p.vx * dt * 35;
        p.y += p.vy * dt * 35;
        p.rot += p.rotSpeed;
        if (p.y > height) {
          p.y = Math.random() * 80;
          p.x = Math.random() * width;
        }
        if (p.x > width) p.x = 0;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();

      // ==========================================
      // ANIMATED CARTOON STUDENTS WALKING & RESCUE
      // ==========================================
      const studentsList = stateRef.current.students;
      const speeches = SCHOOL_SPEECHES;

      // Random cartoon speech bubbles when not abducting
      if (now - lastSpeechTick > 2500) {
        lastSpeechTick = now;
        const candidates = studentsList.filter((s) => s.state === 'walking');
        if (candidates.length > 0) {
          const pick = candidates[Math.floor(Math.random() * candidates.length)];
          const quote = speeches[Math.floor(Math.random() * speeches.length)];
          pick.speechBubble = {
            text: quote,
            expiresAt: now + 3400,
          };
        }
      }

      // Sort students by lane for natural 2.5D Chibi depth (back lane drawn first)
      const sortedStudents = [...studentsList].sort((a, b) => (a.lane || 0) - (b.lane || 0));

      sortedStudents.forEach((student) => {
        const studentBaseY = groundY + 12 + ((student.lane || 0) % 4) * 7.5;

        if (student.state === 'walking') {
          student.x += student.speed * dt * 65 * speedMult;
          student.walkCycle += Math.abs(student.speed) * dt * 14 * speedMult;
          student.blinkTimer += dt * 10;

          // Gentle separation between students in the same lane to avoid clumping
          for (let j = 0; j < studentsList.length; j++) {
            const other = studentsList[j];
            if (other.id !== student.id && (other.lane || 0) === (student.lane || 0) && other.state === 'walking') {
              const dist = student.x - other.x;
              if (Math.abs(dist) < 32 && Math.abs(dist) > 0.05) {
                student.x += Math.sign(dist) * dt * 25 * speedMult;
              }
            }
          }

          if (student.x < 35) {
            student.x = 35;
            student.speed = Math.abs(student.speed);
            student.direction = 1;
          } else if (student.x > width - 35) {
            student.x = width - 35;
            student.speed = -Math.abs(student.speed);
            student.direction = -1;
          }

          if (Math.random() < 0.002) {
            student.speed = -student.speed;
            student.direction = (student.speed > 0 ? 1 : -1) as (1 | -1);
          }
        } else if (student.state === 'targeted') {
          student.shakeOffset = (Math.random() - 0.5) * 4;
        } else if (student.state === 'abducting') {
          // SLOWER, DRAMATIC TUG-OF-WAR (NÍU KÉO) SUCTION (Takes ~4.5 seconds)
          student.liftProgress += dt * 0.22 * speedMult;

          // DUST PUFFS on ground during struggle
          if (student.liftProgress < 0.2 && Math.random() < 0.3) {
            stateRef.current.particles.push({
              x: student.x + (Math.random() - 0.5) * 20,
              y: studentBaseY + 34,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -Math.random() * 1.2,
              size: 3 + Math.random() * 3,
              alpha: 0.6,
              color: '#cbd5e1',
            });
          }

          // (Sự kiện cứu được quyết định chính xác 1 lần khi bắt đầu hút ở UFO locking)

          if (student.liftProgress >= 1) {
            student.liftProgress = 1;
            student.state = 'abducted';
            soundManager.playAbductionWarp();

            ufo.hudCount += 1;
            stateRef.current.abductedThisRound.push(student);
            stateRef.current.screenShake = 1.0;

            // IF A FRIEND TRIED TO RESCUE: BOTH GET ABDUCTED ("CHẾT CHÙM!")
            if (stateRef.current.rescueEvent && stateRef.current.rescueEvent.targetId === student.id) {
              const helper = studentsList.find(
                (s) => s.id === stateRef.current.rescueEvent?.rescuerId
              );
              if (helper && helper.state !== 'abducted') {
                helper.state = 'abducted';
                helper.liftProgress = 1;
                helper.speechBubble = {
                  text: 'Ai biểu cứu chết chùm!',
                  expiresAt: now + 4500,
                };
                stateRef.current.abductedThisRound.push(helper);
                ufo.hudCount += 1;
              }
              stateRef.current.rescueEvent = null;
            }

            if (ufo.hudCount >= ufo.targetCount) {
              ufo.state = 'leaving';
              soundManager.playVictoryFanfare();
              safeSetTimeout(() => {
                onAbductedStudents([...stateRef.current.abductedThisRound]);
                onGameStatusChange('completed');
              }, 1200);
            } else {
              ufo.state = 'scanning';
              ufo.targetStudentId = null;
            }
          }
        } else if (student.state === 'helping') {
          // HELPER DASHING TO RESCUE FRIEND
          const rescue = stateRef.current.rescueEvent;
          if (rescue && rescue.rescuerId === student.id) {
            const target = studentsList.find((s) => s.id === rescue.targetId);
            if (target) {
              if (rescue.stage === 'running') {
                const dist = target.x - student.x;
                student.x += Math.sign(dist) * dt * 260 * speedMult;
                student.direction = (dist > 0 ? 1 : -1) as (1 | -1);
                student.walkCycle += dt * 25 * speedMult;

                if (Math.abs(dist) < 18) {
                  rescue.stage = 'holding';
                  // TARGET SHOUTS: "AI BIỂU CỨU CHẾT CHÙM!!"
                  target.speechBubble = {
                    text: 'AI BIỂU CỨU CHẾT CHÙM!! 🤣',
                    expiresAt: now + 5000,
                  };
                  student.speechBubble = {
                    text: 'Á á á! Đĩa bay kéo cả tao lên!',
                    expiresAt: now + 5000,
                  };
                  soundManager.playStudentScream();
                  stateRef.current.screenShake = 0.9;
                }
              } else {
                // 'holding' or 'lifted'
                // Follow right below target's feet
                student.x = target.x + Math.sin(currentTime * 0.02) * 3;
                if (target.liftProgress > 0.22) {
                  rescue.stage = 'lifted';
                  student.liftProgress = target.liftProgress;
                }
              }
            }
          }
        }

        // Render Student if not yet abducted
        if (student.state !== 'abducted') {
          ctx.save();
          let px = student.x + (student.shakeOffset || 0);
          let py = studentBaseY;

          // TUG-OF-WAR (NÍU KÉO) POSITION CALCULATION
          if (student.state === 'abducting') {
            const ufoHatchX = ufo.x;
            const ufoHatchY = ufo.y + ufo.height * 0.55;

            // Dramatic elastic struggle wobble
            const tugStruggle =
              Math.sin(currentTime * 0.016) * 14 * Math.sin(student.liftProgress * Math.PI);

            px = student.x + (ufoHatchX - student.x) * student.liftProgress;
            py = studentBaseY + (ufoHatchY - studentBaseY) * student.liftProgress + tugStruggle;

            const spin = Math.sin(student.liftProgress * Math.PI * 6) * 0.2;
            ctx.translate(px, py);
            ctx.rotate(spin);
            const scale = Math.max(0.6, 1 - student.liftProgress * 0.35);
            ctx.scale(scale, scale);
            ctx.translate(-px, -py);
          } else if (student.state === 'helping') {
            const rescue = stateRef.current.rescueEvent;
            if (rescue && (rescue.stage === 'holding' || rescue.stage === 'lifted')) {
              const target = studentsList.find((s) => s.id === rescue.targetId);
              if (target && target.state === 'abducting') {
                const ufoHatchX = ufo.x;
                const ufoHatchY = ufo.y + ufo.height * 0.55;
                const targetPy =
                  studentBaseY +
                  (ufoHatchY - studentBaseY) * target.liftProgress +
                  Math.sin(currentTime * 0.016) * 14 * Math.sin(target.liftProgress * Math.PI);
                px = target.x + (ufoHatchX - target.x) * target.liftProgress;
                py = targetPy + 36; // Hanging right below target's feet!

                // Draw helper's hands gripping target's feet
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = 2.5;
                ctx.beginPath();
                ctx.moveTo(px - 5, py);
                ctx.lineTo(px - 4, targetPy + 28);
                ctx.moveTo(px + 5, py);
                ctx.lineTo(px + 4, targetPy + 28);
                ctx.stroke();
              }
            }
          }

          const legPhase = Math.sin(student.walkCycle);
          const bob = student.state === 'walking' ? Math.abs(legPhase) * -2.5 : 0;
          const currY = py + bob;

          // Soft Shadow
          if (student.state !== 'abducting' || student.liftProgress < 0.8) {
            const shadowAlpha = student.state === 'abducting' ? (1 - student.liftProgress) * 0.4 : 0.35;
            ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
            ctx.beginPath();
            ctx.ellipse(student.x, studentBaseY + 34, 13, 4.5, 0, 0, Math.PI * 2);
            ctx.fill();
          }

          // Articulated Chibi Legs & Walking
          const leftLegAngle =
            student.state === 'walking'
              ? legPhase * 7
              : student.state === 'abducting' || student.state === 'helping'
              ? Math.sin(currentTime * 0.03) * 12 // Kicking legs in panic!
              : 0;
          const rightLegAngle = -leftLegAngle;

          const isGirl = student.gender === 'female';

          // Backpack behind body
          const backpackX = student.direction > 0 ? px - 11 : px + 6;
          const backpackColors = ['#06b6d4', '#f43f5e', '#f59e0b', '#10b981'];
          const backpackColor = backpackColors[Math.abs(student.name.charCodeAt(student.name.length - 1)) % 4];
          ctx.fillStyle = backpackColor;
          ctx.beginPath();
          ctx.roundRect(backpackX, currY + 8, 5.5, 11, 2.5);
          ctx.fill();

          // Bottoms: Pleated skirt for girls, shorts/pants for boys
          if (isGirl) {
            // Legs
            ctx.fillStyle = student.colorTheme.skin || '#fed7aa';
            ctx.fillRect(px - 5 + leftLegAngle * 0.3, currY + 22, 3.5, 8);
            ctx.fillRect(px + 1.5 + rightLegAngle * 0.3, currY + 22, 3.5, 8);

            // White socks
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(px - 5 + leftLegAngle * 0.3, currY + 27, 3.5, 4);
            ctx.fillRect(px + 1.5 + rightLegAngle * 0.3, currY + 27, 3.5, 4);

            // Pleated navy skirt
            ctx.fillStyle = student.colorTheme.pants || '#0369a1';
            ctx.beginPath();
            ctx.moveTo(px - 6.5, currY + 18);
            ctx.lineTo(px + 6.5, currY + 18);
            ctx.lineTo(px + 8.5, currY + 24);
            ctx.lineTo(px - 8.5, currY + 24);
            ctx.closePath();
            ctx.fill();
            // Skirt pleat lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(px - 3, currY + 18);
            ctx.lineTo(px - 4, currY + 24);
            ctx.moveTo(px + 3, currY + 18);
            ctx.lineTo(px + 4, currY + 24);
            ctx.stroke();
          } else {
            // Boy navy trousers
            ctx.fillStyle = student.colorTheme.pants || '#1e3a8a';
            ctx.beginPath();
            ctx.roundRect(px - 5.5 + leftLegAngle * 0.35, currY + 19, 4.2, 11, 1.5);
            ctx.roundRect(px + 1.5 + rightLegAngle * 0.35, currY + 19, 4.2, 11, 1.5);
            ctx.fill();
          }

          // Cute rounded sneakers
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(px - 7 + leftLegAngle * 0.35, currY + 29.5, 6.5, 4, 2);
          ctx.roundRect(px + 0.5 + rightLegAngle * 0.35, currY + 29.5, 6.5, 4, 2);
          ctx.fill();
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(px - 7 + leftLegAngle * 0.35, currY + 32, 6.5, 1.5);
          ctx.fillRect(px + 0.5 + rightLegAngle * 0.35, currY + 32, 6.5, 1.5);

          // White School Uniform Shirt
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(px - 7.5, currY + 8, 15, 12, [3, 3, 2, 2]);
          ctx.fill();
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Red Pioneer Scarf (Khăn Quàng Đỏ)
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(px - 3.5, currY + 8);
          ctx.lineTo(px + 3.5, currY + 8);
          ctx.lineTo(px + 1.5, currY + 16);
          ctx.lineTo(px, currY + 14);
          ctx.lineTo(px - 1.5, currY + 16);
          ctx.closePath();
          ctx.fill();
          // Scarf knot
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.arc(px, currY + 9.5, 1.8, 0, Math.PI * 2);
          ctx.fill();

          // Arms & Hands
          ctx.fillStyle = student.colorTheme.skin || '#fed7aa';
          if (student.state === 'abducting' || student.state === 'targeted') {
            // Waving panic arms in the air!
            ctx.beginPath();
            ctx.roundRect(px - 11, currY + 1, 3.8, 11, 2);
            ctx.roundRect(px + 7.2, currY + 1, 3.8, 11, 2);
            ctx.fill();
          } else if (student.state === 'helping') {
            // Reaching hands up to grip friend
            ctx.beginPath();
            ctx.roundRect(px - 5.5, currY - 6, 3.8, 13, 2);
            ctx.roundRect(px + 1.8, currY - 6, 3.8, 13, 2);
            ctx.fill();
          } else {
            // Natural walking arm swing
            ctx.beginPath();
            ctx.roundRect(px - 9.5, currY + 9 - leftLegAngle * 0.35, 3.2, 9, 1.5);
            ctx.roundRect(px + 6.5, currY + 9 + leftLegAngle * 0.35, 3.2, 9, 1.5);
            ctx.fill();
          }

          // Cute Chubby Chibi Head
          ctx.fillStyle = student.colorTheme.skin || '#fed7aa';
          ctx.beginPath();
          ctx.arc(px, currY, 11, 0, Math.PI * 2);
          ctx.fill();

          // Rosy Chibi Blushing Cheeks
          ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
          ctx.beginPath();
          ctx.arc(px - 6, currY + 3, 3, 0, Math.PI * 2);
          ctx.arc(px + 6, currY + 3, 3, 0, Math.PI * 2);
          ctx.fill();
          // Cheek shine sparkles
          ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          ctx.beginPath();
          ctx.arc(px - 6.5, currY + 2.5, 1, 0, Math.PI * 2);
          ctx.arc(px + 5.5, currY + 2.5, 1, 0, Math.PI * 2);
          ctx.fill();

          // Expressive Anime Eyes & Face Expressions
          if (student.state === 'targeted' || student.state === 'abducting' || student.state === 'helping') {
            // Comical Anime Panic Eyes: wide white eyes + tiny shaking pupils
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(px - 4, currY - 1, 4.5, 0, Math.PI * 2);
            ctx.arc(px + 4, currY - 1, 4.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.2;
            ctx.stroke();

            // Shaking pupils
            const pupilShake = Math.sin(currentTime * 0.05) * 1;
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(px - 4 + pupilShake, currY - 1, 1.8, 0, Math.PI * 2);
            ctx.arc(px + 4 + pupilShake, currY - 1, 1.8, 0, Math.PI * 2);
            ctx.fill();

            // Screaming open mouth
            ctx.fillStyle = '#be123c';
            ctx.beginPath();
            ctx.ellipse(px, currY + 5.5, 3, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            // Anime panic sweat drops
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(px + 10, currY - 6, 2.5, 0, Math.PI * 2);
            ctx.moveTo(px + 10, currY - 9);
            ctx.lineTo(px + 8, currY - 6);
            ctx.lineTo(px + 12, currY - 6);
            ctx.closePath();
            ctx.fill();
          } else {
            // Normal walking expression
            const isBlinking = student.blinkTimer % 40 < 2;
            if (isBlinking) {
              // Cute curved happy blinking arcs: ( ^ ‿ ^ )
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 1.6;
              ctx.beginPath();
              ctx.arc(px - 4, currY + 0.5, 3, Math.PI, 0);
              ctx.arc(px + 4, currY + 0.5, 3, Math.PI, 0);
              ctx.stroke();
            } else {
              // Big sparkling anime chibi eyes!
              ctx.fillStyle = '#1e1b4b';
              ctx.beginPath();
              ctx.ellipse(px - 4, currY - 1, 2.8, 3.8, 0, 0, Math.PI * 2);
              ctx.ellipse(px + 4, currY - 1, 2.8, 3.8, 0, 0, Math.PI * 2);
              ctx.fill();

              // Anime eye catchlights (glistening sparkles)
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.arc(px - 4.8, currY - 2.4, 1.4, 0, Math.PI * 2);
              ctx.arc(px + 3.2, currY - 2.4, 1.4, 0, Math.PI * 2);
              ctx.fill();
              ctx.beginPath();
              ctx.arc(px - 3.2, currY + 0.5, 0.75, 0, Math.PI * 2);
              ctx.arc(px + 4.8, currY + 0.5, 0.75, 0, Math.PI * 2);
              ctx.fill();

              // Top delicate eyelashes
              ctx.strokeStyle = '#0f172a';
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.arc(px - 4, currY - 2, 3.2, Math.PI * 1.1, Math.PI * 1.9);
              ctx.arc(px + 4, currY - 2, 3.2, Math.PI * 1.1, Math.PI * 1.9);
              ctx.stroke();
            }

            // Cute small smiling mouth
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.arc(px, currY + 3.8, 2.8, 0.1, Math.PI - 0.1);
            ctx.stroke();
          }

          // Chibi Anime Hairstyles
          ctx.fillStyle = student.colorTheme.hair || '#1e293b';
          const hStyle = student.hairStyle % 4;

          if (hStyle === 1) {
            // Style 1 (Girl): Adorable Twintails / Pigtails
            ctx.beginPath();
            ctx.arc(px, currY - 3, 11.5, Math.PI * 0.95, Math.PI * 2.05);
            ctx.fill();
            // Side bangs
            ctx.beginPath();
            ctx.moveTo(px - 11, currY - 2);
            ctx.lineTo(px - 7, currY + 4);
            ctx.lineTo(px - 3, currY - 2);
            ctx.fill();
            // Twin pigtails with cute ribbon ties
            ctx.fillStyle = '#f43f5e'; // Ribbon
            ctx.fillRect(px - 13, currY - 1, 4, 4);
            ctx.fillRect(px + 9, currY - 1, 4, 4);
            ctx.fillStyle = student.colorTheme.hair || '#1e293b';
            ctx.beginPath();
            ctx.ellipse(px - 14, currY + 5, 3.5, 7, 0.25, 0, Math.PI * 2);
            ctx.ellipse(px + 14, currY + 5, 3.5, 7, -0.25, 0, Math.PI * 2);
            ctx.fill();
          } else if (hStyle === 2) {
            // Style 2 (Girl): Cute Bob Cut with Star Hairpin
            ctx.beginPath();
            ctx.arc(px, currY - 3, 11.5, Math.PI * 0.9, Math.PI * 2.1);
            ctx.fill();
            // Bob sides
            ctx.fillRect(px - 11.5, currY - 3, 4, 9);
            ctx.fillRect(px + 7.5, currY - 3, 4, 9);
            // Cute star hairpin
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(px - 7, currY - 5, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (hStyle === 3) {
            // Style 3 (Boy): Fluffy Wavy Anime Hair
            ctx.beginPath();
            ctx.arc(px, currY - 3.5, 12, Math.PI * 0.9, Math.PI * 2.1);
            ctx.arc(px - 6, currY - 10, 5, 0, Math.PI * 2);
            ctx.arc(px + 4, currY - 11, 5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Style 0 (Boy): Cool Side-Swept Bangs with Ahoge Tuft
            ctx.beginPath();
            ctx.arc(px, currY - 3.5, 11.5, Math.PI * 0.9, Math.PI * 2.1);
            ctx.fill();
            // Front bangs
            ctx.beginPath();
            ctx.moveTo(px - 8, currY - 4);
            ctx.lineTo(px - 2, currY + 1);
            ctx.lineTo(px + 6, currY - 3);
            ctx.fill();
            // Ahoge (hair tuft)
            ctx.strokeStyle = student.colorTheme.hair || '#1e293b';
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            ctx.moveTo(px, currY - 12);
            ctx.quadraticCurveTo(px + 4, currY - 17, px + 8, currY - 14);
            ctx.stroke();
          }

          // Hair highlight sheen (Angel ring)
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(px, currY - 5, 9.5, Math.PI * 1.25, Math.PI * 1.75);
          ctx.stroke();

          // Name Badge (Special style for students already examined today)
          const isExempted = exemptedStudentIds.has(student.id);
          const nameText = isExempted ? `✓ ${student.name}` : student.name;
          ctx.font = 'bold 11px sans-serif';
          const nameMetrics = ctx.measureText(nameText);
          const badgeW = nameMetrics.width + (isExempted ? 16 : 18);
          const badgeH = 21;
          const badgeX = px - badgeW / 2;
          const badgeY = currY - 26;

          ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
          ctx.beginPath();
          ctx.roundRect(badgeX + 1, badgeY + 1.5, badgeW, badgeH, 10);
          ctx.fill();

          ctx.fillStyle =
            student.state === 'targeted'
              ? '#dc2626'
              : student.state === 'abducting' || student.state === 'helping'
              ? '#059669'
              : isExempted
              ? '#ecfdf5'
              : '#ffffff';
          ctx.beginPath();
          ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10);
          ctx.fill();

          ctx.strokeStyle =
            student.state === 'targeted'
              ? '#fca5a5'
              : student.state === 'abducting' || student.state === 'helping'
              ? '#34d399'
              : isExempted
              ? '#10b981'
              : '#cbd5e1';
          ctx.lineWidth = isExempted ? 1.8 : 1.5;
          ctx.stroke();

          ctx.fillStyle =
            student.state === 'targeted' || student.state === 'abducting' || student.state === 'helping'
              ? '#ffffff'
              : isExempted
              ? '#047857'
              : '#0f172a';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(nameText, px, badgeY + badgeH / 2);

          // SPEECH BUBBLE WITH "AI BIỂU CỨU CHẾT CHÙM" HIGHLIGHT
          if (student.speechBubble && now < student.speechBubble.expiresAt) {
            const speechText = student.speechBubble.text;
            const isChietChum = speechText.includes('AI BIỂU CỨU') || speechText.includes('CHẾT CHÙM');

            ctx.font = isChietChum ? 'bold 12.5px sans-serif' : 'bold 11px sans-serif';
            const sMetrics = ctx.measureText(speechText);
            const sw = sMetrics.width + (isChietChum ? 22 : 16);
            const sh = isChietChum ? 26 : 22;
            const sx = Math.max(8, Math.min(width - sw - 8, px - sw / 2));
            const sy = badgeY - sh - 9;

            // Bubble body (Red/Amber cartoon glow for "AI BIỂU CỨU CHẾT CHÙM")
            ctx.fillStyle = isChietChum ? '#fee2e2' : '#fef08a';
            ctx.strokeStyle = isChietChum ? '#dc2626' : '#eab308';
            ctx.lineWidth = isChietChum ? 2.5 : 1.5;

            if (isChietChum) {
              ctx.shadowColor = '#ef4444';
              ctx.shadowBlur = 10;
            }

            ctx.beginPath();
            ctx.roundRect(sx, sy, sw, sh, 8);
            ctx.fill();
            ctx.stroke();
            ctx.shadowBlur = 0;

            ctx.beginPath();
            ctx.moveTo(px - 5, sy + sh);
            ctx.lineTo(px, sy + sh + 6);
            ctx.lineTo(px + 5, sy + sh);
            ctx.fill();

            ctx.fillStyle = isChietChum ? '#991b1b' : '#713f12';
            ctx.textAlign = 'center';
            ctx.fillText(speechText, sx + sw / 2, sy + sh / 2 + 1);
          }

          ctx.restore();
        }
      });

      // ==========================================
      // THE CARTOON UFO & TRACTOR BEAM
      // ==========================================
      if (ufo.state !== 'hidden') {
        if (ufo.state === 'entering') {
          ufo.y += (ufo.targetY - ufo.y) * dt * 3.5 * speedMult;
          if (Math.abs(ufo.y - ufo.targetY) < 3) {
            ufo.state = 'scanning';
          }
        } else if (ufo.state === 'scanning') {
          // Only pick students who are walking AND haven't been called today
          const availableStudents = studentsList.filter(
            (s) => s.state === 'walking' && !exemptedStudentIds.has(s.id)
          );
          if (availableStudents.length === 0) {
            ufo.state = 'leaving';
          } else {
            if (!ufo.targetStudentId) {
              // Bốc thăm ngẫu nhiên 100% đồng xác suất (1/N) bằng CSPRNG bảo mật mật mã học
              const target = securePickOne(availableStudents);
              if (target) {
                ufo.targetStudentId = target.id;
                ufo.targetX = target.x;
              }
            } else {
              const target = studentsList.find((s) => s.id === ufo.targetStudentId);
              if (target) {
                ufo.targetX = target.x;
                const dx = ufo.targetX - ufo.x;
                ufo.x += dx * dt * 4.2 * speedMult;
                ufo.tilt = dx * 0.003;
                ufo.beamIntensity = Math.min(0.65, ufo.beamIntensity + dt * 1.5 * speedMult);

                if (Math.abs(dx) < 22) {
                  ufo.state = 'locking';
                  target.state = 'targeted';
                  stateRef.current.screenShake = 0.5;
                  target.speechBubble = {
                    text: 'Thầy ơi tha em! Em chưa thuộc bài cũ!',
                    expiresAt: now + 3800,
                  };
                  soundManager.playStudentScream();

                  safeSetTimeout(() => {
                    if (ufo.state === 'locking') {
                      ufo.state = 'abducting';
                      target.state = 'abducting';
                      stateRef.current.screenShake = 0.8;
                      soundManager.playTractorBeam();
                      target.speechBubble = {
                        text: 'Em thuộc bài rồi mà! Cứu em!',
                        expiresAt: now + 3500,
                      };

                      // KIỂM TRA DUY NHẤT 1 LẦN CHO MỖI LƯỢT HÚT:
                      // Mặc định luôn hút 1 người (~82%).
                      // Chỉ ~18% có người cứu ngẫu nhiên (getSecureRandomFloat() < 0.18) -> Cả 2 cùng bị hút ("CHẾT CHÙM!")
                      const canTriggerRescue =
                        !stateRef.current.rescueEvent &&
                        !stateRef.current.rescueHappenedThisRound &&
                        availableStudents.length >= 2 &&
                        getSecureRandomFloat() < 0.18; // Tỉ lệ 18% bằng CSPRNG

                      if (canTriggerRescue) {
                        const potentialRescuers = studentsList.filter(
                          (s) => s.id !== target.id && s.state === 'walking' && !exemptedStudentIds.has(s.id)
                        );
                        if (potentialRescuers.length > 0) {
                          // CHỌN NGẪU NHIÊN 100% ĐỒNG XÁC SUẤT BẰNG CSPRNG
                          // Không phụ thuộc vào khoảng cách trên màn hình, không phụ thuộc vào hàng/lane hay thứ tự danh sách!
                          const rescuer = securePickOne(potentialRescuers);
                          if (rescuer) {
                            stateRef.current.rescueHappenedThisRound = true;
                            stateRef.current.rescueEvent = {
                              targetId: target.id,
                              rescuerId: rescuer.id,
                              stage: 'running',
                            };
                            rescuer.state = 'helping';
                            rescuer.holdingStudentId = target.id;
                            rescuer.speechBubble = {
                              text: 'Chờ tao, tao cứu mày nè!',
                              expiresAt: now + 3500,
                            };
                          }
                        }
                      }
                    }
                  }, 850);
                }
              }
            }
          }
        } else if (ufo.state === 'locking' || ufo.state === 'abducting') {
          const target = studentsList.find((s) => s.id === ufo.targetStudentId);
          if (target) {
            ufo.x += (target.x - ufo.x) * dt * 6 * speedMult;
          }
          ufo.tilt = 0;
          ufo.beamIntensity = Math.min(1.0, ufo.beamIntensity + dt * 2.5 * speedMult);
        } else if (ufo.state === 'leaving') {
          ufo.beamIntensity = Math.max(0, ufo.beamIntensity - dt * 4);
          ufo.x += dt * 900 * speedMult;
          ufo.y -= dt * 650 * speedMult;
          ufo.tilt = 0.2;
          if (ufo.y < -220) {
            ufo.state = 'hidden';
            soundManager.stopUfoHum();
          }
        }

        const hoverWobble = Math.sin(currentTime * 0.005) * 6;
        const renderUfoY = ufo.y + hoverWobble;

        // Tractor Beam
        if (ufo.beamIntensity > 0.01) {
          ctx.save();
          const beamTopY = renderUfoY + ufo.height * 0.44;
          const beamBottomY = groundY + 28;
          const beamTopW = 44;
          const beamBottomW = 190 + Math.sin(currentTime * 0.007) * 16;

          const beamGrad = ctx.createLinearGradient(0, beamTopY, 0, beamBottomY);
          beamGrad.addColorStop(0, `rgba(52, 211, 153, ${0.9 * ufo.beamIntensity})`);
          beamGrad.addColorStop(0.3, `rgba(16, 185, 129, ${0.55 * ufo.beamIntensity})`);
          beamGrad.addColorStop(0.7, `rgba(6, 182, 212, ${0.4 * ufo.beamIntensity})`);
          beamGrad.addColorStop(1, `rgba(6, 182, 212, ${0.1 * ufo.beamIntensity})`);

          ctx.fillStyle = beamGrad;
          ctx.beginPath();
          ctx.moveTo(ufo.x - beamTopW / 2, beamTopY);
          ctx.lineTo(ufo.x + beamTopW / 2, beamTopY);
          ctx.lineTo(ufo.x + beamBottomW / 2, beamBottomY);
          ctx.lineTo(ufo.x - beamBottomW / 2, beamBottomY);
          ctx.closePath();
          ctx.fill();

          // Laser scanlines
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.4 * ufo.beamIntensity})`;
          ctx.lineWidth = 1.5;
          const scanOffset = (currentTime * 0.08) % 30;
          for (let sc = beamTopY + scanOffset; sc < beamBottomY; sc += 28) {
            const progress = (sc - beamTopY) / (beamBottomY - beamTopY);
            const curW = beamTopW + (beamBottomW - beamTopW) * progress;
            ctx.beginPath();
            ctx.ellipse(ufo.x, sc, curW / 2, 4, 0, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Ground Impact Ring
          ctx.fillStyle = `rgba(52, 211, 153, ${0.65 * ufo.beamIntensity})`;
          ctx.beginPath();
          ctx.ellipse(ufo.x, beamBottomY, beamBottomW / 2, 16, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.restore();
        }

        // Draw UFO Ship
        ctx.save();
        ctx.translate(ufo.x, renderUfoY);
        ctx.rotate(ufo.tilt);

        // Saucer Hull
        const hullGrad = ctx.createLinearGradient(0, -ufo.height * 0.35, 0, ufo.height * 0.48);
        hullGrad.addColorStop(0, '#ffffff');
        hullGrad.addColorStop(0.2, '#e2e8f0');
        hullGrad.addColorStop(0.5, '#94a3b8');
        hullGrad.addColorStop(0.85, '#475569');
        hullGrad.addColorStop(1, '#1e293b');

        ctx.fillStyle = hullGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, ufo.width / 2, ufo.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Cockpit Dome
        const domeGrad = ctx.createRadialGradient(0, -ufo.height * 0.32, 4, 0, -ufo.height * 0.22, 55);
        domeGrad.addColorStop(0, 'rgba(167, 243, 208, 0.95)');
        domeGrad.addColorStop(0.5, 'rgba(52, 211, 153, 0.88)');
        domeGrad.addColorStop(1, 'rgba(6, 95, 70, 0.92)');

        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.ellipse(0, -ufo.height * 0.22, 58, 38, 0, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Alien Pilot
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(0, -ufo.height * 0.28, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(-4, -ufo.height * 0.29, 3, 4.5, -0.2, 0, Math.PI * 2);
        ctx.ellipse(4, -ufo.height * 0.29, 3, 4.5, 0.2, 0, Math.PI * 2);
        ctx.fill();

        // Antenna
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -ufo.height * 0.28 - 10);
        ctx.lineTo(0, -ufo.height * 0.28 - 16);
        ctx.stroke();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, -ufo.height * 0.28 - 17, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Perimeter Lights
        ufo.lightsPhase += dt * 6 * speedMult;
        const numLeds = 12;
        const ledRadiusX = ufo.width / 2 - 16;
        const ledRadiusY = ufo.height / 2 - 8;

        for (let l = 0; l < numLeds; l++) {
          const angle = (l / numLeds) * Math.PI * 2 + ufo.lightsPhase;
          const lx = Math.cos(angle) * ledRadiusX;
          const ly = Math.sin(angle) * ledRadiusY + 3;

          const colors = ['#facc15', '#f43f5e', '#38bdf8', '#4ade80', '#c084fc'];
          const ledColor = colors[(l + Math.floor(ufo.lightsPhase)) % colors.length];

          ctx.fillStyle = ledColor;
          ctx.beginPath();
          ctx.arc(lx, ly, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // HUD Counter: [ 0 / 2 ]
        ctx.fillStyle = '#022c22';
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-45, -5, 90, 24, 7);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`[ ${ufo.hudCount} / ${ufo.targetCount} ]`, 0, 7);

        ctx.restore();
      }

      // Hint at bottom when idle
      if (gameStatus === 'idle') {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
        ctx.beginPath();
        ctx.roundRect(width / 2 - 220, height - 42, 440, 30, 15);
        ctx.fill();
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          '🛸 Nhấn SPACE để gọi đĩa bay UFO đáp xuống sân trường!',
          width / 2,
          height - 27
        );
        ctx.restore();
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      clearAllTimeouts();
    };
  }, [gameStatus, animationSpeed, onAbductedStudents, onGameStatusChange, exemptedStudentIds]);

  // Responsive High-DPI Canvas Resize
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const targetW = Math.max(320, Math.floor(rect.width));
      const targetH = Math.max(200, Math.floor(rect.height));

      if (canvas.width !== targetW * dpr || canvas.height !== targetH * dpr) {
        canvas.width = targetW * dpr;
        canvas.height = targetH * dpr;
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    const ro = new ResizeObserver(handleResize);
    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }
    return () => {
      window.removeEventListener('resize', handleResize);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-slate-700/60 select-none">
      <canvas ref={canvasRef} className="w-full h-full block cursor-pointer" />
    </div>
  );
};
