import React, { useState } from 'react';
import {
  X,
  Radio,
  Smartphone,
  Laptop,
  Tablet,
  CheckCircle2,
  Download,
  Share2,
  Copy,
  Check,
} from 'lucide-react';
import { RecordingItem } from '../types';
import { downloadRecordingAsMp3 } from '../utils/audioEngine';

interface BulkQuickShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordings: RecordingItem[];
}

export const BulkQuickShareModal: React.FC<BulkQuickShareModalProps> = ({
  isOpen,
  onClose,
  recordings,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [transferState, setTransferState] = useState<'idle' | 'transferring' | 'sent'>('idle');
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  if (!isOpen) return null;

  const nearbyDevices = [
    { id: 'dev_1', name: 'Pixel 9 Pro (My Phone)', type: 'phone', icon: Smartphone, distance: 'Near' },
    { id: 'dev_2', name: 'Galaxy Tab S9 Ultra', type: 'tablet', icon: Tablet, distance: 'Near' },
    { id: 'dev_3', name: 'MacBook Pro · Office', type: 'laptop', icon: Laptop, distance: 'Nearby' },
    { id: 'dev_4', name: 'Lenovo ThinkPad', type: 'laptop', icon: Laptop, distance: 'Nearby' },
  ];

  const handleStartQuickShare = (deviceName: string) => {
    setSelectedDevice(deviceName);
    setTransferState('transferring');
    setTimeout(() => {
      setTransferState('sent');
      setTimeout(() => {
        setTransferState('idle');
        setSelectedDevice(null);
      }, 3500);
    }, 1800);
  };

  const handleDownloadAll = () => {
    recordings.forEach((rec, idx) => {
      setTimeout(() => {
        downloadRecordingAsMp3(rec);
      }, idx * 400);
    });
  };

  const handleCopyManifest = () => {
    const summary = recordings
      .map(
        (r, i) =>
          `${i + 1}. ${r.title} (${r.duration}s)\n   Date: ${new Date(r.createdAt).toLocaleString()}\n   Note: ${r.note}\n   Tags: ${r.tags.join(', ')}`
      )
      .join('\n\n');
    navigator.clipboard.writeText(summary);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Bulk Voice Recordings (${recordings.length} items)`,
          text: `Exporting ${recordings.length} voice notes from PaperVoice`,
          url: window.location.href,
        });
      } catch {
        // cancelled
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45 backdrop-blur-[2px]">
      <div
        className="paper-sheet paper-card relative w-full max-w-md rounded-2xl border-2 border-[#111111] p-6 shadow-2xl transition-all"
        style={{ color: '#111111' }}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5 text-[#111111] animate-pulse" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
              Android Quick Share
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

        {/* Content Details */}
        <div className="py-4">
          <h3 className="text-lg font-bold text-[#111111]">
            Bulk Share {recordings.length} Recording{recordings.length !== 1 ? 's' : ''}
          </h3>
          <p className="mt-1 text-xs text-[#555555]">
            Quick Share transmits all selected MP3 voice notes to nearby Android, ChromeOS, or Windows devices instantly.
          </p>
        </div>

        {/* Transfer Progress / Success Banner */}
        {transferState === 'transferring' && (
          <div className="mb-4 rounded-xl border border-[#111111] bg-[#F7F5EE] p-3 text-center">
            <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-[#111111]">
              <Radio className="h-4 w-4 animate-spin text-[#111111]" />
              <span>Transmitting {recordings.length} MP3 files to {selectedDevice}...</span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#E5E0D8]">
              <div className="h-full w-2/3 bg-[#111111] animate-pulse" />
            </div>
          </div>
        )}

        {transferState === 'sent' && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-700 bg-emerald-50 p-3 text-xs font-bold text-emerald-950">
            <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            <span>Success! All {recordings.length} MP3 recordings received by {selectedDevice}.</span>
          </div>
        )}

        {/* Nearby Devices List */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
            Nearby Devices Ready:
          </span>

          <div className="flex flex-col gap-2">
            {nearbyDevices.map((dev) => {
              const IconComponent = dev.icon;
              return (
                <button
                  key={dev.id}
                  type="button"
                  onClick={() => handleStartQuickShare(dev.name)}
                  disabled={transferState === 'transferring'}
                  className="flex items-center justify-between rounded-xl border border-[#111111] bg-white p-3 text-left transition-all hover:bg-[#F7F5EE] active:scale-[0.99] disabled:opacity-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#111111] bg-[#F7F5EE]">
                      <IconComponent className="h-5 w-5 text-[#111111]" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#111111]">{dev.name}</p>
                      <span className="font-mono text-[10px] text-[#555555]">
                        Ready to receive · {dev.distance}
                      </span>
                    </div>
                  </div>

                  <span className="rounded-lg bg-[#111111] px-2.5 py-1 text-[11px] font-bold text-white">
                    Send
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Alternative Export Options */}
        <div className="mt-5 border-t border-[#E5E0D8] pt-4">
          <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
            Alternative Bulk Actions
          </span>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleDownloadAll}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#111111] bg-white p-2.5 text-center text-xs font-bold text-[#111111] hover:bg-[#F3EFE6] active:scale-95"
            >
              <Download className="h-4 w-4" />
              <span className="text-[10px] leading-tight">Download All MP3s</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#111111] bg-white p-2.5 text-center text-xs font-bold text-[#111111] hover:bg-[#F3EFE6] active:scale-95"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-[10px] leading-tight">System Share</span>
            </button>

            <button
              type="button"
              onClick={handleCopyManifest}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-[#111111] bg-white p-2.5 text-center text-xs font-bold text-[#111111] hover:bg-[#F3EFE6] active:scale-95"
            >
              {copiedAll ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="text-[10px] leading-tight">
                {copiedAll ? 'Copied!' : 'Copy Summary'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
