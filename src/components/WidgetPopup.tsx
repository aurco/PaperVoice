import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, Trash2, Minus, Plus, Check, Mic } from 'lucide-react';
import { AudioEngine, formatDuration } from '../utils/audioEngine';
import { RecordingItem } from '../types';

interface WidgetPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onMinimize: (state: {
    screen: number;
    title: string;
    note: string;
    duration: number;
    audioData: { blob: Blob; url: string; waveform: number[] } | null;
  }) => void;
  onSaveRecording: (recording: Omit<RecordingItem, 'id'>) => void;
  existingTags: string[];
  onAddNewTag: (tag: string) => void;
  resumedState?: {
    screen: number;
    title: string;
    note: string;
    duration: number;
    audioData: { blob: Blob; url: string; waveform: number[] } | null;
  } | null;
}

export const WidgetPopup: React.FC<WidgetPopupProps> = ({
  isOpen,
  onClose,
  onMinimize,
  onSaveRecording,
  existingTags,
  onAddNewTag,
  resumedState,
}) => {
  // Screens: 1 = Recording, 2 = Title & Note, 3 = Tags
  const [currentScreen, setCurrentScreen] = useState<number>(1);

  // Screen 1: Recording States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [amplitudes, setAmplitudes] = useState<number[]>([]);
  const [audioData, setAudioData] = useState<{ blob: Blob; url: string; waveform: number[] } | null>(null);

  // Screen 2: Title & Note
  const [title, setTitle] = useState<string>('');
  const [note, setNote] = useState<string>('');

  // Screen 3: Tags
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [isAddingNewTag, setIsAddingNewTag] = useState<boolean>(false);

  // Live Device Date and Time
  const [currentDateTime, setCurrentDateTime] = useState<string>('');

  // Audio Engine reference
  const audioEngineRef = useRef<AudioEngine>(new AudioEngine());
  const timerIntervalRef = useRef<number | null>(null);

  // Keep live time and date synced
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      const timeStr = now.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      setCurrentDateTime(`${timeStr} · ${dateStr}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle resumed state from minimized floating bubble
  useEffect(() => {
    if (resumedState) {
      setCurrentScreen(resumedState.screen);
      setTitle(resumedState.title);
      setNote(resumedState.note);
      setSecondsElapsed(resumedState.duration);
      if (resumedState.audioData) {
        setAudioData(resumedState.audioData);
      }
    }
  }, [resumedState]);

  // Clean timer
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  // Screen 1: Start Recording
  const handleStart = async () => {
    const success = await audioEngineRef.current.startRecording((amps) => {
      setAmplitudes(amps);
    });
    setIsRecording(true);
    setIsPaused(false);

    // If start fresh, reset timer
    if (secondsElapsed === 0) {
      setSecondsElapsed(0);
    }

    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = window.setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    // Pre-populate default title if empty
    if (!title) {
      const now = new Date();
      const formatted = now.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      setTitle(`Voice Note - ${formatted}`);
    }
  };

  // Screen 1: Pause Recording
  const handlePause = () => {
    audioEngineRef.current.pauseRecording();
    setIsPaused(true);
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  // Screen 1: Resume Recording
  const handleResume = () => {
    audioEngineRef.current.resumeRecording();
    setIsPaused(false);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = window.setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
  };

  // Screen 1: Cancel Recording
  const handleCancel = () => {
    audioEngineRef.current.cancelRecording();
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setIsRecording(false);
    setIsPaused(false);
    setSecondsElapsed(0);
    setAmplitudes([]);
    setAudioData(null);
    onClose();
  };

  // Screen 1: Save when paused -> Advances to Screen 2
  const handleProceedToScreenTwo = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    const captured = await audioEngineRef.current.stopRecording(secondsElapsed);
    setAudioData(captured);
    setIsRecording(false);
    setIsPaused(false);
    setCurrentScreen(2);
  };

  // Screen 2: Minimize to Android Floating Bubble
  const handleMinimizeToBubble = () => {
    onMinimize({
      screen: currentScreen,
      title,
      note,
      duration: secondsElapsed,
      audioData,
    });
  };

  // Screen 2: Close icon closes and discards
  const handleCloseDiscard = () => {
    if (isRecording) {
      audioEngineRef.current.cancelRecording();
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setIsRecording(false);
    setIsPaused(false);
    setSecondsElapsed(0);
    setTitle('');
    setNote('');
    setSelectedTags([]);
    setAudioData(null);
    onClose();
  };

  // Screen 2: Next button -> Screen 3
  const handleProceedToScreenThree = () => {
    setCurrentScreen(3);
  };

  // Screen 3: Toggle Tag
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  // Screen 3: Create Tag
  const handleCreateNewTag = () => {
    const trimmed = newTagInput.trim();
    if (trimmed) {
      if (!existingTags.includes(trimmed)) {
        onAddNewTag(trimmed);
      }
      if (!selectedTags.includes(trimmed)) {
        setSelectedTags([...selectedTags, trimmed]);
      }
      setNewTagInput('');
      setIsAddingNewTag(false);
    }
  };

  // Screen 3: Final Save
  const handleFinalSave = () => {
    const finalDuration = Math.max(1, secondsElapsed);
    const finalAudioUrl = audioData?.url || '';
    const finalWaveform = audioData?.waveform || amplitudes;

    onSaveRecording({
      title: title.trim() || `Voice Note - ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      note: note.trim(),
      duration: finalDuration,
      createdAt: Date.now(),
      isRead: false, // Default unchecked -> goes to Unread filter
      tags: selectedTags.length > 0 ? selectedTags : ['Personal'],
      audioUrl: finalAudioUrl,
      waveform: finalWaveform.length > 0 ? finalWaveform : [0.3, 0.5, 0.4, 0.7, 0.6, 0.4, 0.5],
      fileSize: `${Math.round(finalDuration * 16)} KB`,
    });

    // Reset all states
    setCurrentScreen(1);
    setIsRecording(false);
    setIsPaused(false);
    setSecondsElapsed(0);
    setTitle('');
    setNote('');
    setSelectedTags([]);
    setAudioData(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px] transition-all">
      {/* 
        The Pop Up Container:
        - Not full screen
        - Opens in the middle of the screen
        - Height adjusts as per its need
        - White paper texture background with 100% black text and crisp borders
      */}
      <div 
        className="paper-sheet paper-card relative w-full max-w-[420px] rounded-2xl border-2 border-[#111111] p-5 shadow-2xl transition-all"
        style={{ color: '#111111' }}
      >
        {/* ========================================================
            SCREEN 1: RECORDING INTERFACE (3 ROWS)
            ======================================================== */}
        {currentScreen === 1 && (
          <div className="flex flex-col gap-5">
            {/* 
              ROW 1:
              - Left side: Close icon
              - Right side: Time and date as per device
            */}
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
              <button
                type="button"
                onClick={handleCloseDiscard}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#111111] bg-white text-[#111111] transition-colors hover:bg-[#F3EFE6] active:scale-95"
                title="Close Widget"
                aria-label="Close widget"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="text-right">
                <span className="font-mono text-xs font-semibold tracking-wider text-[#111111]">
                  {currentDateTime}
                </span>
              </div>
            </div>

            {/* 
              ROW 2:
              - Voice recording line (soundwave visualizer line as seen on voice memo apps)
              - Timer
            */}
            <div className="flex flex-col items-center gap-3 py-2">
              {/* Visualizer voice line container */}
              <div className="relative flex h-16 w-full items-center justify-center overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#F7F5EE] px-4">
                {!isRecording && amplitudes.length === 0 ? (
                  // Idle static voice line
                  <div className="flex w-full items-center justify-center gap-1 opacity-60">
                    <div className="h-[2px] w-full bg-[#111111]" />
                  </div>
                ) : (
                  // Live dynamic voice recording lines / wave bars
                  <div className="flex h-full w-full items-center justify-center gap-[3px]">
                    {(amplitudes.length > 0 ? amplitudes : [0.15, 0.3, 0.5, 0.7, 0.4, 0.25, 0.6, 0.8, 0.35, 0.2]).map(
                      (amp, index) => {
                        const height = Math.max(4, Math.min(52, amp * 52));
                        return (
                          <span
                            key={index}
                            className={`w-[3px] rounded-full bg-[#111111] transition-all duration-75 ${
                              isRecording && !isPaused ? '' : 'opacity-70'
                            }`}
                            style={{ height: `${height}px` }}
                          />
                        );
                      }
                    )}
                  </div>
                )}
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center">
                <span className="font-mono text-3xl font-extrabold tracking-tight text-[#111111]">
                  {formatDuration(secondsElapsed)}
                </span>
              </div>
            </div>

            {/* 
              ROW 3:
              - Center: Start button
              - If recording: Start button turns to Pause button
              - Right side: Cancel button appears
              - Left side: Close button appears
              - If paused: "Save" button appears to proceed to Screen 2
            */}
            <div className="flex items-center justify-between pt-2">
              {/* Left Slot: Close button appears when recording/paused */}
              <div className="w-16">
                {(isRecording || isPaused) && (
                  <button
                    type="button"
                    onClick={handleCloseDiscard}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#111111] bg-white text-[#111111] transition-all hover:bg-[#F3EFE6] active:scale-95"
                    title="Close"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Center Slot: Start / Pause / Resume Button */}
              <div className="flex items-center justify-center">
                {!isRecording && !isPaused ? (
                  // Start Button
                  <button
                    type="button"
                    onClick={handleStart}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-[#111111] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                    title="Start Recording"
                    aria-label="Start recording"
                  >
                    <Mic className="h-7 w-7" />
                  </button>
                ) : isRecording && !isPaused ? (
                  // Pause Button
                  <button
                    type="button"
                    onClick={handlePause}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-[#111111] text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
                    title="Pause Recording"
                    aria-label="Pause recording"
                  >
                    <Pause className="h-7 w-7" />
                  </button>
                ) : (
                  // Paused state: center allows resume
                  <button
                    type="button"
                    onClick={handleResume}
                    className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#111111] bg-white text-[#111111] shadow-lg transition-transform hover:scale-105 active:scale-95"
                    title="Resume Recording"
                    aria-label="Resume recording"
                  >
                    <Play className="ml-1 h-7 w-7" />
                  </button>
                )}
              </div>

              {/* Right Slot: Cancel button when recording OR Save button when paused */}
              <div className="flex w-16 justify-end">
                {isRecording && !isPaused ? (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-[#111111] bg-white text-[#111111] transition-all hover:bg-[#FCE8E6] hover:text-red-700 active:scale-95"
                    title="Cancel Recording"
                    aria-label="Cancel recording"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                ) : isPaused ? (
                  <button
                    type="button"
                    onClick={handleProceedToScreenTwo}
                    className="flex h-11 items-center justify-center rounded-full bg-[#111111] px-4 font-semibold text-white shadow-md transition-all hover:bg-[#252525] active:scale-95"
                    title="Save & Proceed"
                  >
                    Save
                  </button>
                ) : (
                  <div className="h-11 w-11" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SCREEN 2: TITLE & NOTE BOX (WITH MINIMIZE & CLOSE)
            ======================================================== */}
        {currentScreen === 2 && (
          <div className="flex flex-col gap-4">
            {/* Top Right: Minimize and Close Icons */}
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#111111]">
                Voice Note Details
              </span>
              <div className="flex items-center gap-2">
                {/* Minimize Icon -> Floats as Android 17 Bubble */}
                <button
                  type="button"
                  onClick={handleMinimizeToBubble}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#111111] bg-white text-[#111111] transition-colors hover:bg-[#F3EFE6] active:scale-95"
                  title="Minimize to Android Bubble"
                  aria-label="Minimize to bubble"
                >
                  <Minus className="h-4 w-4" />
                </button>
                {/* Close Icon -> Closes without saving */}
                <button
                  type="button"
                  onClick={handleCloseDiscard}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#111111] bg-white text-[#111111] transition-colors hover:bg-[#F3EFE6] active:scale-95"
                  title="Close Without Saving"
                  aria-label="Close without saving"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* First text box: Title */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="recording-title" className="text-xs font-bold text-[#111111]">
                Title
              </label>
              <input
                id="recording-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Quick Memo / Project Idea"
                className="w-full rounded-xl border border-[#111111] bg-white px-3.5 py-2.5 text-sm font-semibold text-[#111111] placeholder:text-[#888888] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] focus:outline-none"
              />
            </div>

            {/* Second box: Note */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="recording-note" className="text-xs font-bold text-[#111111]">
                Note
              </label>
              <textarea
                id="recording-note"
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Write any key takeaways, action items, or remarks..."
                className="w-full resize-none rounded-xl border border-[#111111] bg-white p-3.5 text-sm font-normal text-[#111111] placeholder:text-[#888888] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] focus:outline-none"
              />
            </div>

            {/* Audio snapshot info */}
            <div className="flex items-center justify-between rounded-lg bg-[#F7F5EE] px-3 py-2 text-xs text-[#111111]">
              <span className="font-mono">Duration: {formatDuration(secondsElapsed)}</span>
              <span className="font-mono">Format: MP3 Audio</span>
            </div>

            {/* Next button under the Note box */}
            <button
              type="button"
              onClick={handleProceedToScreenThree}
              className="mt-1 flex w-full items-center justify-center rounded-xl bg-[#111111] py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#252525] active:scale-[0.98]"
            >
              Next
            </button>
          </div>
        )}

        {/* ========================================================
            SCREEN 3: ADD TAGS & FINAL SAVE
            ======================================================== */}
        {currentScreen === 3 && (
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#111111]">
                Add Tags
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentScreen(2)}
                  className="text-xs font-medium text-[#111111] underline hover:text-[#555555]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleCloseDiscard}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#111111] bg-white text-[#111111] transition-colors hover:bg-[#F3EFE6] active:scale-95"
                  title="Close"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Create new tag area */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#111111]">Existing & Custom Tags</span>
              {!isAddingNewTag ? (
                <button
                  type="button"
                  onClick={() => setIsAddingNewTag(true)}
                  className="flex items-center gap-1 rounded-lg border border-[#111111] bg-white px-2.5 py-1 text-xs font-bold text-[#111111] hover:bg-[#F3EFE6] active:scale-95"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Tag</span>
                </button>
              ) : null}
            </div>

            {isAddingNewTag && (
              <div className="flex items-center gap-2 rounded-xl border border-[#111111] bg-white p-1.5">
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateNewTag();
                  }}
                  placeholder="Type tag name..."
                  autoFocus
                  className="flex-1 bg-transparent px-2 text-xs font-medium text-[#111111] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateNewTag}
                  className="rounded-lg bg-[#111111] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#252525]"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNewTag(false);
                    setNewTagInput('');
                  }}
                  className="px-1 text-xs text-[#555555]"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Tag Selection Chips */}
            <div className="flex flex-wrap gap-2 py-1 max-h-40 overflow-y-auto">
              {existingTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 ${
                      isSelected
                        ? 'border-[#111111] bg-[#111111] text-white shadow-sm'
                        : 'border-[#111111] bg-white text-[#111111] hover:bg-[#F3EFE6]'
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom center: Save button */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={handleFinalSave}
                className="flex w-full items-center justify-center rounded-xl bg-[#111111] py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#252525] active:scale-[0.98]"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
