# Voice Notes Implementation Plan

## Technology Choice: expo-av

Using **expo-av** (already installed) for voice recording and playback because:

- Already in dependencies - zero additional packages needed
- Most stable and battle-tested in Expo ecosystem
- Excellent TypeScript support
- Handles both recording and playback with unified API
- Native M4A support on iOS/Android
- Proven track record with minimal bugs

## Architecture Overview

Following your modularization principles, the implementation will be split into focused, reusable modules:

### 1. Backend Changes

**Update Prisma Schema** - Add `VOICE` to MessageType enum:

```prisma
enum MessageType {
  TEXT
  IMAGE
  VIDEO
  FILE
  VOICE
}
```

**Migration**: Generate and apply Prisma migration to update database schema.

### 2. Frontend Service Layer

**Create `audioService.ts`** (~250 lines) - Core audio recording/playback logic:

- Audio recording with expo-av's `Audio.Recording`
- M4A format output (native iOS/Android support)
- Audio permission handling
- File metadata extraction (duration)
- Upload to S3 via existing MediaService pattern
- Audio playback management with speed controls (1x, 1.5x, 2x)

### 3. Custom Hooks

**Create `useVoiceRecorder.ts`** (~100 lines) - Recording state management:

- Recording state (idle, recording, uploading)
- Duration tracking during recording
- Start/stop recording logic
- Upload progress integration
- Cleanup on unmount

**Create `useAudioPlayer.ts`** (~100 lines) - Playback state management:

- Play/pause/stop controls
- Current position and duration tracking
- Playback speed control (1x, 1.5x, 2x)
- Multiple audio instance management (pause others when playing new)

### 4. UI Components

**Create `VoiceRecorder.tsx`** (~200 lines) - WhatsApp-style recording button:

- Long-press gesture to start recording
- Slide-to-cancel interaction (slide left to cancel)
- Visual feedback: pulsing mic icon, timer, waveform animation
- Release to send, slide left to cancel
- Upload progress indicator

**Create `VoiceMessagePlayer.tsx`** (~150 lines) - Playback UI for voice messages:

- Waveform visualization (static, styled bars)
- Play/pause button with animated icon
- Duration and current time display
- Playback speed toggle button (1x → 1.5x → 2x → 1x)
- Progress slider

### 5. Integration Points

**Update `ChatScreen.tsx`**:

- Add VoiceRecorder component next to MediaPicker
- Handle voice message send via existing `sendMessage` function
- Render VoiceMessagePlayer for `type: 'VOICE'` messages

**Update `useMediaSelection.ts`**:

- Add support for 'VOICE' type (minimal changes)

**Update `chatApi.ts`**:

- Update Message type to include 'VOICE' in union type

**Update `MessageMedia.tsx`**:

- Add voice message rendering case

## Implementation Details

### Audio Recording Flow

1. User long-presses microphone button
2. Request audio permissions (if not granted)
3. Start recording with expo-av
4. Show recording UI with timer and cancel slider
5. On release: Stop recording → Upload to S3 → Send message
6. On slide-left: Cancel recording and delete temp file

### Audio Playback Flow

1. User taps play on voice message
2. Load audio from S3 URL
3. Play audio with current speed setting
4. Update progress UI in real-time
5. Pause other playing audios (single playback at a time)
6. Support speed toggle: 1x → 1.5x → 2x → 1x

### File Structure

```
mobile/src/
├── services/
│   └── audioService.ts          (NEW - core audio logic)
├── hooks/
│   ├── useVoiceRecorder.ts      (NEW - recording state)
│   └── useAudioPlayer.ts        (NEW - playback state)
├── components/
│   ├── VoiceRecorder.tsx        (NEW - recording UI)
│   └── VoiceMessagePlayer.tsx   (NEW - playback UI)
└── screens/
    └── ChatScreen.tsx           (UPDATE - integrate components)
```

### Key Technical Decisions

1. **M4A Format**: Native support, excellent compression, ~1MB per minute
2. **Single Audio Instance**: Only one voice note plays at a time (WhatsApp pattern)
3. **Slide Distance**: 100px slide-left to cancel (standard UX)
4. **Max Duration**: 5 minutes per voice note (prevent abuse)
5. **Sample Rate**: 44.1kHz for quality, AAC codec for compression

## Type Safety

All new code will use strict TypeScript:

- Explicit return types for all functions
- Proper error handling with typed errors
- No `any` types
- Interface definitions for all props and state