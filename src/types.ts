export interface RecordingItem {
  id: string;
  title: string;
  note: string;
  duration: number; // in seconds
  createdAt: number; // Unix timestamp in ms
  isRead: boolean; // true = Read, false = Unread
  tags: string[];
  audioUrl: string; // Object URL or Base64 / synthetic audio
  waveform?: number[]; // Normalized amplitude points (0..1)
  fileSize?: string;
}

export type DateFilterMode = 'ALL' | 'DATE' | 'MONTH' | 'YEAR';

export interface DateFilterSelection {
  mode: DateFilterMode;
  dateString: string; // "YYYY-MM-DD"
  month: number; // 0-11
  year: number; // e.g. 2026
}

export type ReadFilterType = 'ALL' | 'READ' | 'UNREAD';

export type ViewMode = 'DASHBOARD' | 'LOCKSCREEN' | 'HOMESCREEN';

export interface AudioRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  secondsElapsed: number;
  amplitudes: number[];
}
