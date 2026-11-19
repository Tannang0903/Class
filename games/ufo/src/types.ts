export interface Student {
  id: string;
  name: string;
  gender: 'male' | 'female';
  x: number;
  y: number;
  targetX: number;
  speed: number;
  direction: 1 | -1;
  state: 'walking' | 'idle' | 'targeted' | 'abducting' | 'helping' | 'abducted';
  liftProgress: number;
  lane?: number;
  holdingStudentId?: string | null;
  speechBubble?: {
    text: string;
    expiresAt: number;
  };
  colorTheme: {
    shirt: string;
    pants: string;
    hair: string;
    skin: string;
  };
}

export type GameStatus = 'idle' | 'preparing' | 'hunting' | 'abducting' | 'completed';
