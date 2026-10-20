/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { RecordingItem } from './types';
import { getStoredRecordings, saveRecordings, getStoredTags, saveStoredTags } from './services/storage';
import { Dashboard } from './components/Dashboard';
import { PhoneSimulator } from './components/PhoneSimulator';
import { WidgetPopup } from './components/WidgetPopup';
import { FloatingBubble } from './components/FloatingBubble';
import { RecordingDetailModal } from './components/RecordingDetailModal';
import { BulkQuickShareModal } from './components/BulkQuickShareModal';
import { AndroidCodeModal } from './components/AndroidCodeModal';
import { CheckCircle2, Mic } from 'lucide-react';

export default function App() {
  const [recordings, setRecordings] = useState<RecordingItem[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // View Mode: Full Dashboard vs Android 17 Phone/Lockscreen Simulator
  const [viewMode, setViewMode] = useState<'DASHBOARD' | 'PHONE'>('DASHBOARD');

  // Widget Popup State
  const [isWidgetOpen, setIsWidgetOpen] = useState<boolean>(false);

  // Floating Bubble State (minimized from Screen 2)
  const [bubbleState, setBubbleState] = useState<{
    isVisible: boolean;
    duration: number;
    title: string;
    note: string;
    screen: number;
    audioData: { blob: Blob; url: string; waveform: number[] } | null;
  } | null>(null);

  // Resumed state when expanding bubble back to widget popup
  const [resumedWidgetState, setResumedWidgetState] = useState<{
    screen: number;
    title: string;
    note: string;
    duration: number;
    audioData: { blob: Blob; url: string; waveform: number[] } | null;
  } | null>(null);

  // Modals
  const [selectedRecording, setSelectedRecording] = useState<RecordingItem | null>(null);
  const [isBulkShareOpen, setIsBulkShareOpen] = useState<boolean>(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  // Load from Storage
  useEffect(() => {
    const loadedRecs = getStoredRecordings();
    const loadedTags = getStoredTags();
    setRecordings(loadedRecs);
    setAllTags(loadedTags);
    setIsLoaded(true);
  }, []);

  // Save changes to storage
  useEffect(() => {
    if (isLoaded) {
      saveRecordings(recordings);
    }
  }, [recordings, isLoaded]);

  useEffect(() => {
    if (isLoaded) {
      saveStoredTags(allTags);
    }
  }, [allTags, isLoaded]);

  // Handle Save New Recording from Widget
  const handleSaveRecording = (newRec: Omit<RecordingItem, 'id'>) => {
    const createdItem: RecordingItem = {
      ...newRec,
      id: `rec_${Date.now()}`,
    };
    setRecordings((prev) => [createdItem, ...prev]);
    // Clear bubble if any
    setBubbleState(null);
    setResumedWidgetState(null);
    showToast(`Saved "${createdItem.title}" as MP3 to Unread filter.`);
  };

  // Checkbox Read/Unread Toggle
  const handleToggleRead = (id: string, isRead: boolean) => {
    setRecordings((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isRead } : r))
    );
    showToast(isRead ? 'Moved to Read filter.' : 'Moved to Unread filter.');
  };

  // Delete Recording
  const handleDeleteRecording = (id: string) => {
    setRecordings((prev) => prev.filter((r) => r.id !== id));
    setSelectedRecording(null);
    showToast('Recording deleted.');
  };

  // Add new Tag
  const handleAddNewTag = (tag: string) => {
    if (!allTags.includes(tag)) {
      setAllTags((prev) => [...prev, tag]);
      showToast(`Tag "#${tag}" created.`);
    }
  };

  // Delete Tag
  const handleDeleteTag = (tagToDelete: string) => {
    setAllTags((prev) => prev.filter((t) => t !== tagToDelete));
    // Remove the deleted tag from any recordings that have it
    setRecordings((prev) =>
      prev.map((rec) => ({
        ...rec,
        tags: rec.tags.filter((t) => t !== tagToDelete),
      }))
    );
    showToast(`Tag "#${tagToDelete}" deleted.`);
  };

  // Minimize from Screen 2 into Floating Bubble
  const handleMinimizeToBubble = (state: {
    screen: number;
    title: string;
    note: string;
    duration: number;
    audioData: { blob: Blob; url: string; waveform: number[] } | null;
  }) => {
    setIsWidgetOpen(false);
    setBubbleState({
      isVisible: true,
      ...state,
    });
    showToast('Minimized to Android 17 Floating Bubble. Tap bubble to resume.');
  };

  // Expand Floating Bubble back to Widget
  const handleExpandBubble = () => {
    if (bubbleState) {
      setResumedWidgetState({
        screen: bubbleState.screen,
        title: bubbleState.title,
        note: bubbleState.note,
        duration: bubbleState.duration,
        audioData: bubbleState.audioData,
      });
      setBubbleState(null);
      setIsWidgetOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] paper-texture text-[#111111] antialiased selection:bg-[#111111] selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-2 rounded-xl border border-[#111111] bg-white px-4 py-2.5 text-xs font-bold text-[#111111] shadow-xl">
          <CheckCircle2 className="h-4 w-4 text-[#111111]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Content: Full Dashboard vs Android Phone Simulator */}
      <main className="w-full">
        {viewMode === 'DASHBOARD' ? (
          <Dashboard
            recordings={recordings}
            allTags={allTags}
            onToggleRead={handleToggleRead}
            onSelectRecording={(item) => setSelectedRecording(item)}
            onOpenWidget={() => {
              setResumedWidgetState(null);
              setIsWidgetOpen(true);
            }}
            onOpenBulkShare={() => setIsBulkShareOpen(true)}
            onOpenCodeModal={() => setIsCodeModalOpen(true)}
            onToggleViewMode={() => setViewMode('PHONE')}
            onDeleteTag={handleDeleteTag}
            onAddNewTag={handleAddNewTag}
          />
        ) : (
          <div className="mx-auto max-w-4xl py-6">
            <PhoneSimulator
              recordingsCount={recordings.length}
              onTriggerWidget={() => {
                setResumedWidgetState(null);
                setIsWidgetOpen(true);
              }}
              onOpenDashboard={() => setViewMode('DASHBOARD')}
            />
          </div>
        )}
      </main>

      {/* The 1x1 Widget Popup Dialog (Screen 1: Record, Screen 2: Note/Title, Screen 3: Tags) */}
      <WidgetPopup
        isOpen={isWidgetOpen}
        onClose={() => {
          setIsWidgetOpen(false);
          setResumedWidgetState(null);
        }}
        onMinimize={handleMinimizeToBubble}
        onSaveRecording={handleSaveRecording}
        existingTags={allTags}
        onAddNewTag={handleAddNewTag}
        resumedState={resumedWidgetState}
      />

      {/* Android 17 Floating Bubble (Minimized state) */}
      {bubbleState?.isVisible && (
        <FloatingBubble
          isVisible={true}
          duration={bubbleState.duration}
          title={bubbleState.title}
          onExpand={handleExpandBubble}
          onDismiss={() => {
            setBubbleState(null);
            showToast('Floating bubble dismissed.');
          }}
        />
      )}

      {/* Recording Detail Modal */}
      <RecordingDetailModal
        recording={selectedRecording}
        onClose={() => setSelectedRecording(null)}
        onDelete={handleDeleteRecording}
        onOpenQuickShare={() => setIsBulkShareOpen(true)}
      />

      {/* Bulk Quick Share Modal */}
      <BulkQuickShareModal
        isOpen={isBulkShareOpen}
        onClose={() => setIsBulkShareOpen(false)}
        recordings={recordings}
      />

      {/* Android 17 Native Code Modal */}
      <AndroidCodeModal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
      />
    </div>
  );
}
