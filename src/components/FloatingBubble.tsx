import React, { useState, useRef, useEffect } from 'react';
import { Mic, X, Maximize2 } from 'lucide-react';
import { formatDuration } from '../utils/audioEngine';

interface FloatingBubbleProps {
  isVisible: boolean;
  duration: number;
  title: string;
  onExpand: () => void;
  onDismiss: () => void;
}

export const FloatingBubble: React.FC<FloatingBubbleProps> = ({
  isVisible,
  duration,
  title,
  onExpand,
  onDismiss,
}) => {
  // Draggable position state
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 24, y: 140 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });
  const bubbleRef = useRef<HTMLDivElement>(null);
  const hasMovedRef = useRef<boolean>(false);

  // Set default initial position on right side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initialX = Math.max(16, window.innerWidth - 88);
      setPosition({ x: initialX, y: 180 });
    }
  }, []);

  if (!isVisible) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      hasMovedRef.current = true;
    }

    const newX = Math.max(12, Math.min(window.innerWidth - 80, dragStartRef.current.initialX + deltaX));
    const newY = Math.max(12, Math.min(window.innerHeight - 80, dragStartRef.current.initialY + deltaY));

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    // Snap to left or right edge like real Android Bubbles
    const snapThreshold = window.innerWidth / 2;
    const targetX = position.x > snapThreshold ? window.innerWidth - 84 : 16;
    setPosition((prev) => ({ ...prev, x: targetX }));

    // If tapped without dragging, expand!
    if (!hasMovedRef.current) {
      onExpand();
    }
  };

  return (
    <div
      ref={bubbleRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
        touchAction: 'none',
      }}
      className={`fixed left-0 top-0 z-50 cursor-grab select-none transition-shadow active:cursor-grabbing ${
        isDragging ? 'shadow-2xl scale-105' : 'shadow-xl'
      }`}
    >
      <div className="relative group">
        {/* Android 17 Floating Bubble Avatar */}
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#111111] bg-white text-[#111111] shadow-[3px_3px_0px_#111111]">
          {/* Pulsing indicator */}
          <div className="absolute inset-0 rounded-full border border-black/15 animate-ping" />
          
          <Mic className="h-7 w-7 text-[#111111]" />

          {/* Duration Badge */}
          <div className="absolute -bottom-2 rounded-full border border-[#111111] bg-[#111111] px-1.5 py-0.5 font-mono text-[9px] font-bold text-white shadow-sm">
            {formatDuration(duration)}
          </div>
        </div>

        {/* Dismiss 'x' button on hover / tap */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-[#111111] bg-[#111111] text-white hover:bg-red-700 transition-colors"
          title="Dismiss Bubble"
        >
          <X className="h-3 w-3" />
        </button>

        {/* Android 17 Bubble Tooltip */}
        <div className="pointer-events-none absolute left-1/2 -top-8 -translate-x-1/2 whitespace-nowrap rounded-md border border-[#111111] bg-white px-2 py-0.5 text-[10px] font-bold text-[#111111] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
          Tap to resume · {title || 'Voice Note'}
        </div>
      </div>
    </div>
  );
};
