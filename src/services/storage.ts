import { RecordingItem } from '../types';
import { createSyntheticAudioBlob } from '../utils/audioEngine';

const STORAGE_KEY = 'papervoice_recordings_v1';
const TAGS_KEY = 'papervoice_tags_v1';

export const DEFAULT_TAGS = [
  'Personal',
  'Work',
  'Urgent',
  'Ideas',
  'Health',
  'Family',
  'Reminders',
];

/**
 * Initializes and gets all recordings from storage, seeding demo data if first load.
 */
export function getStoredRecordings(): RecordingItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: RecordingItem[] = JSON.parse(raw);
      return parsed.map((item) => {
        // Ensure audioUrl is valid (re-generate blob if needed)
        if (!item.audioUrl || item.audioUrl.startsWith('blob:')) {
          const blob = createSyntheticAudioBlob(item.duration || 12);
          return {
            ...item,
            audioUrl: URL.createObjectURL(blob),
          };
        }
        return item;
      });
    }
  } catch (e) {
    console.error('Failed to parse recordings from localStorage', e);
  }

  // Seed default recordings if empty
  const initialData: RecordingItem[] = [
    {
      id: 'rec_seed_1',
      title: 'Android 17 Widget Architecture Plan',
      note: 'Need 1x1 paper widget that launches a non-fullscreen popup on lockscreen without unlocking. Floating bubble minimize support is crucial.',
      duration: 28,
      createdAt: Date.now() - 1000 * 60 * 45, // 45 mins ago
      isRead: false,
      tags: ['Work', 'Ideas'],
      audioUrl: URL.createObjectURL(createSyntheticAudioBlob(28)),
      waveform: [0.15, 0.3, 0.45, 0.6, 0.35, 0.2, 0.5, 0.8, 0.65, 0.4, 0.3, 0.55, 0.7, 0.4, 0.25, 0.35, 0.6, 0.75, 0.5, 0.3],
      fileSize: '438 KB',
    },
    {
      id: 'rec_seed_2',
      title: 'Grocery List & Organic Coffee Beans',
      note: 'Buy Ethiopian light roast coffee, almond milk, dark sourdough bread, and fresh rosemary from the Saturday market.',
      duration: 16,
      createdAt: Date.now() - 1000 * 60 * 60 * 4, // 4 hours ago
      isRead: true,
      tags: ['Personal'],
      audioUrl: URL.createObjectURL(createSyntheticAudioBlob(16)),
      waveform: [0.2, 0.35, 0.4, 0.5, 0.3, 0.2, 0.45, 0.6, 0.5, 0.3, 0.25, 0.4, 0.55, 0.35, 0.2],
      fileSize: '254 KB',
    },
    {
      id: 'rec_seed_3',
      title: 'Emergency Server Deployment Checklist',
      note: 'Verify database migration scripts, check SSL cert renewal date, and ensure Redis cache cluster health prior to release.',
      duration: 42,
      createdAt: Date.now() - 1000 * 60 * 60 * 26, // Yesterday
      isRead: false,
      tags: ['Work', 'Urgent'],
      audioUrl: URL.createObjectURL(createSyntheticAudioBlob(42)),
      waveform: [0.25, 0.5, 0.7, 0.85, 0.6, 0.4, 0.55, 0.75, 0.9, 0.7, 0.5, 0.35, 0.6, 0.8, 0.65, 0.4, 0.3, 0.5, 0.6, 0.4],
      fileSize: '652 KB',
    },
    {
      id: 'rec_seed_4',
      title: 'Book Recommendation: Designing Systems',
      note: 'Discuss chapter 4 on tactile interfaces and paper-based aesthetic philosophy for modern mobile operating systems.',
      duration: 22,
      createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3, // 3 days ago
      isRead: true,
      tags: ['Ideas'],
      audioUrl: URL.createObjectURL(createSyntheticAudioBlob(22)),
      waveform: [0.18, 0.3, 0.42, 0.55, 0.4, 0.25, 0.35, 0.6, 0.45, 0.3, 0.22, 0.4, 0.5, 0.35],
      fileSize: '344 KB',
    },
    {
      id: 'rec_seed_5',
      title: 'Q3 Architectural Retrospective & Sync',
      note: 'Team recap from September on performance optimizations, memory leak fixes, and audio processing pipelines.',
      duration: 35,
      createdAt: new Date('2026-09-18T10:30:00').getTime(),
      isRead: false,
      tags: ['Work'],
      audioUrl: URL.createObjectURL(createSyntheticAudioBlob(35)),
      waveform: [0.3, 0.45, 0.6, 0.5, 0.35, 0.25, 0.4, 0.65, 0.55, 0.3, 0.4, 0.5],
      fileSize: '540 KB',
    },
    {
      id: 'rec_seed_6',
      title: 'Year-End 2025 Product Vision & Reflections',
      note: 'Initial prototype notes from December 2025 exploring minimal paper textures and instant lockscreen access.',
      duration: 50,
      createdAt: new Date('2025-12-14T16:20:00').getTime(),
      isRead: true,
      tags: ['Ideas', 'Personal'],
      audioUrl: URL.createObjectURL(createSyntheticAudioBlob(50)),
      waveform: [0.2, 0.3, 0.5, 0.7, 0.8, 0.6, 0.4, 0.5, 0.7, 0.6, 0.4, 0.3, 0.2],
      fileSize: '780 KB',
    },
  ];

  saveRecordings(initialData);
  return initialData;
}

export function saveRecordings(items: RecordingItem[]): void {
  try {
    // Exclude actual Blob URL in JSON stringify to avoid storage bloat
    const storable = items.map((item) => ({
      ...item,
      audioUrl: '', // rebuilt dynamically from synthetic or indexed store
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storable));
  } catch (e) {
    console.error('Failed to save recordings to localStorage', e);
  }
}

export function getStoredTags(): string[] {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // fallback
  }
  return DEFAULT_TAGS;
}

export function saveStoredTags(tags: string[]): void {
  try {
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  } catch (e) {
    console.error('Failed to save tags', e);
  }
}
