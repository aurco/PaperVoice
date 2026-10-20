import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Trash2,
  Share2,
  Download,
  Copy,
  Check,
  Radio,
  FileAudio,
} from 'lucide-react';
import { RecordingItem } from '../types';
import { formatDuration, formatTimestamp, downloadRecordingAsMp3 } from '../utils/audioEngine';

interface RecordingDetailModalProps {
  recording: RecordingItem | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onOpenQuickShare: (item: RecordingItem) => void;
}

export const RecordingDetailModal: React.FC<RecordingDetailModalProps> = ({
  recording,
  onClose,
  onDelete,
  onOpenQuickShare,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showShareMenu, setShowShareMenu] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (recording) {
      setDuration(recording.duration || 0);
      setCurrentTime(0);
      setIsPlaying(false);
      setShowShareMenu(false);
      setShowDeleteConfirm(false);
    }
  }, [recording]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (!recording) return null;

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Audio play prevented', e);
        setIsPlaying(true);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const cycleSpeed = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIndex = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIndex];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: recording.title,
          text: `Voice Note: ${recording.title}\nNote: ${recording.note}\nDuration: ${formatDuration(recording.duration)}`,
          url: window.location.href,
        });
      } catch {
        // Share cancelled or unavailable
      }
    } else {
      onOpenQuickShare(recording);
    }
  };

  const handleCopyText = () => {
    const text = `Voice Note: ${recording.title}\nDate: ${formatTimestamp(recording.createdAt)}\nNote: ${recording.note}\nTags: ${recording.tags.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">
      {/* Audio element for actual sound playback */}
      <audio
        ref={audioRef}
        src={recording.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleAudioEnded}
      />

      <div
        className="paper-sheet paper-card relative w-full max-w-lg rounded-2xl border-2 border-[#111111] p-6 shadow-2xl transition-all"
        style={{ color: '#111111' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
              Voice Recording
            </span>
            <span className="font-mono text-xs text-[#555555]">
              · {recording.fileSize || `${Math.round(recording.duration * 16)} KB`} · MP3
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#111111] bg-white text-[#111111] transition-colors hover:bg-[#F3EFE6] active:scale-95"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Title and Date */}
        <div className="py-4">
          <h2 className="text-xl font-bold tracking-tight text-[#111111]">
            {recording.title}
          </h2>
          <p className="mt-1 font-mono text-xs text-[#555555]">
            Recorded on {formatTimestamp(recording.createdAt)}
          </p>
        </div>

        {/* Audio Player Card with Waveform */}
        <div className="rounded-xl border border-[#111111] bg-[#F7F5EE] p-4">
          {/* Waveform Visualization Bars */}
          <div className="flex h-14 w-full items-center justify-center gap-1 overflow-hidden px-2">
            {(recording.waveform || [0.2, 0.4, 0.7, 0.5, 0.3, 0.6, 0.8, 0.4, 0.3, 0.5, 0.6, 0.4]).map(
              (val, idx) => {
                const totalBars = (recording.waveform || []).length || 12;
                const progressRatio = duration > 0 ? currentTime / duration : 0;
                const isPassed = idx / totalBars <= progressRatio;
                const barHeight = Math.max(6, Math.min(46, val * 46));

                return (
                  <div
                    key={idx}
                    className="flex h-full flex-1 items-center justify-center cursor-pointer"
                    onClick={() => {
                      const seekTo = (idx / totalBars) * duration;
                      setCurrentTime(seekTo);
                      if (audioRef.current) audioRef.current.currentTime = seekTo;
                    }}
                  >
                    <span
                      className={`w-full max-w-[4px] rounded-full transition-colors ${
                        isPassed ? 'bg-[#111111]' : 'bg-[#D5CEBE]'
                      }`}
                      style={{ height: `${barHeight}px` }}
                    />
                  </div>
                );
              }
            )}
          </div>

          {/* Timeline slider scrubber */}
          <div className="mt-3">
            <input
              type="range"
              min={0}
              max={duration || recording.duration || 1}
              step={0.1}
              value={currentTime}
              onChange={handleScrub}
              className="w-full accent-[#111111] cursor-pointer"
            />
            <div className="flex justify-between font-mono text-xs font-semibold text-[#111111]">
              <span>{formatDuration(currentTime)}</span>
              <span>{formatDuration(duration || recording.duration)}</span>
            </div>
          </div>

          {/* Controls: Play/Pause, Speed, MP3 Badge */}
          <div className="mt-4 flex items-center justify-between border-t border-[#E5E0D8] pt-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-[#111111] text-white shadow-md transition-all hover:bg-[#252525] active:scale-95"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
              </button>

              <button
                type="button"
                onClick={cycleSpeed}
                className="rounded-lg border border-[#111111] bg-white px-2.5 py-1 font-mono text-xs font-bold text-[#111111] hover:bg-[#F3EFE6]"
                title="Playback Speed"
              >
                {playbackSpeed}x
              </button>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-xs font-medium text-[#555555]">
              <FileAudio className="h-4 w-4 text-[#111111]" />
              <span>MP3 Format</span>
            </div>
          </div>
        </div>

        {/* Note Box */}
        <div className="mt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
            Note:
          </span>
          <div className="mt-1 rounded-xl border border-[#E5E0D8] bg-white p-3 text-sm leading-relaxed text-[#111111]">
            {recording.note || <span className="italic text-[#888888]">No note attached.</span>}
          </div>
        </div>

        {/* Tags */}
        <div className="mt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
            Tags:
          </span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {recording.tags.length > 0 ? (
              recording.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md border border-[#111111] bg-[#F7F5EE] px-2.5 py-1 text-xs font-bold text-[#111111]"
                >
                  #{tag}
                </span>
              ))
            ) : (
              <span className="text-xs text-[#888888]">No tags</span>
            )}
          </div>
        </div>

        {/* Share Options Menu / Drawer if opened */}
        {showShareMenu && (
          <div className="mt-4 rounded-xl border-2 border-[#111111] bg-white p-3 shadow-lg">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Available Sharing Options
              </span>
              <button
                type="button"
                onClick={() => setShowShareMenu(false)}
                className="text-xs text-[#555555] hover:text-[#111111]"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {/* Quick Share */}
              <button
                type="button"
                onClick={() => {
                  setShowShareMenu(false);
                  onOpenQuickShare(recording);
                }}
                className="flex items-center gap-2 rounded-lg border border-[#111111] bg-[#F7F5EE] p-2 text-left hover:bg-[#EAE5DC]"
              >
                <Radio className="h-4 w-4" />
                <span>Quick Share</span>
              </button>

              {/* Native Web Share */}
              <button
                type="button"
                onClick={handleNativeShare}
                className="flex items-center gap-2 rounded-lg border border-[#111111] bg-[#F7F5EE] p-2 text-left hover:bg-[#EAE5DC]"
              >
                <Share2 className="h-4 w-4" />
                <span>System Share</span>
              </button>

              {/* Download MP3 */}
              <button
                type="button"
                onClick={() => downloadRecordingAsMp3(recording)}
                className="flex items-center gap-2 rounded-lg border border-[#111111] bg-[#F7F5EE] p-2 text-left hover:bg-[#EAE5DC]"
              >
                <Download className="h-4 w-4" />
                <span>Download MP3</span>
              </button>

              {/* Copy note & metadata */}
              <button
                type="button"
                onClick={handleCopyText}
                className="flex items-center gap-2 rounded-lg border border-[#111111] bg-[#F7F5EE] p-2 text-left hover:bg-[#EAE5DC]"
              >
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedLink ? 'Copied!' : 'Copy Summary'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="mt-4 rounded-xl border border-red-700 bg-[#FFF5F5] p-3 text-xs">
            <p className="font-bold text-red-900">Delete this recording permanently?</p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onDelete(recording.id);
                  onClose();
                }}
                className="rounded-lg bg-red-700 px-3 py-1.5 font-bold text-white hover:bg-red-800"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-[#111111] bg-white px-3 py-1.5 font-bold text-[#111111]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Action Row: Delete & Share Option */}
        <div className="mt-6 flex items-center justify-between border-t border-[#E5E0D8] pt-4">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2 rounded-xl border border-[#111111] bg-white px-4 py-2.5 text-xs font-bold text-red-700 transition-all hover:bg-[#FFF5F5] active:scale-95"
            title="Delete Recording"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="flex items-center gap-2 rounded-xl bg-[#111111] px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-[#252525] active:scale-95"
            title="Share Recording"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Options</span>
          </button>
        </div>
      </div>
    </div>
  );
};
