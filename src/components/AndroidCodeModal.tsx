import React, { useState } from 'react';
import { X, Copy, Check, Code, FileText, Smartphone } from 'lucide-react';

interface AndroidCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidCodeModal: React.FC<AndroidCodeModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'manifest' | 'activity' | 'widget' | 'audio'>('activity');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const codeSnippets = {
    activity: `// RecordingPopupActivity.kt - Android 17 Translucent Dialog & Bubble
package com.example.voicerecorder.ui.popup

import android.app.*
import android.content.Intent
import android.graphics.drawable.Icon
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.ViewGroup
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.core.app.NotificationCompat
import com.example.voicerecorder.R

class RecordingPopupActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Android 17 Lockscreen Bypass Flags
        setShowWhenLocked(true)
        setTurnScreenOn(true)

        // Center window with dynamic wrap height
        window.setLayout(
            (resources.displayMetrics.widthPixels * 0.90).toInt(),
            ViewGroup.LayoutParams.WRAP_CONTENT
        )
        window.setGravity(Gravity.CENTER)
        window.setBackgroundDrawableResource(android.R.color.transparent)

        setContent {
            PaperTheme {
                // Renders the 3 screens (1. Recording lines & timer, 2. Title & Note, 3. Tags)
                PopupNavigator(
                    onClose = { finish() },
                    onMinimize = { minimizeToAndroidBubble() }
                )
            }
        }
    }

    private fun minimizeToAndroidBubble() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            val channelId = "bubble_channel"
            val notificationManager = getSystemService(NotificationManager::class.java)
            val channel = NotificationChannel(channelId, "Active Record", NotificationManager.IMPORTANCE_HIGH)
            notificationManager.createNotificationChannel(channel)

            val bubbleIntent = Intent(this, RecordingPopupActivity::class.java)
            val bubblePendingIntent = PendingIntent.getActivity(this, 0, bubbleIntent, PendingIntent.FLAG_MUTABLE)

            val bubbleData = NotificationCompat.BubbleMetadata.Builder(bubblePendingIntent, Icon.createWithResource(this, R.drawable.ic_mic))
                .setDesiredHeight(600)
                .setAutoExpandBubble(true)
                .setSuppressNotification(true)
                .build()

            val notification = NotificationCompat.Builder(this, channelId)
                .setContentTitle("Recording Active")
                .setSmallIcon(R.drawable.ic_mic)
                .setBubbleMetadata(bubbleData)
                .build()

            notificationManager.notify(101, notification)
            finish()
        }
    }
}`,
    widget: `// VoiceWidgetProvider.kt - 1x1 Lockscreen Widget
package com.example.voicerecorder.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import com.example.voicerecorder.R
import com.example.voicerecorder.ui.popup.RecordingPopupActivity

class VoiceWidgetProvider : AppWidgetProvider() {
    override fun onUpdate(context: Context, appWidgetManager: AppWidgetManager, appWidgetIds: IntArray) {
        for (widgetId in appWidgetIds) {
            val intent = Intent(context, RecordingPopupActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            }
            val pendingIntent = PendingIntent.getActivity(
                context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
            )

            val views = RemoteViews(context.packageName, R.layout.widget_1x1_layout).apply {
                setOnClickPendingIntent(R.id.widget_button, pendingIntent)
            }
            appWidgetManager.updateAppWidget(widgetId, views)
        }
    }
}`,
    manifest: `<!-- AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <application
        android:name=".VoiceRecorderApp"
        android:theme="@style/Theme.PaperApp">

        <!-- Translucent Dialog over Lockscreen with Bubble support -->
        <activity
            android:name=".ui.popup.RecordingPopupActivity"
            android:exported="true"
            android:showWhenLocked="true"
            android:turnScreenOn="true"
            android:allowEmbedded="true"
            android:resizeableActivity="true"
            android:theme="@style/Theme.TransparentDialog" />

        <!-- 1x1 Lockscreen Widget Receiver -->
        <receiver
            android:name=".widget.VoiceWidgetProvider"
            android:exported="true">
            <intent-filter>
                <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
            </intent-filter>
            <meta-data
                android:name="android.appwidget.provider"
                android:resource="@xml/voice_widget_info" />
        </receiver>

    </application>
</manifest>`,
    audio: `// AudioRecordingManager.kt - MP3 Audio Recorder with MediaRecorder
package com.example.voicerecorder.audio

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import java.io.File
import java.io.FileOutputStream

class AudioRecordingManager(private val context: Context) {
    private var recorder: MediaRecorder? = null
    var currentOutputFile: File? = null

    fun startRecording(): File {
        val file = File(context.filesDir, "REC_\${System.currentTimeMillis()}.mp3")
        currentOutputFile = file

        recorder = (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            MediaRecorder(context)
        } else {
            @Suppress("DEPRECATION")
            MediaRecorder()
        }).apply {
            setAudioSource(MediaRecorder.AudioSource.MIC)
            setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
            setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
            setAudioEncodingBitRate(128000)
            setAudioSamplingRate(44100)
            setOutputFile(FileOutputStream(file).fd)
            prepare()
            start()
        }
        return file
    }

    fun getAmplitude(): Int = recorder?.maxAmplitude ?: 0
    fun pause() { recorder?.pause() }
    fun resume() { recorder?.resume() }
    fun stop() { recorder?.stop(); recorder?.release(); recorder = null }
}`,
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(codeSnippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
      <div className="paper-sheet paper-card relative flex h-[85vh] w-full max-w-3xl flex-col rounded-2xl border-2 border-[#111111] p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E5E0D8] pb-3">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-[#111111]" />
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[#111111]">
              Android 17 Native Source Files
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#111111] bg-white text-[#111111] hover:bg-[#F3EFE6]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E0D8] pb-2">
          <div className="flex rounded-lg border border-[#111111] bg-white p-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-bold ${
                activeTab === 'activity' ? 'bg-[#111111] text-white' : 'text-[#111111]'
              }`}
            >
              RecordingPopupActivity.kt
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('widget')}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-bold ${
                activeTab === 'widget' ? 'bg-[#111111] text-white' : 'text-[#111111]'
              }`}
            >
              VoiceWidgetProvider.kt
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manifest')}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-bold ${
                activeTab === 'manifest' ? 'bg-[#111111] text-white' : 'text-[#111111]'
              }`}
            >
              AndroidManifest.xml
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('audio')}
              className={`rounded-md px-3 py-1.5 font-mono text-xs font-bold ${
                activeTab === 'audio' ? 'bg-[#111111] text-white' : 'text-[#111111]'
              }`}
            >
              AudioRecorder.kt
            </button>
          </div>

          <button
            type="button"
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 rounded-lg border border-[#111111] bg-white px-3 py-1.5 font-mono text-xs font-bold text-[#111111] hover:bg-[#F3EFE6]"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copied Code' : 'Copy File'}</span>
          </button>
        </div>

        {/* Code Content */}
        <div className="mt-3 flex-1 overflow-auto rounded-xl border border-[#111111] bg-[#1E1E1E] p-4 font-mono text-xs text-[#D4D4D4]">
          <pre>{codeSnippets[activeTab]}</pre>
        </div>
      </div>
    </div>
  );
};
