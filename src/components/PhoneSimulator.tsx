import React, { useState, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Mic,
  BatteryCharging,
  Wifi,
  Sparkles,
  Layers,
  ArrowRight,
  Maximize2,
} from 'lucide-react';
import { RecordingItem } from '../types';

interface PhoneSimulatorProps {
  onTriggerWidget: () => void;
  onOpenDashboard: () => void;
  recordingsCount: number;
}

export const PhoneSimulator: React.FC<PhoneSimulatorProps> = ({
  onTriggerWidget,
  onOpenDashboard,
  recordingsCount,
}) => {
  const [phoneMode, setPhoneMode] = useState<'LOCKSCREEN' | 'HOMESCREEN'>('LOCKSCREEN');
  const [deviceTime, setDeviceTime] = useState<string>('14:45');
  const [deviceDate, setDeviceDate] = useState<string>('Tuesday, Oct 20');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setDeviceTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setDeviceDate(
        now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-6 px-4">
      {/* Simulator Switcher Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <div className="flex rounded-xl border border-[#111111] bg-white p-1">
          <button
            type="button"
            onClick={() => setPhoneMode('LOCKSCREEN')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              phoneMode === 'LOCKSCREEN'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-[#111111] hover:bg-[#F3EFE6]'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Android 17 Lockscreen</span>
          </button>

          <button
            type="button"
            onClick={() => setPhoneMode('HOMESCREEN')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              phoneMode === 'HOMESCREEN'
                ? 'bg-[#111111] text-white shadow-sm'
                : 'text-[#111111] hover:bg-[#F3EFE6]'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Homescreen Grid</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenDashboard}
          className="flex items-center gap-1.5 rounded-xl border border-[#111111] bg-white px-3.5 py-2 text-xs font-bold text-[#111111] hover:bg-[#F3EFE6]"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Switch to Full Dashboard</span>
        </button>
      </div>

      <p className="mb-4 text-center font-mono text-xs text-[#555555]">
        {phoneMode === 'LOCKSCREEN'
          ? 'Tap the 1x1 Paper Widget on the lockscreen to record without unlocking the device!'
          : 'Tap the 1x1 Paper Widget to launch the 3-step popup in the center of the screen.'}
      </p>

      {/* Android 17 Phone Frame */}
      <div className="relative h-[680px] w-full max-w-[340px] rounded-[44px] border-[8px] border-[#111111] bg-[#FAF8F5] p-3 shadow-2xl overflow-hidden paper-texture">
        {/* Dynamic Island / Front Camera Punch Hole */}
        <div className="absolute left-1/2 top-4 h-4 w-24 -translate-x-1/2 rounded-full bg-[#111111] z-30 flex items-center justify-center">
          <div className="h-2.5 w-2.5 rounded-full bg-[#252525]" />
        </div>

        {/* Top Status Bar */}
        <div className="relative z-20 flex items-center justify-between px-4 pt-4 text-xs font-mono font-bold text-[#111111]">
          <span>{deviceTime}</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="h-3.5 w-3.5 text-[#111111]" />
            <span className="text-[10px]">5G</span>
            <BatteryCharging className="h-3.5 w-3.5 text-[#111111]" />
          </div>
        </div>

        {/* ========================================================
            VIEW 1: ANDROID 17 LOCKSCREEN MODE
            ======================================================== */}
        {phoneMode === 'LOCKSCREEN' && (
          <div className="flex h-full flex-col justify-between pt-6 pb-12 px-2 text-[#111111]">
            {/* Clock & Date */}
            <div className="flex flex-col items-center pt-8">
              <span className="font-mono text-6xl font-extrabold tracking-tighter text-[#111111]">
                {deviceTime}
              </span>
              <span className="mt-1 font-mono text-xs font-medium text-[#555555]">
                {deviceDate}
              </span>

              {/* Lockscreen status pill */}
              <div className="mt-4 flex items-center gap-1.5 rounded-full border border-[#111111] bg-white px-3 py-1 font-mono text-[10px] font-bold text-[#111111]">
                <Lock className="h-3 w-3" />
                <span>Device Locked · Lockscreen Widget Active</span>
              </div>
            </div>

            {/* Lockscreen Widget Area with the 1x1 Paper Widget */}
            <div className="flex flex-col items-center gap-3">
              <div className="rounded-2xl border border-[#E5E0D8] bg-white/70 backdrop-blur-xs p-3 text-center">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#555555]">
                  1x1 Lockscreen Widget
                </span>

                {/* THE 1x1 WIDGET (As required by prompt) */}
                <div className="mt-2 flex items-center justify-center">
                  <button
                    type="button"
                    onClick={onTriggerWidget}
                    className="paper-widget flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-white p-2 text-[#111111] cursor-pointer group"
                    title="Click 1x1 Widget to Record"
                  >
                    <Mic className="h-6 w-6 text-[#111111] transition-transform group-hover:scale-110" />
                    <span className="mt-1 font-mono text-[9px] font-extrabold tracking-tight">
                      REC 1x1
                    </span>
                  </button>
                </div>

                <p className="mt-2 text-[10px] text-[#555555]">
                  Tap to launch voice memo popup without unlocking phone
                </p>
              </div>

              {/* Unlock Action button */}
              <button
                type="button"
                onClick={() => setPhoneMode('HOMESCREEN')}
                className="flex items-center gap-1.5 rounded-full border border-[#111111] bg-white px-4 py-1.5 text-xs font-bold text-[#111111] hover:bg-[#F3EFE6]"
              >
                <Unlock className="h-3.5 w-3.5" />
                <span>Swipe to Unlock</span>
              </button>
            </div>
          </div>
        )}

        {/* ========================================================
            VIEW 2: ANDROID 17 HOMESCREEN MODE
            ======================================================== */}
        {phoneMode === 'HOMESCREEN' && (
          <div className="flex h-full flex-col justify-between pt-6 pb-8 px-2 text-[#111111]">
            {/* Top Google Search Pill */}
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-[#111111] bg-white px-3 py-2 text-xs text-[#555555] shadow-xs">
              <span className="font-semibold text-[#111111]">Google</span>
              <Mic className="h-4 w-4 text-[#111111]" />
            </div>

            {/* Homescreen App Grid with the 1x1 Paper Widget */}
            <div className="grid grid-cols-4 gap-3 py-6">
              {/* The 1x1 Widget on Home Screen */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={onTriggerWidget}
                  className="paper-widget flex h-14 w-14 flex-col items-center justify-center rounded-2xl bg-white text-[#111111] shadow-sm transition-transform active:scale-95"
                  title="Click 1x1 Widget to Record"
                >
                  <Mic className="h-6 w-6 text-[#111111]" />
                </button>
                <span className="mt-1 font-mono text-[10px] font-bold text-[#111111]">
                  1x1 Rec
                </span>
              </div>

              {/* Main PaperVoice App icon */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={onOpenDashboard}
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#111111] bg-[#111111] text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
                  title="Open PaperVoice App Dashboard"
                >
                  <Layers className="h-6 w-6" />
                </button>
                <span className="mt-1 font-mono text-[10px] font-bold text-[#111111]">
                  PaperVoice
                </span>
              </div>

              {/* Dummy Android system apps for realism */}
              <div className="flex flex-col items-center opacity-60">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#111111] bg-white text-[#111111]">
                  <span className="font-bold text-xs">Notes</span>
                </div>
                <span className="mt-1 text-[10px] font-semibold text-[#111111]">Keep</span>
              </div>

              <div className="flex flex-col items-center opacity-60">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#111111] bg-white text-[#111111]">
                  <span className="font-bold text-xs">Files</span>
                </div>
                <span className="mt-1 text-[10px] font-semibold text-[#111111]">Files</span>
              </div>
            </div>

            {/* Bottom Dock and Lock back button */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setPhoneMode('LOCKSCREEN')}
                className="flex items-center gap-1 text-[11px] font-bold text-[#555555] hover:text-[#111111]"
              >
                <Lock className="h-3 w-3" />
                <span>Return to Lockscreen</span>
              </button>

              {/* Bottom Nav Bar indicator */}
              <div className="h-1 w-28 rounded-full bg-[#111111]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
