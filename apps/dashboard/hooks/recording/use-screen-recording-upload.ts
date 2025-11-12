"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chunkStorage, type ChunkData, type SessionMetadata } from "@/lib/indexeddb-chunks";

type InitiateResponse = {
	uploadId: string;
	key: string;
	partSize: number; // in bytes
};

type PresignPartResponse = {
	url: string;
};

type CompleteResponse = {
	key: string;
	playbackUrl?: string;
};

type UploadedPart = { partNumber: number; etag: string };

type StartOptions = {
	filename: string;
	contentType?: string;
	timesliceMs?: number; // default 5000
	maxConcurrentUploads?: number; // default 3
	requireEntireScreen?: boolean; // enforce that user selects Entire Screen in the picker
	captureMic?: boolean; // default true - include microphone audio
	captureSystemAudio?: boolean; // default false - include system/tab audio (if supported by browser)
};

export type ScreenRecordingState = {
	isRecording: boolean;
	isInitializing: boolean;
	isUploading: boolean;
	error: string | null;
	uploadedBytes: number;
	uploadedParts: number;
	pendingParts: number;
	uploadId: string | null;
	s3Key: string | null;
  playbackUrl: string | null;
};

const DEFAULT_TIMESLICE = 3000; // 3 seconds for more frequent uploads
const DEFAULT_MAX_CONCURRENCY = 3;

import initiateRecordingUpload from "@/actions/recordings/initiate";
import presignRecordingPart from "@/actions/recordings/presign-part";
import completeRecordingUpload from "@/actions/recordings/complete";
import abortRecordingUpload from "@/actions/recordings/abort";

export function useScreenRecordingUpload(consultationId: string) {
	const [state, setState] = useState<ScreenRecordingState>({
		isRecording: false,
		isInitializing: false,
		isUploading: false,
		error: null,
		uploadedBytes: 0,
		uploadedParts: 0,
		pendingParts: 0,
		uploadId: null,
		s3Key: null,
    playbackUrl: null,
	});

	// Generate unique session ID for this recording session
	const sessionIdRef = useRef<string>(consultationId); // Use consultationId as sessionId for consistency
	
	// Track session state for recovery
	const currentSessionRef = useRef<SessionMetadata | null>(null);

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const mediaStreamRef = useRef<MediaStream | null>(null);
	const micStreamRef = useRef<MediaStream | null>(null);
	const trackedVideoRef = useRef<MediaStreamTrack | null>(null);
	const trackedStreamRef = useRef<MediaStream | null>(null);
	const trackEndHandlerRef = useRef<(() => void) | null>(null);
	const streamInactiveHandlerRef = useRef<(() => void) | null>(null);
	const uploadIdRef = useRef<string | null>(null);
	const partSizeRef = useRef<number>(10 * 1024 * 1024); // default 10MB until server returns
	const nextPartNumberRef = useRef<number>(1);
	const isStoppingRef = useRef<boolean>(false);
	const chunkCounterRef = useRef<number>(0);

	// Track uploaded parts for multipart upload completion
	const uploadedPartsRef = useRef<UploadedPart[]>([]);

	// Aggregation buffer to meet S3 minimum part size (5MB for all but last part)
	const pendingBlobsRef = useRef<Blob[]>([]);
	const pendingChunkIdsRef = useRef<string[]>([]);
	const pendingSizeRef = useRef<number>(0);

	const initiateMultipart = useCallback(async (fileName: string, mimeType: string): Promise<InitiateResponse> => {
		const { uploadId, partSize, key } = await initiateRecordingUpload({ fileName, sessionId: consultationId, mimeType });
		return { uploadId, partSize, key };
	}, [consultationId]);

	const presignPart = useCallback(async (uploadId: string, partNumber: number): Promise<PresignPartResponse> => {
		return await presignRecordingPart({ uploadId, partNumber });
	}, []);

	const completeMultipart = useCallback(async (uploadId: string, parts: UploadedPart[]): Promise<CompleteResponse> => {
		return await completeRecordingUpload({ uploadId, parts });
	}, []);

	// Resume chunk upload from IndexedDB
	const resumeChunkUpload = useCallback(async (chunksToResume: ChunkData[]) => {
		const uploadId = uploadIdRef.current;
		if (!uploadId || chunksToResume.length === 0) {
			console.warn(`⚠️ [CHUNK_RESUME] No uploadId or chunks to resume`);
			return;
		}
		
		const partNumber = nextPartNumberRef.current++;
		const combinedBlob = new Blob(chunksToResume.map(c => c.blob), { type: "video/webm" });
		
		console.log(`🔄 [CHUNK_RESUME] Resuming upload for ${chunksToResume.length} chunks as part ${partNumber}`);
		
		const attemptOnce = async (): Promise<string> => {
			const { url } = await presignPart(uploadIdRef.current as string, partNumber);
			const isMockUrl = url.includes('mock-s3-bucket') || url.includes('mock=true');
			if (isMockUrl) {
				console.log(`🧪 [MOCK_RESUME] Simulating S3 resume upload for part ${partNumber}`);
				await new Promise(resolve => setTimeout(resolve, Math.random() * 800 + 200));
				return `resume-etag-${partNumber}-${Date.now()}`;
			}
			const putRes = await fetch(url, { method: "PUT", body: combinedBlob, headers: { "Content-Type": "application/octet-stream" } });
			if (!putRes.ok) throw new Error(`S3 PUT failed with ${putRes.status}`);
			const h = putRes.headers.get("ETag") || putRes.headers.get("Etag") || putRes.headers.get("etag");
			if (!h) throw new Error("Missing ETag from S3 response");
			return h.replace(/\"/g, "");
		};

		try {
			let cleanETag = await attemptOnce();
			for (const chunk of chunksToResume) {
				await chunkStorage.markChunkUploaded(chunk.id, cleanETag);
			}
			await chunkStorage.addUploadedPart(consultationId, partNumber, cleanETag);
			uploadedPartsRef.current.push({ partNumber, etag: cleanETag });
			setState((s) => ({ ...s, uploadedParts: uploadedPartsRef.current.length, uploadedBytes: s.uploadedBytes + combinedBlob.size }));
			console.log(`✅ [CHUNK_RESUME] Resumed part ${partNumber} uploaded successfully`);
		} catch (err) {
			const msg = String((err as Error)?.message || err);
			const isSessionInvalid = msg.includes('Upload session invalid') || msg.includes('not found');
			if (isSessionInvalid) {
				console.warn('[CHUNK_RESUME] UploadId invalid. Re-initiating upload session and retrying once...');
				const filename = currentSessionRef.current?.filename || `consultation-${consultationId}-${Date.now()}.webm`;
				const mime = currentSessionRef.current?.mimeType || 'video/webm';
				const { uploadId: newId, partSize, key } = await initiateMultipart(filename, mime);
				uploadIdRef.current = newId;
				partSizeRef.current = Math.max(5 * 1024 * 1024, partSize || partSizeRef.current);
				await chunkStorage.saveSession({ ...(currentSessionRef.current as any), sessionId: consultationId, uploadId: newId, s3Key: key, partSize: partSizeRef.current, lastActivity: Date.now() });
				try {
					let cleanETag = await attemptOnce();
					for (const chunk of chunksToResume) {
						await chunkStorage.markChunkUploaded(chunk.id, cleanETag);
					}
					await chunkStorage.addUploadedPart(consultationId, partNumber, cleanETag);
					uploadedPartsRef.current.push({ partNumber, etag: cleanETag });
					setState((s) => ({ ...s, uploadedParts: uploadedPartsRef.current.length, uploadedBytes: s.uploadedBytes + combinedBlob.size }));
					console.log(`✅ [CHUNK_RESUME] Resumed part ${partNumber} uploaded successfully after re-init`);
				} catch (e2) {
					console.error('❌ [CHUNK_RESUME] Retry after re-init failed:', e2);
				}
			} else {
				console.error(`❌ [CHUNK_RESUME] Resumed part ${partNumber} upload failed:`, err);
				throw err;
			}
		}
	}, [consultationId, presignPart, initiateMultipart]);
	
	// Finalize recording from resumed session
	const finalizeRecording = useCallback(async () => {
		const uploadId = uploadIdRef.current;
		if (!uploadId) {
			console.log("ℹ️ [FINALIZE] No uploadId to finalize");
			return;
		}
		
		console.log("🏁 [FINALIZE] Finalizing recovered recording...");
		
		setState(s => ({ ...s, isUploading: true }));
		
		try {
			if (uploadedPartsRef.current.length === 0) {
				console.log("⚠️ [FINALIZE] No parts uploaded, aborting");
				await abortRecordingUpload({ uploadId });
				await chunkStorage.clearSession(consultationId);
				return;
			}
			
			const parts = [...uploadedPartsRef.current].sort((a, b) => a.partNumber - b.partNumber);
			console.log("📋 [FINALIZE] Parts to complete:", parts.map(p => ({ part: p.partNumber, etag: p.etag.substring(0, 8) + '...' })));
			
			const { key, playbackUrl } = await completeMultipart(uploadId, parts);
			console.log("✅ [FINALIZE] Recording finalized successfully:", { key, playbackUrl });
			
			// Update session as completed
			await chunkStorage.updateSessionStatus(consultationId, 'completed');
			
			setState((s) => ({ 
				...s, 
				s3Key: key, 
				playbackUrl: playbackUrl ?? null,
				isUploading: false
			}));
			
			// Clean up session data after successful completion
			setTimeout(() => {
				chunkStorage.clearSession(consultationId).catch(console.error);
			}, 5000); // Keep for 5 seconds for any final UI updates
			
		} catch (err) {
			console.error("❌ [FINALIZE] Finalization failed:", err);
			setState((s) => ({ ...s, error: (err as Error).message, isUploading: false }));
		}
	}, [consultationId, completeMultipart]);

	const flushAggregatedPart = useCallback(async (forceFinal: boolean = false) => {
		const uploadId = uploadIdRef.current;
		if (!uploadId) {
			console.warn(`[FLUSH] No uploadId, cannot flush part.`);
			return;
		}

		// Use server-provided part size, but enforce S3 minimum of 5MB for non-final parts
		const requiredSize = partSizeRef.current || 5 * 1024 * 1024;
		const hasData = pendingSizeRef.current > 0;

		const isReadyToFlush = pendingSizeRef.current >= requiredSize || (forceFinal && hasData);
		if (!isReadyToFlush) {
			return;
		}

		const partNumber = nextPartNumberRef.current++;
		const combinedBlob = new Blob(pendingBlobsRef.current, { type: "video/webm" });
		const chunkIdsToMark = [...pendingChunkIdsRef.current];

		console.log(`[FLUSH] Flushing part ${partNumber}. Size: ${(combinedBlob.size / (1024 * 1024)).toFixed(2)}MB. Final: ${forceFinal}`);
		
		// Reset buffers immediately
		pendingBlobsRef.current = [];
		pendingChunkIdsRef.current = [];
		pendingSizeRef.current = 0;

		const attemptOnce = async (): Promise<string> => {
			const uid = uploadIdRef.current as string;
			const { url } = await presignPart(uid, partNumber);
			const isMockUrl = url.includes('mock-s3-bucket');
			if (isMockUrl) {
				console.log(`\u{1F9EA} [MOCK_FLUSH] Simulating S3 flush for part ${partNumber}`);
				await new Promise(resolve => setTimeout(resolve, 1000));
				return `mock-etag-${partNumber}-${Date.now()}`;
			}
			const putRes = await fetch(url, { method: "PUT", body: combinedBlob });
			if (!putRes.ok) throw new Error(`S3 PUT failed with ${putRes.status}`);
			const et = putRes.headers.get("ETag") || putRes.headers.get("etag");
			if (!et) throw new Error("Missing ETag from S3 response");
			return et.replace(/\"/g, "");
		};

		try {
			let cleanETag = await attemptOnce();
			for (const chunkId of chunkIdsToMark) {
				try { await chunkStorage.markChunkUploaded(chunkId, cleanETag); } catch {}
			}
			await chunkStorage.addUploadedPart(consultationId, partNumber, cleanETag);
			uploadedPartsRef.current.push({ partNumber, etag: cleanETag });
			setState(s => ({ ...s, uploadedParts: uploadedPartsRef.current.length, uploadedBytes: s.uploadedBytes + combinedBlob.size }));
			console.log(`\u2705 [FLUSH] Part ${partNumber} uploaded successfully.`);
		} catch (err) {
			const msg = String((err as Error)?.message || err);
			const isSessionInvalid = msg.includes('Upload session invalid') || msg.includes('not found');
			if (isSessionInvalid) {
				console.warn('[FLUSH] UploadId invalid. Re-initiating upload session and retrying once...');
				// Re-initiate
				const filename = currentSessionRef.current?.filename || `consultation-${consultationId}-${Date.now()}.webm`;
				const mime = currentSessionRef.current?.mimeType || 'video/webm';
				const { uploadId: newId, partSize, key } = await initiateMultipart(filename, mime);
				uploadIdRef.current = newId;
				partSizeRef.current = Math.max(5 * 1024 * 1024, partSize || partSizeRef.current);
				await chunkStorage.saveSession({ ...(currentSessionRef.current as any), sessionId: consultationId, uploadId: newId, s3Key: key, partSize: partSizeRef.current, lastActivity: Date.now() });
				// Retry once
				try {
					let cleanETag = await attemptOnce();
					for (const chunkId of chunkIdsToMark) {
						try { await chunkStorage.markChunkUploaded(chunkId, cleanETag); } catch {}
					}
					await chunkStorage.addUploadedPart(consultationId, partNumber, cleanETag);
					uploadedPartsRef.current.push({ partNumber, etag: cleanETag });
					setState(s => ({ ...s, uploadedParts: uploadedPartsRef.current.length, uploadedBytes: s.uploadedBytes + combinedBlob.size }));
					console.log(`\u2705 [FLUSH] Part ${partNumber} uploaded successfully after re-init.`);
				} catch (e2) {
					console.error('❌ [FLUSH] Retry after re-init failed:', e2);
				}
			} else {
				console.error(`❌ [FLUSH] Part ${partNumber} upload failed:`, err);
			}
		}
	}, [consultationId, presignPart, initiateMultipart]);

	const handleChunk = useCallback(async (chunk: Blob) => {
		const chunkIndex = chunkCounterRef.current++;
		const chunkId = `${consultationId}_${sessionIdRef.current}_${chunkIndex}`;
		
		console.log(`📊 [RECORDING_CHUNK] Received chunk ${chunkIndex}: ${(chunk.size / 1024).toFixed(1)}KB`);
		
		try {
			await chunkStorage.saveChunk({
				id: chunkId,
				sessionId: consultationId,
				uploadId: uploadIdRef.current || '',
				chunkIndex,
				partNumber: -1, // Part number is for aggregated blob
				timestamp: Date.now(),
				blob: chunk,
				uploaded: false
			});
		} catch (err) {
			console.error(`❌ [CHUNK_STORAGE] Failed to save chunk ${chunkIndex}:`, err);
		}

		pendingBlobsRef.current.push(chunk);
		pendingChunkIdsRef.current.push(chunkId);
		pendingSizeRef.current += chunk.size;

		try {
			await flushAggregatedPart(false);
		} catch (err) {
			console.error(`⚠️ [CHUNK_UPLOAD] Aggregated upload failed at chunk ${chunkIndex}:`, err);
		}
	}, [consultationId, flushAggregatedPart]);

	const start = useCallback(async (opts?: StartOptions) => {
		if (state.isRecording || state.isInitializing) {
			console.log("⚠️ [RECORDING] Cannot start - recording already in progress");
			return;
		}
		if (state.isUploading) {
			console.log("⚠️ [RECORDING] Cannot start - previous recording still uploading");
			return;
		}
		console.log("🎬 [RECORDING] Starting new screen recording...");
		setState((s) => ({ ...s, isInitializing: true, error: null }));
		
		// Clear any previous session data before starting new recording
		uploadIdRef.current = null;
		uploadedPartsRef.current = [];
		chunkCounterRef.current = 0;
		currentSessionRef.current = null;
		nextPartNumberRef.current = 1;
		pendingBlobsRef.current = [];
		pendingChunkIdsRef.current = [];
		pendingSizeRef.current = 0;
		
		// Reset completion flags for new recording
		isCompletingRef.current = false;
		hasCompletedRef.current = false;
		
		// Clear any existing session from IndexedDB to prevent conflicts
		try {
			await chunkStorage.clearSession(consultationId);
			console.log(`🧹 [RECORDING_START] Cleared existing session data for new recording`);
		} catch (err) {
			console.warn(`⚠️ [RECORDING_START] Failed to clear existing session:`, err);
		}

		try {
			// Generate unique filename with session ID to prevent overwrites
			const filename = opts?.filename || `consultation-${consultationId}-session-${sessionIdRef.current}-${Date.now()}.webm`;
			const mimeTypeCandidates = [
				"video/webm;codecs=vp9,opus",
				"video/webm;codecs=vp8,opus",
				"video/webm",
			];
			const preferredMime = mimeTypeCandidates.find((c) => MediaRecorder.isTypeSupported(c)) || "video/webm";
			const timeslice = opts?.timesliceMs ?? DEFAULT_TIMESLICE;
			// Note: concurrencyRef removed in favor of immediate upload approach

			// 1) Initiate multipart upload first
			const { uploadId, partSize, key } = await initiateMultipart(filename, preferredMime);
			uploadIdRef.current = uploadId;
			partSizeRef.current = Math.max(5 * 1024 * 1024, partSize || partSizeRef.current);
			nextPartNumberRef.current = 1; // Reset part counter
			uploadedPartsRef.current = []; // Reset uploaded parts
			
			setState((s) => ({ ...s, uploadId, s3Key: key }));
			
			// Save session metadata to IndexedDB for recovery
			const sessionMetadata: SessionMetadata = {
				sessionId: consultationId,
				uploadId,
				s3Key: key,
				filename,
				mimeType: preferredMime,
				partSize: partSizeRef.current,
				status: 'recording',
				createdAt: Date.now(),
				lastActivity: Date.now(),
				uploadedParts: [],
				nextPartNumber: 1
			};
			
			currentSessionRef.current = sessionMetadata;
			try {
				await chunkStorage.saveSession(sessionMetadata);
				console.log("📋 [SESSION] Successfully saved session metadata:", {
					sessionId: consultationId,
					uploadId: uploadId.substring(0, 12) + '...',
					status: 'recording'
				});
				
				// Verify it was saved by reading it back
				const savedSession = await chunkStorage.getSession(consultationId);
				if (savedSession) {
					console.log("✅ [SESSION] Verification: Session found in IndexedDB after save");
				} else {
					console.error("❌ [SESSION] Verification failed: Session not found after save");
				}
			} catch (err) {
				console.error("❌ [SESSION] Failed to save session metadata:", err);
			}



			// 2) Capture screen (optionally with system audio if supported)
			const includeSystemAudio = opts?.captureSystemAudio === true;
			const screenStream = await navigator.mediaDevices.getDisplayMedia({
				video: { frameRate: 15 },
				audio: includeSystemAudio, // some browsers support tab/system audio when true
			});
			mediaStreamRef.current = screenStream;

			// Enforce system audio if requested
			if (includeSystemAudio && screenStream.getAudioTracks().length === 0) {
				// Stop all tracks from the failed attempt
				screenStream.getTracks().forEach(track => track.stop());
				mediaStreamRef.current = null;
				
				// Abort initiated multipart upload and clean up session
				try {
					const toAbort = uploadIdRef.current;
					if (toAbort) {
						await abortRecordingUpload({ uploadId: toAbort });
						await chunkStorage.clearSession(consultationId);
					}
				} catch {}
				
				uploadIdRef.current = null;
				uploadedPartsRef.current = [];
				chunkCounterRef.current = 0;
				currentSessionRef.current = null;
				
				setState((s) => ({ 
					...s, 
					isInitializing: false, 
					error: "System audio not selected. Please enable audio sharing in the prompt." 
				}));
				return;
			}

			// Listen for user stopping from browser UI (track ended / stream inactive)
			try {
				const vTrack = screenStream.getVideoTracks()[0] || null;
				trackedVideoRef.current = vTrack;
				trackedStreamRef.current = screenStream;
				if (vTrack) {
					const onEnded = async () => {
						if (!uploadIdRef.current && mediaRecorderRef.current == null) return;
						// Immediately reflect stopped state so overlay blocks UI
						setState((s) => ({ ...s, isRecording: false, isUploading: true }));
						await stop();
					};
					vTrack.addEventListener("ended", onEnded);
					trackEndHandlerRef.current = () => vTrack.removeEventListener("ended", onEnded);
				}
				const onInactive = async () => {
					if (!uploadIdRef.current && mediaRecorderRef.current == null) return;
					setState((s) => ({ ...s, isRecording: false, isUploading: true }));
					await stop();
				};
				(screenStream as any).addEventListener?.("inactive", onInactive);
				streamInactiveHandlerRef.current = () => (screenStream as any).removeEventListener?.("inactive", onInactive);
			} catch {}

			// If Entire Screen is required, validate selection; otherwise abort and prompt user to re-try
			if (opts?.requireEntireScreen) {
				const track = screenStream.getVideoTracks()[0];
				const settings = (track?.getSettings?.() as any) || {};
				if (settings?.displaySurface !== "monitor") {
					try { track?.stop?.(); } catch {}
					mediaStreamRef.current = null;
					// Abort initiated multipart upload and clean up session
					try {
						const toAbort = uploadIdRef.current;
						if (toAbort) {
							await abortRecordingUpload({ uploadId: toAbort });
							await chunkStorage.clearSession(consultationId);
						}
					} catch {}
					uploadIdRef.current = null;
					uploadedPartsRef.current = [];
					chunkCounterRef.current = 0;
					currentSessionRef.current = null;
					setState((s) => ({ ...s, isInitializing: false, error: "Please select 'Entire Screen' in the share picker." }));
					return;
				}
			}

			// Optionally capture microphone and merge tracks into a single mixed stream
			let finalStream: MediaStream = screenStream;
			const wantsMic = opts?.captureMic !== false; // default true
			if (wantsMic) {
				try {
					const mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
					micStreamRef.current = mic;
					finalStream = new MediaStream([
						...screenStream.getVideoTracks(),
						...screenStream.getAudioTracks(),
						...mic.getAudioTracks(),
					]);
				} catch (e) {
					console.warn("Mic capture failed; proceeding without mic:", e);
				}
			}

			// 3) Create MediaRecorder
			const recorder = new MediaRecorder(finalStream, { mimeType: preferredMime, videoBitsPerSecond: 2_000_000 });
			mediaRecorderRef.current = recorder;

			recorder.ondataavailable = (ev: BlobEvent) => {
				if (!ev.data || ev.data.size === 0) return;
				handleChunk(ev.data);
				// Removed queue management since we upload immediately
			};

			recorder.onerror = (e) => {
				const msg = (e as any)?.error?.message || "MediaRecorder error";
				setState((s) => ({ ...s, error: msg }));
			};

			recorder.onstop = () => {
				// If the recorder stopped externally, show overlay immediately
				setState((s) => ({ ...s, isRecording: false }));
			};

			// 4) Start recording with timeslices
			recorder.start(timeslice);
			setState((s) => ({ ...s, isRecording: true, isInitializing: false }));
		} catch (err) {
			console.error("Failed to start screen recording:", err);
			setState((s) => ({ ...s, isInitializing: false, error: (err as Error).message }));
			try { mediaRecorderRef.current?.stop(); } catch {}
			mediaRecorderRef.current = null;
			try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
			try { micStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
			mediaStreamRef.current = null;
			micStreamRef.current = null;
			uploadIdRef.current = null;
			uploadedPartsRef.current = [];
			chunkCounterRef.current = 0;
			currentSessionRef.current = null;
			// Clean up session on error
			chunkStorage.clearSession(consultationId).catch(console.error);
		}
	}, [consultationId, handleChunk, initiateMultipart, state.isRecording, state.isInitializing]);

	const stop = useCallback(async () => {
		if (!state.isRecording && !state.isInitializing) return;
		isStoppingRef.current = true;
		setState((s) => ({ ...s, isRecording: false, isUploading: true }));
		
		// Update session status to stopping
		if (currentSessionRef.current) {
			await chunkStorage.updateSessionStatus(consultationId, 'stopping');
		}

		try {
			try {
				if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
					mediaRecorderRef.current.stop();
				}
			} catch {}
			mediaRecorderRef.current = null;
			try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
			mediaStreamRef.current = null;
			// Remove listeners
			try { trackEndHandlerRef.current?.(); } catch {}
			trackEndHandlerRef.current = null;
			try { streamInactiveHandlerRef.current?.(); } catch {}
			streamInactiveHandlerRef.current = null;
			trackedVideoRef.current = null;
			trackedStreamRef.current = null;

			// Flush any remaining aggregated data as the final (small) part
			console.log("⏳ [RECORDING_STOP] Flushing final data part...");
			try { 
				await flushAggregatedPart(true); 
			} catch (e) { 
				console.warn('⚠️ [RECORDING_STOP] Final flush failed:', e); 
			}

			// Wait a moment for any final chunks to upload
			console.log("⏳ [RECORDING_STOP] Waiting for final upload to complete...");
			await new Promise(resolve => setTimeout(resolve, 3000));

			const uploadId = uploadIdRef.current;
			if (uploadId) {
				const parts = [...uploadedPartsRef.current].sort((a, b) => a.partNumber - b.partNumber);
				console.log("🏁 [RECORDING_STOP] Attempting to complete upload:", { 
					uploadId: uploadId.substring(0, 8) + '...', 
					partsCount: parts.length,
					parts: parts.map(p => ({ part: p.partNumber, etag: p.etag.substring(0, 8) + '...' }))
				});
				
				const { key, playbackUrl } = await completeMultipart(uploadId, parts);
				console.log("✅ [RECORDING_COMPLETE] Recording saved successfully:", { 
					consultationId, 
					key, 
					playbackUrl,
					parts: parts.length
				});
				setState((s) => ({ ...s, s3Key: key, playbackUrl: playbackUrl ?? null }));
				
				// Update session as completed and schedule cleanup
				await chunkStorage.updateSessionStatus(consultationId, 'completed');
				setTimeout(() => {
					chunkStorage.clearSession(consultationId).catch(console.error);
				}, 5000);
			} else {
				console.log("⚠️ [RECORDING_COMPLETE] No upload ID found - recording may not have been saved");
			}
		} catch (err) {
			console.error("Failed to finalize upload:", err);
			setState((s) => ({ ...s, error: (err as Error).message }));
		} finally {
			uploadIdRef.current = null;
			uploadedPartsRef.current = [];
			chunkCounterRef.current = 0;
			currentSessionRef.current = null;
			isStoppingRef.current = false;
			// Reset completion flags when stopping
			isCompletingRef.current = false;
			hasCompletedRef.current = false;
			setState((s) => ({ ...s, isUploading: false }));
		}
	}, [completeMultipart, consultationId, state.isInitializing, state.isRecording, flushAggregatedPart]);

	// Add completion guard to prevent multiple calls
	const isCompletingRef = useRef<boolean>(false);
	const hasCompletedRef = useRef<boolean>(false);

	const complete = useCallback(async () => {
		const uploadId = uploadIdRef.current;
		if (!uploadId) {
			console.log("ℹ️ [RECORDING_COMPLETE] No uploadId to complete");
			return null;
		}

		// Prevent multiple completion calls
		if (isCompletingRef.current) {
			console.log("⏳ [RECORDING_COMPLETE] Already completing, skipping duplicate call");
			return null;
		}

		if (hasCompletedRef.current) {
			console.log("✅ [RECORDING_COMPLETE] Already completed, skipping duplicate call");
			return null;
		}

		isCompletingRef.current = true;
		console.log("🏁 [RECORDING_COMPLETE] Completing upload with parts:", uploadedPartsRef.current.length);
		
		setState(s => ({ ...s, isUploading: true }));

		try {
			if (uploadedPartsRef.current.length === 0) {
				console.log("⚠️ [RECORDING_COMPLETE] No parts uploaded, aborting");
				await abortRecordingUpload({ uploadId });
				await chunkStorage.clearSession(consultationId);
				hasCompletedRef.current = true;
				return null;
			}
			
			const parts = [...uploadedPartsRef.current].sort((a, b) => a.partNumber - b.partNumber);
			console.log("📋 [RECORDING_COMPLETE] Parts to complete:", parts.map(p => ({ part: p.partNumber, etag: p.etag.substring(0, 8) + '...' })));
			
			const { key, playbackUrl } = await completeMultipart(uploadId, parts);
			console.log("✅ [RECORDING_COMPLETE] Successfully completed:", { key, playbackUrl });
			
			// Mark as completed to prevent duplicate calls
			hasCompletedRef.current = true;
			
			// Update session as completed
			await chunkStorage.updateSessionStatus(consultationId, 'completed');
			
			setState((s) => ({ ...s, s3Key: key, playbackUrl: playbackUrl ?? null, isUploading: false }));
			
			// Clean up session data after completion
			setTimeout(() => {
				chunkStorage.clearSession(consultationId).catch(console.error);
			}, 5000);

			return { key, playbackUrl };
			
		} catch (err) {
			console.error("❌ [RECORDING_COMPLETE] Completion failed:", err);
			setState((s) => ({ ...s, error: (err as Error).message, isUploading: false }));
			throw err;
		} finally {
			isCompletingRef.current = false;
		}
	}, [completeMultipart, consultationId]);

	const abort = useCallback(async () => {
		const uploadId = uploadIdRef.current;
		if (!uploadId) {
			console.log("ℹ️ [RECORDING_ABORT] No active upload to abort");
			return;
		}
		
		console.log("🛑 [RECORDING_ABORT] Aborting current recording upload:", uploadId);
		try {
			await abortRecordingUpload({ uploadId });
			console.log("✅ [RECORDING_ABORT] Successfully aborted upload");
		} catch (err) {
			console.error("❌ [RECORDING_ABORT] Error aborting upload:", err);
		} finally {
			// Clean up all state and session data
			uploadIdRef.current = null;
			uploadedPartsRef.current = [];
			chunkCounterRef.current = 0;
			currentSessionRef.current = null;
			// Reset completion flags when aborting
			isCompletingRef.current = false;
			hasCompletedRef.current = false;
			setState((s) => ({ ...s, isRecording: false, isUploading: false, uploadId: null, error: null }));
			
			// Clear session from IndexedDB
			chunkStorage.clearSession(consultationId).catch(console.error);
		}
	}, [consultationId]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			try { mediaRecorderRef.current?.stop(); } catch {}
			try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
			try { trackEndHandlerRef.current?.(); } catch {}
			try { streamInactiveHandlerRef.current?.(); } catch {}
		};
	}, []);

	// Prevent accidental page refresh during recording or uploading
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (state.isRecording || state.isUploading) {
				e.preventDefault();
				const message = "Screen recording is in progress. Leaving now will lose the recording data.";
				e.returnValue = message;
				return message;
			}
		};

		// Also prevent navigation during recording
		const handleNavigation = (e: Event) => {
			if (state.isRecording || state.isUploading) {
				e.preventDefault();
				if (confirm("Screen recording is in progress. Leaving now will lose the recording data. Continue anyway?")) {
					// User confirmed, stop recording gracefully
					if (mediaRecorderRef.current && state.isRecording) {
						try {
							mediaRecorderRef.current.stop();
						} catch {}
					}
					return true;
				}
				return false;
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		window.addEventListener('pagehide', handleNavigation);
		
		return () => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			window.removeEventListener('pagehide', handleNavigation);
		};
	}, [state.isRecording, state.isUploading]);

	// Background finalization watchdog
	useEffect(() => {
		const watchdogInterval = setInterval(async () => {
			try {
				// Check for sessions that have been stopping for too long
				const activeSessions = await chunkStorage.getActiveSessions();
				const now = Date.now();
				
				for (const session of activeSessions) {
					const inactiveTime = now - session.lastActivity;
					
					// If session has been stopping for more than 2 minutes, auto-finalize
					if (session.status === 'stopping' && inactiveTime > 2 * 60 * 1000) {
						console.log(`🕰️ [WATCHDOG] Auto-finalizing inactive stopping session: ${session.sessionId}`);
						
						// Check if this is our current session
						if (session.sessionId === consultationId && session.uploadedParts.length > 0) {
							// Restore session and finalize
							uploadIdRef.current = session.uploadId;
							uploadedPartsRef.current = [...session.uploadedParts];
							currentSessionRef.current = session;
							
							try {
								await finalizeRecording();
							} catch (err) {
								console.error(`❌ [WATCHDOG] Auto-finalization failed for ${session.sessionId}:`, err);
							}
						} else {
							// Different session or no parts, just clean up
							await chunkStorage.clearSession(session.sessionId);
						}
					}
					
					// If session has been recording for more than 4 hours, something is wrong
					else if (session.status === 'recording' && inactiveTime > 4 * 60 * 60 * 1000) {
						console.log(`⚠️ [WATCHDOG] Cleaning up stale recording session: ${session.sessionId}`);
						await chunkStorage.clearSession(session.sessionId);
					}
				}
				
			} catch (err) {
				console.error('❌ [WATCHDOG] Watchdog error:', err);
			}
		}, 60000); // Check every minute
		
		return () => clearInterval(watchdogInterval);
	}, [consultationId, finalizeRecording]);
	
	// Session recovery and chunk upload resumption on mount
	useEffect(() => {
		const recoverSession = async () => {
			try {
				console.log(`🔍 [RECOVERY] Checking for active sessions for consultation ${consultationId}`);
				
				// Debug: Check all sessions first
				const allSessions = await chunkStorage.getActiveSessions();
				console.log(`🔍 [RECOVERY] Found ${allSessions.length} total active sessions:`, 
					allSessions.map(s => ({ sessionId: s.sessionId, status: s.status, lastActivity: new Date(s.lastActivity).toISOString() }))
				);
				
				// Check for existing session metadata
				const existingSession = await chunkStorage.getSession(consultationId);
				console.log(`🔍 [RECOVERY] Session lookup for ${consultationId}:`, existingSession ? {
					found: true,
					status: existingSession.status,
					uploadId: existingSession.uploadId.substring(0, 12) + '...',
					lastActivity: new Date(existingSession.lastActivity).toISOString(),
					partsCount: existingSession.uploadedParts.length
				} : { found: false });
				
				if (existingSession && (existingSession.status === 'recording' || existingSession.status === 'stopping')) {
					console.log(`🔄 [RECOVERY] Found active session:`, existingSession);
					
					// Restore session state for recovery
					currentSessionRef.current = existingSession;
					uploadIdRef.current = existingSession.uploadId;
					partSizeRef.current = existingSession.partSize;
					nextPartNumberRef.current = existingSession.nextPartNumber;
					uploadedPartsRef.current = [...existingSession.uploadedParts];
					
					// Reset completion flags for recovery
					isCompletingRef.current = false;
					hasCompletedRef.current = false;
					
					setState(s => ({
						...s,
						uploadId: existingSession.uploadId,
						s3Key: existingSession.s3Key,
						uploadedParts: existingSession.uploadedParts.length,
						isUploading: existingSession.status === 'stopping'
					}));
					
					// Resume uploading unuploaded chunks
					const unuploadedChunks = await chunkStorage.getUnuploadedChunks(consultationId);
					
					if (unuploadedChunks.length > 0) {
						console.log(`📦 [RECOVERY] Found ${unuploadedChunks.length} unuploaded chunks, resuming uploads...`);
						
						// Aggregate unuploaded chunks into parts of >= 5MB
						const partSize = partSizeRef.current || 5 * 1024 * 1024;
						let currentBatch: ChunkData[] = [];
						let currentSize = 0;

						for (const chunk of unuploadedChunks) {
							currentBatch.push(chunk);
							currentSize += chunk.blob.size;
							if (currentSize >= partSize) {
								try {
									await resumeChunkUpload(currentBatch);
								} catch (err) {
									console.error(`❌ [RECOVERY] Failed to resume a batch of chunks:`, err);
								}
								currentBatch = [];
								currentSize = 0;
							}
						}

						// Upload any remaining chunks as the final part
						if (currentBatch.length > 0) {
							try {
								await resumeChunkUpload(currentBatch);
							} catch (err) {
								console.error(`❌ [RECOVERY] Failed to resume final batch of chunks:`, err);
							}
						}

					} else if (existingSession.status === 'stopping') {
						// All chunks uploaded, finalize the recording
						console.log(`🏁 [RECOVERY] All chunks uploaded, finalizing recording...`);
						await finalizeRecording();
					}
				} else {
					// No active session, check for orphaned uploads
					console.log(`🔍 [RECOVERY] No active session found, checking for orphaned data...`);
					
					// Clean up any old orphaned chunks for this consultation
					const orphanedChunks = await chunkStorage.getUnuploadedChunks(consultationId);
					if (orphanedChunks.length > 0) {
						console.log(`🧹 [RECOVERY] Found ${orphanedChunks.length} orphaned chunks, cleaning up...`);
						await chunkStorage.clearSession(consultationId);
					}
				}
				
				// Clean up old data from other consultations
				await chunkStorage.clearOldChunks(24);
				
			} catch (err) {
				console.error(`❌ [RECOVERY] Session recovery failed:`, err);
			}
		};
		
		recoverSession();
	}, [consultationId, resumeChunkUpload, finalizeRecording]);

	return useMemo(() => ({ state, start, stop, complete, abort }), [state, start, stop, complete, abort]);
}



