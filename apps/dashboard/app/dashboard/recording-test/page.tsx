"use client";

import { useState, useEffect, useCallback } from "react";
import { useScreenRecordingUpload } from "@/hooks/recording/use-screen-recording-upload";
import { chunkStorage } from "@/lib/indexeddb-chunks";
import { TestVideoGenerator, type TestVideoChunk } from "@/lib/test-video-generator";

export default function RecordingTestPage() {
  // Allow using a real consultation ID from URL params, or create one persistent ID per session
  const [consultationId, setConsultationId] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlId = urlParams.get('consultationId');
      if (urlId) return urlId;
      
      // Check if we have a persistent test ID for this session
      const sessionStorageKey = 'test-consultation-id';
      const existingId = sessionStorage.getItem(sessionStorageKey);
      if (existingId) {
        console.log(`🔄 [TEST_PAGE] Using existing session consultation ID: ${existingId}`);
        return existingId;
      }
      
      // Create new persistent ID for this browser session
      const newId = "test-consultation-" + Date.now();
      sessionStorage.setItem(sessionStorageKey, newId);
      console.log(`🆕 [TEST_PAGE] Created new session consultation ID: ${newId}`);
      return newId;
    }
    return "test-consultation-" + Date.now();
  });
  
  const { state: recordingState, start, stop, complete, abort } = useScreenRecordingUpload(consultationId);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [testGenerator, setTestGenerator] = useState<TestVideoGenerator | null>(null);
  const [downloadableUrl, setDownloadableUrl] = useState<string | null>(null);
  const [isCreatingDownload, setIsCreatingDownload] = useState(false);
  const [savedRecordings, setSavedRecordings] = useState<any[]>([]);
  const [realRecordings, setRealRecordings] = useState<any[]>([]);
  const [idInput, setIdInput] = useState<string>("");

  const refreshStats = async () => {
    try {
      const stats = await chunkStorage.getStorageStats();
      setStorageStats(stats);
    } catch (err) {
      console.error("Failed to get storage stats:", err);
    }
  };

  const clearStorage = async () => {
    try {
      await chunkStorage.clearOldChunks(0); // Clear all
      await refreshStats();
      console.log("Storage cleared");
    } catch (err) {
      console.error("Failed to clear storage:", err);
    }
  };

  const handleStartRecording = () => {
    start({
      filename: `test-recording-${Date.now()}.webm`,
      timesliceMs: 3000,
      maxConcurrentUploads: 3,
      requireEntireScreen: true,
      captureMic: true,
      captureSystemAudio: false
    });
  };

  const handleStartTestVideoGeneration = async () => {
    if (isGeneratingTest) return;
    
    setIsGeneratingTest(true);
    console.log("🎬 [TEST_VIDEO] Starting synthetic video generation...");

    try {
      // Create and start test video generator
      const generator = new TestVideoGenerator();
      setTestGenerator(generator);

      // Generate test video with realistic chunks
      await generator.generateTestRecording(
        {
          durationMs: 30000, // 30 seconds
          width: 1280,
          height: 720,
          fps: 15,
          chunkDurationMs: 3000, // 3-second chunks like real recording
          includeAudio: true
        },
        async (chunk: TestVideoChunk) => {
          // Simulate the recording upload system by manually processing chunks
          console.log(`📊 [TEST_VIDEO] Processing synthetic chunk ${chunk.chunkIndex}: ${(chunk.size / 1024).toFixed(1)}KB`);
          
          // Initialize upload session on first chunk
          if (chunk.chunkIndex === 0) {
            await start({
              filename: `synthetic-test-${Date.now()}.webm`,
              timesliceMs: 3000,
              maxConcurrentUploads: 3,
              requireEntireScreen: false,
              captureMic: false,
              captureSystemAudio: false
            });
          }
          
          // Process chunk through the upload system
          // Note: In a real implementation, we'd need to hook into the MediaRecorder ondataavailable
          // For now, this demonstrates the chunk generation concept
        },
        () => {
          console.log("✅ [TEST_VIDEO] Synthetic video generation complete");
          setIsGeneratingTest(false);
          setTestGenerator(null);
          // Auto-stop the recording
          setTimeout(() => {
            stop();
          }, 1000);
        }
      );

    } catch (error) {
      console.error("❌ [TEST_VIDEO] Failed to generate test video:", error);
      setIsGeneratingTest(false);
      setTestGenerator(null);
    }
  };

  const handleStopTestVideo = () => {
    if (testGenerator) {
      testGenerator.stop();
      setTestGenerator(null);
    }
    setIsGeneratingTest(false);
    stop();
  };

  const createDownloadableRecording = async () => {
    if (isCreatingDownload) return;
    
    setIsCreatingDownload(true);
    console.log("📹 [DOWNLOAD] Creating downloadable recording from IndexedDB chunks...");

    try {
      console.log(`📹 [DOWNLOAD] Querying chunks for consultation: ${consultationId}`);
      
      // Get all chunks for this consultation
      const allChunks = await chunkStorage.getAllChunksForSession(consultationId);
      
      console.log(`📹 [DOWNLOAD] Query returned:`, allChunks);
      
      if (allChunks.length === 0) {
        alert("No recording chunks found! Please record something first.");
        setIsCreatingDownload(false);
        return;
      }

      console.log(`📹 [DOWNLOAD] Found ${allChunks.length} chunks to combine`);
      
      // Sort chunks by timestamp to ensure correct order
      allChunks.sort((a, b) => a.timestamp - b.timestamp);
      
      // Combine all blobs into one
      const blobs = allChunks.map(chunk => chunk.blob);
      const combinedBlob = new Blob(blobs, { type: 'video/webm' });
      
      const sizeInMB = (combinedBlob.size / (1024 * 1024)).toFixed(2);
      console.log(`📹 [DOWNLOAD] Combined ${allChunks.length} chunks into ${sizeInMB}MB video`);
      
      // Create downloadable URL
      const url = URL.createObjectURL(combinedBlob);
      setDownloadableUrl(url);
      
      console.log("✅ [DOWNLOAD] Downloadable URL created successfully!");
      
    } catch (error) {
      console.error("❌ [DOWNLOAD] Failed to create downloadable recording:", error);
      console.error("❌ [DOWNLOAD] Error details:", {
        message: error?.message,
        stack: error?.stack,
        consultationId,
        name: error?.name
      });
      alert(`Failed to create downloadable recording: ${error?.message || 'Unknown error'}. Check console for details.`);
    }
    
    setIsCreatingDownload(false);
  };

  const downloadRecording = () => {
    if (!downloadableUrl) return;
    
    const link = document.createElement('a');
    link.href = downloadableUrl;
    link.download = `test-recording-${consultationId}-${Date.now()}.webm`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log("📥 [DOWNLOAD] Recording download initiated");
  };

  const clearDownloadUrl = () => {
    if (downloadableUrl) {
      URL.revokeObjectURL(downloadableUrl);
      setDownloadableUrl(null);
      console.log("🗑️ [DOWNLOAD] Download URL cleared");
    }
  };

  // Save a completed recording to the consultation's recordings array
  const saveRecordingToArray = useCallback((playbackUrl: string, type: string = 'test') => {
    if (!playbackUrl || typeof window === 'undefined') return;
    
    try {
      const storageKey = `test_recordings_${consultationId}`;
      const saved = localStorage.getItem(storageKey) || '[]';
      const recordings = JSON.parse(saved);
      
      // Check if this URL already exists
      const urlExists = recordings.some((r: any) => r.url === playbackUrl);
      if (urlExists) {
        console.log("⚠️ [RECORDINGS] URL already exists, skipping:", playbackUrl);
        return;
      }
      
      const newRecording = {
        id: `test-recording-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        url: playbackUrl,
        timestamp: new Date().toISOString(),
        type,
        name: `${type === 'screen' ? 'Screen' : type === 'synthetic' ? 'Synthetic' : 'Test'} Recording ${recordings.length + 1}`,
        source: 'test_page'
      };
      
      recordings.push(newRecording);
      localStorage.setItem(storageKey, JSON.stringify(recordings));
      setSavedRecordings(recordings);
      
      console.log("💾 [RECORDINGS] ✅ Successfully saved recording:", playbackUrl);
      console.log("📋 [RECORDINGS] Total recordings now:", recordings.length);
      
      // Mirror into real consultation recordings array to simulate backend flow
      const realKey = `recordings_${consultationId}`;
      const realSaved = localStorage.getItem(realKey) || '[]';
      const realList = JSON.parse(realSaved);
      const realExists = realList.some((r: any) => r.url === playbackUrl);
      if (!realExists) {
        const realRecording = {
          id: `recording_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          url: playbackUrl,
          timestamp: new Date().toISOString(),
          type: type === 'synthetic' ? 'synthetic' : 'screen',
          name: `${type === 'synthetic' ? 'Synthetic' : 'Screen'} Recording ${realList.length + 1}`,
          source: 'test_page_mirror'
        };
        realList.push(realRecording);
        localStorage.setItem(realKey, JSON.stringify(realList));
        setRealRecordings(realList);
        console.log('💾 [REAL] ✅ Mirrored to recordings_ array:', realRecording);
      }

    } catch (error) {
      console.error("❌ [RECORDINGS] Failed to save recording:", error);
    }
  }, [consultationId]);

  // Load saved recordings for this consultation
  const loadSavedRecordings = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`test_recordings_${consultationId}`);
        const recordings = saved ? JSON.parse(saved) : [];
        setSavedRecordings(recordings);
        console.log(`📋 [RECORDINGS] Loaded ${recordings.length} saved recordings for ${consultationId}`);
      } catch (error) {
        console.error('Failed to load saved recordings:', error);
        setSavedRecordings([]);
      }
    }
  }, [consultationId]);

  const loadRealRecordings = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`recordings_${consultationId}`);
        const recordings = saved ? JSON.parse(saved) : [];
        setRealRecordings(recordings);
        console.log(`📋 [REAL] Loaded ${recordings.length} consultation recordings for ${consultationId}`);
      } catch (error) {
        console.error('Failed to load real consultation recordings:', error);
        setRealRecordings([]);
      }
    }
  }, [consultationId]);

  // Auto-refresh storage stats on mount and periodically
  useEffect(() => {
    // Initial load
    refreshStats();
    loadSavedRecordings();
    loadRealRecordings();
    
    // Refresh every 3 seconds to keep UI updated
    const interval = setInterval(refreshStats, 3000);
    
    return () => clearInterval(interval);
  }, [loadSavedRecordings, loadRealRecordings]);

  // Auto-complete on refresh if there is a recoverable active session
  useEffect(() => {
    const run = async () => {
      try {
        // If there is an uploadId and we are not actively recording, attempt a completion
        if (recordingState.uploadId && !recordingState.isRecording) {
          console.log('⏱️ [AUTO_COMPLETE] Detected active upload after refresh. Attempting completion...');
          const result = await complete();
          if (result?.playbackUrl) {
            const recordingType = result.playbackUrl.startsWith('mock://') ? 'synthetic' : 'screen';
            console.log('✅ [AUTO_COMPLETE] Completed after refresh. URL:', result.playbackUrl);
            // Auto-save into arrays
            saveRecordingToArray(result.playbackUrl, recordingType);
          } else {
            console.log('ℹ️ [AUTO_COMPLETE] No playbackUrl returned on completion.');
          }
        }
      } catch (e) {
        console.warn('⚠️ [AUTO_COMPLETE] Completion after refresh failed:', e);
      }
    };

    // Run once on mount when state is ready
    // Delay slightly to let recovery finish resuming any pending chunks
    const t = setTimeout(run, 1200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save completed recordings
  useEffect(() => {
    if (recordingState.playbackUrl && 
        !recordingState.isRecording && 
        !recordingState.isUploading && 
        recordingState.playbackUrl !== '') {
      
      // Check if already saved
      const alreadyExists = savedRecordings.some((r: any) => r.url === recordingState.playbackUrl);
      
      if (!alreadyExists) {
        console.log("💾 [RECORDINGS] Auto-saving completed recording:", recordingState.playbackUrl);
        const recordingType = recordingState.playbackUrl?.startsWith('mock://') ? 'synthetic' : 'screen';
        saveRecordingToArray(recordingState.playbackUrl, recordingType);
      }
    }
  }, [recordingState.playbackUrl, recordingState.isRecording, recordingState.isUploading, savedRecordings, saveRecordingToArray]);

  // Cleanup download URL on unmount
  useEffect(() => {
    return () => {
      if (downloadableUrl) {
        URL.revokeObjectURL(downloadableUrl);
      }
    };
  }, [downloadableUrl]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🎬 Recording System Test Page
        </h1>

        {/* Quick Consultation ID Controls (always visible) */}
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-blue-900 text-sm font-medium">Consultation ID:</span>
            <code className="bg-blue-100 px-2 py-1 rounded text-blue-900 text-sm">{consultationId}</code>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={idInput}
              onChange={(e) => setIdInput(e.target.value)}
              placeholder="Enter consultation ID"
              className="px-3 py-1 border border-blue-300 rounded text-sm flex-1 min-w-[240px]"
            />
            <button
              onClick={() => {
                const value = idInput.trim();
                if (value) {
                  setConsultationId(value);
                  sessionStorage.setItem('test-consultation-id', value);
                  window.history.replaceState(null, '', `?consultationId=${encodeURIComponent(value)}`);
                  console.log(`🔁 [TEST_PAGE] Switched consultation ID to: ${value}`);
                }
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              Set ID
            </button>
            <button
              onClick={() => {
                const newId = "test-consultation-" + Date.now();
                setConsultationId(newId);
                sessionStorage.setItem('test-consultation-id', newId);
                window.history.replaceState(null, '', `?consultationId=${encodeURIComponent(newId)}`);
                console.log(`🆕 [TEST_PAGE] Generated new consultation ID: ${newId}`);
                setIdInput("");
              }}
              className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
            >
              New Test ID
            </button>
          </div>
          <p className="text-blue-700 text-xs mt-2">This ID persists across refresh (sessionStorage + URL) so all recordings append to the same consultation array.</p>
        </div>
        
        {/* Refresh Test Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-blue-900 mb-3">🔄 Refresh Test Instructions</h2>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>Step 1:</strong> Click "Generate Test Video (30s)" to start synthetic recording</p>
            <p><strong>Step 2:</strong> Wait for 10-15 seconds (let it record some chunks)</p>
            <p><strong>Step 3:</strong> Refresh the page (F5 or Ctrl+R) - recording should auto-resume!</p>
            <p><strong>Step 4:</strong> Wait for recording to complete (or stop manually)</p>
            <p><strong>Step 5:</strong> Click "Create Download" then "Download Video File" to get your .webm</p>
            <p><strong>Step 6:</strong> Open the .webm file to verify it's a complete, playable video!</p>
          </div>
          <div className="mt-3 p-3 bg-blue-100 rounded border border-blue-300">
            <p className="text-blue-900 font-medium">💡 Pro Tip: Watch the console logs to see the recovery system in action!</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Recording Controls</h2>
          
          {/* Real Screen Recording Controls */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">🖥️ Real Screen Recording</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={handleStartRecording}
                disabled={recordingState.isRecording || recordingState.isInitializing || isGeneratingTest}
                className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-green-700 transition-colors"
              >
                {recordingState.isInitializing ? "Starting..." : "Start Screen Recording"}
              </button>
              
              <button
                onClick={stop}
                disabled={(!recordingState.isRecording && !recordingState.isInitializing) || isGeneratingTest}
                className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-red-700 transition-colors"
              >
                Stop Recording
              </button>
              
              <button
                onClick={complete}
                disabled={!recordingState.uploadId || recordingState.isRecording || isGeneratingTest}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
              >
                Complete Upload
              </button>
              
              <button
                onClick={abort}
                disabled={!recordingState.uploadId || isGeneratingTest}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-yellow-700 transition-colors"
              >
                Abort Recording
              </button>
            </div>
          </div>

          {/* Synthetic Video Generation Controls */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">🎬 Synthetic Test Video</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleStartTestVideoGeneration}
                disabled={isGeneratingTest || recordingState.isRecording || recordingState.isInitializing}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-purple-700 transition-colors"
              >
                {isGeneratingTest ? "Generating Test Video..." : "Generate Test Video (30s)"}
              </button>
              
              <button
                onClick={handleStopTestVideo}
                disabled={!isGeneratingTest}
                className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-red-700 transition-colors"
              >
                Stop Test Video
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Generates a synthetic 30-second video with animated content and audio for testing upload/recovery systems without screen capture.
            </p>
          </div>

          {/* Download Controls */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">📥 Download Recording</h3>
            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={createDownloadableRecording}
                disabled={isCreatingDownload || (!storageStats?.chunks)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-green-700 transition-colors"
              >
                {isCreatingDownload ? "Creating Download..." : "Create Download"}
              </button>
              
              <button
                onClick={downloadRecording}
                disabled={!downloadableUrl}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-blue-700 transition-colors"
              >
                Download Video File
              </button>

              <button
                onClick={clearDownloadUrl}
                disabled={!downloadableUrl}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-gray-700 transition-colors"
              >
                Clear Download
              </button>
            </div>
            <div className="mt-3">
              <button
                onClick={() => {
                  if (recordingState.playbackUrl) {
                    const recordingType = recordingState.playbackUrl.startsWith('mock://') ? 'synthetic' : 'screen';
                    saveRecordingToArray(recordingState.playbackUrl, recordingType);
                  } else {
                    alert('No recording URL available to save');
                  }
                }}
                disabled={!recordingState.playbackUrl}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:bg-gray-400 hover:bg-indigo-700 transition-colors"
              >
                📋 Save Current Recording to Array
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Combines all recording chunks from IndexedDB into a downloadable .webm video file. Perfect for testing refresh recovery!
            </p>
            {downloadableUrl && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-green-800 font-medium">✅ Download ready!</span>
                  <a 
                    href={downloadableUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-700 hover:text-green-900 underline"
                  >
                    Preview in browser
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Status Display */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h3 className="font-semibold mb-2">Recording Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">State:</span>{" "}
                <span className={`px-2 py-1 rounded text-xs ${
                  recordingState.isRecording ? "bg-red-100 text-red-800" :
                  recordingState.isUploading ? "bg-blue-100 text-blue-800" :
                  recordingState.isInitializing ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {recordingState.isRecording ? "Recording" :
                   recordingState.isUploading ? "Uploading" :
                   recordingState.isInitializing ? "Initializing" :
                   "Idle"}
                </span>
              </div>
              <div>
                <span className="font-medium">Upload ID:</span>{" "}
                <span className="font-mono text-xs">
                  {recordingState.uploadId ? recordingState.uploadId.substring(0, 12) + "..." : "None"}
                </span>
              </div>
              <div>
                <span className="font-medium">Uploaded Parts:</span>{" "}
                <span className="text-green-600 font-semibold">{recordingState.uploadedParts}</span>
              </div>
              <div>
                <span className="font-medium">Uploaded Bytes:</span>{" "}
                <span className="text-blue-600 font-semibold">
                  {(recordingState.uploadedBytes / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>
              <div>
                <span className="font-medium">Pending Parts:</span>{" "}
                <span className="text-orange-600 font-semibold">{recordingState.pendingParts}</span>
              </div>
              <div>
                <span className="font-medium">S3 Key:</span>{" "}
                <span className="font-mono text-xs">
                  {recordingState.s3Key ? recordingState.s3Key.substring(recordingState.s3Key.lastIndexOf('/') + 1) : "None"}
                </span>
              </div>
              <div>
                <span className="font-medium">Test Video:</span>{" "}
                <span className={`px-2 py-1 rounded text-xs ${
                  isGeneratingTest ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {isGeneratingTest ? "Generating..." : "Idle"}
                </span>
              </div>
            </div>
            
            {recordingState.error && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                <span className="font-medium">Error:</span> {recordingState.error}
              </div>
            )}
            
            {recordingState.playbackUrl && (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-green-800">Recording Complete!</span>
                  {recordingState.playbackUrl.startsWith('mock://') ? (
                    <button
                      onClick={() => {
                        alert('🧪 Mock Recording Completed!\n\nThis is a test recording URL.\nIn real mode, this would be a playable video link.\n\nURL: ' + recordingState.playbackUrl);
                      }}
                      className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      View Mock Recording
                    </button>
                  ) : (
                    <a
                      href={recordingState.playbackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                    >
                      View Recording
                    </a>
                  )}
                </div>
                <div className="mt-2 text-xs text-green-600">
                  <strong>URL:</strong> <code className="bg-green-100 px-1 rounded">{recordingState.playbackUrl}</code>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Saved Recordings Array (from test page) */}
        {savedRecordings.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-green-800">📋 Saved Test Recordings ({savedRecordings.length})</h2>
              <div className="flex gap-2">
                <button
                  className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                  onClick={() => {
                    const urls = savedRecordings.map((r: any) => r.url).join('\n');
                    navigator.clipboard.writeText(urls).then(() => alert('Copied all URLs to clipboard'));
                  }}
                >
                  Copy All URLs
                </button>
                <button
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  onClick={() => {
                    const urls = savedRecordings.map((r: any) => r.url).join('\n');
                    const blob = new Blob([urls], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `recording-urls-${consultationId}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download URLs (.txt)
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {savedRecordings.map((recording: any) => (
                <div key={recording.id} className="flex items-center justify-between bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex-1 pr-3">
                    <div className="font-medium text-green-900">{recording.name}</div>
                    <div className="text-sm text-green-700">
                      {new Date(recording.timestamp).toLocaleString()} • {recording.type} • {recording.source}
                    </div>
                    <div className="text-xs text-green-600 font-mono mt-1 truncate">
                      {recording.url}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 text-sm"
                      onClick={() => navigator.clipboard.writeText(recording.url).then(() => alert('URL copied'))}
                    >
                      Copy URL
                    </button>
                    {recording.url.startsWith('mock://') ? (
                      <button
                        onClick={() => alert('🧪 Mock Recording!\n\nThis is a test recording.\nIn real mode, this would be a playable video link.')}
                        className="px-3 py-1 rounded bg-purple-600 text-white hover:bg-purple-700 text-sm"
                      >
                        Open Mock
                      </button>
                    ) : (
                      <a
                        href={recording.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700 text-sm"
                      >
                        Open
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real Consultation Recordings (mirrors recordings_{consultationId}) */}
        {realRecordings.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-emerald-800">📁 Real Consultation Recordings ({realRecordings.length})</h2>
              <div className="flex gap-2">
                <button
                  className="px-3 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm"
                  onClick={() => {
                    const urls = realRecordings.map((r: any) => r.url).join('\n');
                    navigator.clipboard.writeText(urls).then(() => alert('Copied all real URLs to clipboard'));
                  }}
                >
                  Copy All URLs
                </button>
                <button
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  onClick={() => {
                    const urls = realRecordings.map((r: any, i: number) => `Video ${i+1}: ${r.url}`).join('\n');
                    const blob = new Blob([urls], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `real-recording-urls-${consultationId}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download URLs (.txt)
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {realRecordings.map((recording: any, idx: number) => (
                <div key={recording.id} className="flex items-center justify-between bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex-1 pr-3">
                    <div className="font-medium text-emerald-900">Video {idx + 1} — {recording.name || 'Recording'}</div>
                    <div className="text-sm text-emerald-700">
                      {new Date(recording.timestamp).toLocaleString()} • {recording.type || 'screen'} • {recording.source || 'normal_completion'}
                    </div>
                    <div className="text-xs text-emerald-600 font-mono mt-1 truncate">
                      {recording.url}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      className="px-3 py-1 rounded bg-gray-600 text-white hover:bg-gray-700 text-sm"
                      onClick={() => navigator.clipboard.writeText(recording.url).then(() => alert('URL copied'))}
                    >
                      Copy URL
                    </button>
                    <a
                      href={recording.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-700 text-sm"
                    >
                      Open
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Storage Management */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">IndexedDB Storage</h2>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-4">
              <button
                onClick={refreshStats}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                🔄 Refresh Stats
              </button>
              
              <button
                onClick={clearStorage}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Clear All Storage
              </button>
            </div>
            
            <span className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
              ⚡ Auto-refreshing every 3s
            </span>
          </div>

          {storageStats && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Chunks:</span>{" "}
                  <span className="text-blue-600 font-semibold">{storageStats.chunks}</span>
                </div>
                <div>
                  <span className="font-medium">Sessions:</span>{" "}
                  <span className="text-green-600 font-semibold">{storageStats.sessions}</span>
                </div>
                <div>
                  <span className="font-medium">Total Size:</span>{" "}
                  <span className="text-purple-600 font-semibold">{storageStats.totalSizeMB} MB</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Test Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🧪 Test Scenarios</h2>
          
          <div className="space-y-4">
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-green-800">Normal Flow Test</h3>
              <p className="text-gray-600 text-sm">Start recording → Record for 30 seconds → Stop → Verify playback URL</p>
            </div>
            
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-blue-800">Refresh Resilience Test</h3>
              <p className="text-gray-600 text-sm">Start recording → Record for 15 seconds → <strong>Refresh page (F5)</strong> → Continue recording → Stop</p>
            </div>
            
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-purple-800">Network Interruption Test</h3>
              <p className="text-gray-600 text-sm">Start recording → Disconnect network → Continue recording → Reconnect → Observe chunk uploads</p>
            </div>
            
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-semibold text-orange-800">Browser Crash Test</h3>
              <p className="text-gray-600 text-sm">Start recording → Record for 20 seconds → <strong>Close browser completely</strong> → Reopen → Check recovery</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-yellow-800 text-sm">
              <strong>Console Monitoring:</strong> Open DevTools → Console to see detailed logging of chunk uploads, recovery processes, and session management.
            </p>
          </div>
        </div>

        {/* Consultation ID Management */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-800 text-sm mb-3">
            <strong>Consultation ID:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{consultationId}</code>
          </p>
          
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Enter real consultation ID (optional)"
              className="flex-1 px-3 py-1 border border-blue-300 rounded text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value) {
                    setConsultationId(value);
                    window.history.replaceState(null, '', `?consultationId=${encodeURIComponent(value)}`);
                  }
                }
              }}
            />
            <button
              onClick={() => {
                const newId = "test-consultation-" + Date.now();
                setConsultationId(newId);
                sessionStorage.setItem('test-consultation-id', newId);
                window.history.replaceState(null, '', '');
                console.log(`🆕 [TEST_PAGE] Generated new consultation ID: ${newId}`);
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
            >
              New Test ID
            </button>
          </div>
          
          <p className="text-blue-600 text-xs mt-2">
            Use a real consultation ID for backend testing, or generate a new test ID for mock mode.
          </p>
        </div>

        {/* Mock Mode Info */}
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800 text-sm">
            <strong>🧪 Mock Mode:</strong> The system automatically switches to mock mode when:
          </p>
          <ul className="text-green-700 text-xs mt-2 ml-4 space-y-1">
            <li>• Backend is unavailable (404/500 errors)</li>
            <li>• Invalid consultation ID (foreign key constraint errors)</li>
            <li>• Database connection issues</li>
          </ul>
          <p className="text-green-600 text-xs mt-2">
            Look for "🧪 [MOCK_*]" messages in the console to see when mock mode is active. This allows full frontend testing without a working backend.
          </p>
        </div>
      </div>
    </div>
  );
}
