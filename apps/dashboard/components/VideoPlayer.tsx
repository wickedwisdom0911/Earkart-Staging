"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize, Download, Info } from 'lucide-react';

// Dynamically import ReactPlayer/lazy for file support
const ReactPlayer = dynamic(() => import('react-player/lazy'), { ssr: false });

interface VideoPlayerProps {
  url: string;
  onError?: (error: any) => void;
  playlist?: Array<{ url: string; title: string }>;
  currentIndex?: number;
  onPlaylistNext?: () => void;
}

// Format seconds to mm:ss or hh:mm:ss
const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export function VideoPlayer({ url, onError, playlist, currentIndex, onPlaylistNext }: VideoPlayerProps) {
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [useNative, setUseNative] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [played, setPlayed] = useState(0);
  const [loaded, setLoaded] = useState(0); // Track buffered portion
  const [duration, setDuration] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSeekWarning, setShowSeekWarning] = useState(false);
  const playerRef = useRef<any>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleProgress = (state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
      setLoaded(state.loaded);
    }
  };

  const handleDuration = (dur: number) => {
    setDuration(dur);
  };

  // Download video function - opens in new tab for native download
  const handleDownload = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    // Open URL directly - browser will handle download or playback
    // User can then use "Save As" to download, or play in browser with native controls
    window.open(url, '_blank');
  };

  // Open in VLC or external player (copy URL)
  const handleCopyUrl = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      alert('URL copied! Paste in VLC or another media player for better seeking.\n\nIn VLC: Media → Open Network Stream → Paste URL');
    } catch (err) {
      console.error('Copy failed:', err);
      // Fallback
      prompt('Copy this URL and open in VLC for better seeking:', url);
    }
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement>) => {
    setSeeking(false);
    const target = e.target as HTMLInputElement;
    playerRef.current?.seekTo(parseFloat(target.value), 'fraction');
  };

  const handleProgressBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Prevent triggering play/pause
    if (!progressRef.current || !playerRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const clampedPosition = Math.max(0, Math.min(1, clickPosition));
    
    // Check if trying to seek beyond buffered content
    if (clampedPosition > loaded + 0.01) {
      console.log('⚠️ Cannot seek beyond buffered content. Loaded:', loaded, 'Requested:', clampedPosition);
      setShowSeekWarning(true);
      setTimeout(() => setShowSeekWarning(false), 3000);
      // Still try to seek - might work for some videos
    }
    
    console.log('🎯 Seeking to position:', clampedPosition, 'of duration:', duration, 'loaded:', loaded);
    setPlayed(clampedPosition);
    playerRef.current.seekTo(clampedPosition, 'fraction');
  }, [duration, loaded]);

  const skipForward = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent triggering play/pause
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      const newTime = Math.min(currentTime + 10, duration);
      console.log('⏩ Skip forward from', currentTime, 'to', newTime);
      playerRef.current.seekTo(newTime, 'seconds');
    }
  };

  const skipBackward = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent triggering play/pause
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      const newTime = Math.max(currentTime - 10, 0);
      console.log('⏪ Skip backward from', currentTime, 'to', newTime);
      playerRef.current.seekTo(newTime, 'seconds');
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPlaying(!playing);
  };

  const toggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setMuted(!muted);
  };

  const handleFullscreen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const container = document.querySelector('.video-player-container');
    if (container) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        container.requestFullscreen();
      }
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) {
        setShowControls(false);
      }
    }, 3000);
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

  const currentTime = played * duration;

  return (
    <div 
      className="video-player-container w-full h-full flex flex-col bg-black relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      {/* Video Area */}
      <div className="flex-1 flex items-center justify-center relative" onClick={togglePlay}>
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={playing}
          volume={volume}
          muted={muted}
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
            setPlaying(true);
          }}
          onPause={() => {
            console.log('⏸️ Video paused');
            setPlaying(false);
          }}
          onError={handleError}
          onProgress={handleProgress}
          onDuration={handleDuration}
          onBuffer={() => {
            console.log('⏳ Video buffering...');
          }}
          onBufferEnd={() => {
            console.log('✅ Buffering ended');
          }}
          onEnded={() => {
            console.log('🏁 Video ended');
            setPlaying(false);
            if (hasNext && onPlaylistNext) {
              console.log('⏭️ Auto-playing next video in playlist...');
              setTimeout(() => onPlaylistNext(), 500);
            }
          }}
        />
      </div>

      {/* Custom Controls */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent px-4 pb-4 pt-8 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Seek Warning */}
        {showSeekWarning && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-500/90 text-black px-4 py-3 rounded-lg text-sm font-medium z-50 max-w-md text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Info className="w-4 h-4" />
              <span>Seeking Limited</span>
            </div>
            <p className="text-xs">WebM recordings have limited seeking. Click "VLC" button to copy URL and play in VLC media player for full seeking.</p>
          </div>
        )}

        {/* Progress Bar */}
        <div 
          ref={progressRef}
          className="w-full h-2 bg-gray-700 rounded-full cursor-pointer mb-3 group relative"
          onClick={handleProgressBarClick}
          title={`Buffered: ${Math.round(loaded * 100)}% - Click within gray area to seek`}
        >
          {/* Buffered/Loaded portion (gray) */}
          <div 
            className="absolute h-full bg-gray-400 rounded-full"
            style={{ width: `${loaded * 100}%` }}
          />
          {/* Played portion (purple) */}
          <div 
            className="absolute h-full bg-purple-500 rounded-full"
            style={{ width: `${played * 100}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-3">
            {/* Skip Back */}
            <button 
              onClick={(e) => skipBackward(e)}
              className="text-white hover:text-purple-400 transition-colors p-1"
              title="Skip back 10s"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Play/Pause */}
            <button 
              onClick={(e) => togglePlay(e)}
              className="text-white hover:text-purple-400 transition-colors p-1"
            >
              {playing ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7" />
              )}
            </button>

            {/* Skip Forward */}
            <button 
              onClick={(e) => skipForward(e)}
              className="text-white hover:text-purple-400 transition-colors p-1"
              title="Skip forward 10s"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2 ml-2">
              <button 
                onClick={(e) => toggleMute(e)}
                className="text-white hover:text-purple-400 transition-colors p-1"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  setVolume(parseFloat(e.target.value));
                  setMuted(false);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-20 h-1 accent-purple-500 cursor-pointer"
              />
            </div>

            {/* Time Display */}
            <span className="text-white text-sm ml-3 font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Buffered indicator */}
            <span className="text-gray-400 text-xs">
              Buffered: {Math.round(loaded * 100)}%
            </span>

            {/* Open in new tab */}
            <button 
              onClick={handleDownload}
              className="text-white hover:text-purple-400 transition-colors p-1 flex items-center gap-1 bg-gray-600 hover:bg-gray-700 rounded px-2 py-1"
              title="Open in new tab"
            >
              <Download className="w-4 h-4" />
              <span className="text-xs font-medium">Open</span>
            </button>

            {/* Copy URL for VLC */}
            <button 
              onClick={handleCopyUrl}
              className="text-white hover:text-purple-400 transition-colors p-1 flex items-center gap-1 bg-purple-600 hover:bg-purple-700 rounded px-2 py-1"
              title="Copy URL to play in VLC for better seeking"
            >
              <Info className="w-4 h-4" />
              <span className="text-xs font-medium">VLC</span>
            </button>

            {/* Fullscreen */}
            <button 
              onClick={(e) => handleFullscreen(e)}
              className="text-white hover:text-purple-400 transition-colors p-1"
              title="Fullscreen"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
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

