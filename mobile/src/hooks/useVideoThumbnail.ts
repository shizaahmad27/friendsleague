// mobile/src/hooks/useVideoThumbnail.ts
import { useState, useEffect } from 'react';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { MediaService } from '../services/mediaService';

export const useVideoThumbnail = (videoUrl: string, type: 'IMAGE' | 'VIDEO' | 'FILE') => {
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    
    const generateThumbnail = async () => {
      if (type !== 'VIDEO' || !videoUrl) {
        setVideoThumbnail(null);
        return;
      }

      setIsLoading(true);
      try {
        const displayUrl = MediaService.validateAndFixS3Url(videoUrl);
        const { uri } = await VideoThumbnails.getThumbnailAsync(displayUrl, { time: 1000 });
        if (!cancelled) {
          setVideoThumbnail(uri);
        }
      } catch (error) {
        console.warn('Failed to generate video thumbnail:', error);
        if (!cancelled) {
          setVideoThumbnail(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    generateThumbnail();
    return () => { cancelled = true; };
  }, [videoUrl, type]);

  return { videoThumbnail, isLoading };
};
