export type ComputerStatus = 'normal' | 'broken' | 'repairing' | 'malware';

export interface MalwareSavedProgress {
  stageIndex: number;
  typedCount: number;
  firewallIntegrity: number;
  commands: { command: string; script: string }[];
  terminalLogs: string[];
}

export interface ComputerData {
  id: string;
  name: string; // e.g. "โต๊ะ A-1 (ฝ่ายขาย)"
  deskIndex: number;
  position: [number, number, number]; // [x, y, z]
  rotation: number; // yaw rotation
  status: ComputerStatus;
  breakTimer?: number;
  repairDifficulty: number; // 1 to 3
  sectionName: string; // "โซน A (ฝ่ายการตลาด)", etc.
  malwareType?: string; // e.g. "Trojan.Agent.X", "Ransomware.Cryptor"
  malwareSavedProgress?: MalwareSavedProgress;
}

export interface ComboState {
  count: number;
  timer: number;
  maxTimer: number;
}

export interface SpeedBoostState {
  active: boolean;
  timeLeft: number;
  maxDuration: number;
}

export interface CableConnection {
  id: string;
  name: string;
  color: string;
  label: string;
  targetId: string;
  connectedTargetId: string | null;
  isConnected: boolean;
}

export type GamePhase = 'menu' | 'intro' | 'playing' | 'minigame' | 'malware_battle' | 'gameover';
export type GameOverReason = 'time' | 'malware';

export interface GameStats {
  repairedCount: number;
  failedCount: number;
  hackerWhackedCount: number;
  totalAttempts: number;
  streak: number;
  bestStreak: number;
}

export type HackerState = 'patrol' | 'sneaking' | 'hacking' | 'stunned' | 'fleeing';

export interface HackerInfo {
  position: [number, number, number];
  state: HackerState;
  targetPcName?: string;
  hackingProgress: number; // 0 to 100
  isNearPlayer: boolean;
}

export interface RadioDispatch {
  id: string;
  senderName: string;
  role: string;
  department: 'marketing' | 'dev' | 'finance' | 'management' | 'system';
  message: string;
  type: 'incident_broken' | 'incident_malware' | 'resolved' | 'hacker_sighting';
  timestamp: number;
}

export interface ShiftObjective {
  id: string;
  title: string;
  desc: string;
  current: number;
  target: number;
  completed: boolean;
}

