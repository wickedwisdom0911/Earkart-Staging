"use client";

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import ReactPlayer/lazy for file support
const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

interface VideoPlayerProps {
  url: string;
  onError?: (error: any) => void;
  playlist?: Array<{ url: string; title: string }>;
  currentIndex?: number;
  onPlaylistNext?: () => void;
}

export function VideoPlayer({ url, onError, playlist, currentIndex, onPlaylistNext }: VideoPlayerProps) {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [useNative, setUseNative] = useState(false);
  const playerRef = useRef<any>(null);

  const isPlaylist = playlist && playlist.length > 1;
  const hasNext = isPlaylist && currentIndex !== undefined && currentIndex < playlist.length - 1;

  console.log('🎬 VideoPlayer rendering with URL:', url);
  if (isPlaylist) {
    console.log(`📋 Playlist mode: ${currentIndex! + 1}/${playlist.length}`, { hasNext });
  }

  const handleError = (error: any) => {
    console.error('❌ ReactPlayer error:', {
      error,
      url,
      type: typeof error,
      message: error?.message,
      code: error?.code
    });
    setHasError(true);
    
    // Try native video player as fallback
    setTimeout(() => {
      console.log('🔄 Switching to native video player...');
      setUseNative(true);
    }, 1000);
    
    if (onError) onError(error);
  };

  // If ReactPlayer fails, try native HTML5 video
  if (useNative) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <video
          src={url}
          controls
          autoPlay
          className="w-full h-full"
          style={{ maxHeight: '100%', objectFit: 'contain' }}
          onLoadStart={() => console.log('🎬 Native video loading...')}
          onLoadedMetadata={() => console.log('✅ Native video metadata loaded')}
          onCanPlay={() => console.log('✅ Native video can play')}
          onError={(e: any) => {
            const video = e.target as HTMLVideoElement;
            console.error('❌ Native video error:', {
              error: video.error,
              errorCode: video.error?.code,
              errorMessage: video.error?.message,
              networkState: video.networkState,
              readyState: video.readyState
            });
          }}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-black relative">
      <ReactPlayer
        ref={playerRef}
        url={url}
        controls
        playing
        width="100%"
        height="100%"
        style={{ maxHeight: '100%' }}
        config={{
          file: {
            attributes: {
              crossOrigin: 'anonymous',
              preload: 'auto',
            },
            forceVideo: true,
            forceAudio: false,
            hlsOptions: {},
          },
        }}
        onReady={() => {
          console.log('✅ ReactPlayer ready');
          setIsReady(true);
          setHasError(false);
        }}
        onStart={() => {
          console.log('▶️ Video started playing');
        }}
        onPlay={() => {
          console.log('▶️ Video is playing');
        }}
        onPause={() => {
          console.log('⏸️ Video paused');
        }}
        onError={handleError}
        onBuffer={() => {
          console.log('⏳ Video buffering...');
        }}
        onBufferEnd={() => {
          console.log('✅ Buffering ended');
        }}
        onEnded={() => {
          console.log('🏁 Video ended');
          if (hasNext && onPlaylistNext) {
            console.log('⏭️ Auto-playing next video in playlist...');
            setTimeout(() => onPlaylistNext(), 500);
          }
        }}
      />
      {!isReady && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 pointer-events-none">
          <div className="text-white text-center">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm">Loading video...</p>
            <p className="text-xs text-gray-400 mt-2 max-w-md break-all px-4">{url}</p>
          </div>
        </div>
      )}
    </div>
  );
}

