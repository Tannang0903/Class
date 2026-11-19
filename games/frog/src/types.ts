export type SpeedLevel = 'slow' | 'normal' | 'fast' | 'turbo';
export type GameMode = 'auto' | 'manual';


export interface Student {
  id: number;
  number: number;
  name: string;
  isAbsent?: boolean;
  hasAnswered?: boolean;
}

export interface Bug {
  id: number;
  number: number;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseRadius: number;
  color: string;
  wingAngle: number;
  wingSpeed: number;
  isAlive: boolean;
  state: 'flying' | 'targeted' | 'caught' | 'eaten' | 'on_leaf_winner';
  caughtProgress: number; // 0 to 1 when being pulled
  targetFrogIndex: number;
  targetLeafX?: number;
  targetLeafY?: number;
  caughtOrder?: number; // 1-based order in which fly was caught in manual mode
}

export interface FrogState {
  index: number;
  x: number; // px inside arena
  y: number;
  mouthOpen: boolean;
  isChewing: boolean;
  chewTimer: number;
  tongueActive: boolean;
  tongueProgress: number; // 0 -> 1 -> 0
  tongueTargetX: number;
  tongueTargetY: number;
  targetBugId: number | null; // Each frog catches exactly 1 bug
  phase: 'idle' | 'shooting' | 'retracting' | 'chewing';
  blinkTimer: number;
  isBlinking: boolean;
  aimAngle?: number; // radians for manual pendulum aiming
}
