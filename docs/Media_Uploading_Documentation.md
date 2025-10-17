## Media Uploading Documentation

### Overview
This document describes how media (images, videos, files) are selected, uploaded, displayed, and stored across the FriendsLeague app. It covers mobile client behavior, backend interfaces, S3 usage, and UX patterns such as preview-first sending and background uploading.

### Goals
- Fast perceived sending with instant previews
- Reliable, resumable uploads to S3 via presigned URLs
- Reasonable bandwidth/storage via client-side image compression
- Clean separation of concerns between UI, upload service, and API

### Client Components and Services

1) MediaService (`mobile/src/services/mediaService.ts`)
- Selection:
  - `pickImage`, `takePhoto`: full-frame selection (no crop), quality=1
  - `pickVideo`: no trimming UI
  - `pickDocument`: generic file picker
- Compression:
  - Images larger than 500KB are compressed to longest edge 2048px at ~0.78 JPEG quality
  - Smart compression thresholds
- Upload:
  - `getPresignedUrl` requests upload URL from `/upload/presigned-url`
  - `uploadToS3` performs PUT upload with progress and exponential backoff
  - `uploadMedia` orchestrates compression + presign + upload; returns final media URL
- Utilities:
  - S3 URL region normalization
  - File size formatting
  - Save/share helpers for media viewing

2) MediaPicker (`mobile/src/components/MediaPicker.tsx`)
- UX:
  - Small popover menu for camera/photos/video/document
  - Emits `onPreviewSelected(localUri, type)` immediately after user picks a file
  - Starts background upload and then calls `onMediaSelected(mediaUrl, type, localUri)` on completion
  - Uploading UI is suppressed during preview-first (no blocking spinners)

3) ChatScreen (`mobile/src/screens/ChatScreen.tsx`)
- Provisional message:
  - On `onPreviewSelected`, inserts a temporary message with id `temp-<timestamp>` and `mediaUrl=localUri`
  - Renders instantly so the user sees the media bubble immediately
- Finalization:
  - On `onMediaSelected`, removes the provisional bubble and calls backend `sendMessage(chatId, '', type, mediaUrl)`
  - Broadcasts via socket as before

4) MessageMedia (`mobile/src/components/MessageMedia.tsx`)
- Rendering:
  - Maintains natural aspect ratio for images and video thumbnails (non-square)
  - Videos: generates thumbnail via `expo-video-thumbnails` and offers fullscreen `expo-av` playback
  - Files: PDF in-app via `WebView` with Download/Share/Open actions; other files open action sheet
  - Optional `pending` overlay supported for future “Sending…” state

### Backend Interfaces
- POST `/upload/presigned-url` → returns `{ uploadUrl, mediaUrl, key }`
- POST `/chats/:chatId/messages` → `content`, `type` in `['TEXT','IMAGE','VIDEO','FILE']`, optional `mediaUrl`, `replyToId`
- The backend validates media URLs (S3Service) and persists messages with Prisma

### Data Flow
1. User selects/captures media on device.
2. App emits a provisional message to UI with `localUri`.
3. App requests presigned URL and uploads to S3 in background.
4. On success, the provisional message is removed and a real message is created via API with the final `mediaUrl`.
5. Socket event notifies room; other clients render media.

### Performance Notes
- Client-side image compression reduces upload time and data costs.
- Preview-first reduces perceived latency.
- For further optimization consider:
  - S3 Multipart Upload with parallel parts (resumable)
  - S3 Transfer Acceleration
  - Server-side video renditions (MediaConvert) and CDN caching

### Error Handling
- Upload retry with exponential backoff
- Graceful fallbacks in viewers (open in browser, share, save)
- If background upload fails, the provisional remains only locally; user can retry by re-sending.

### Security
- Auth required for message endpoints (JWT)
- Presigned URL scoped by type/size and short TTL
- S3 key placed under `media/<category>/<timestamp>-<uuid>.<ext>`

### Types
- Message types align across client and server: `'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE'`
- Socket events: `joinChat`, `sendMessage`, `newMessage`, `user:typing`, `user:offline`

### Testing Checklist
- Select photo/video/document; preview appears instantly
- Upload completes and replaces provisional with final message
- Open image fullscreen, video playback, PDF viewer, and file actions
- Thumbnails and images maintain correct aspect ratio
- Reactions, replies, typing indicators unaffected

### Future Enhancements
- Multipart uploads with resume
- Background queue with retries across app restarts
- Server-side video transcoding with HLS and multiple qualities
- Media cache and prefetch for smooth scrolling

