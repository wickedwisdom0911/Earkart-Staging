"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const DEFAULT_TIMESLICE = 5000;
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
	const sessionIdRef = useRef<string>(Date.now().toString());
	
	// Track incomplete uploads in localStorage - use session ID to allow multiple recordings
	const storageKey = `recording_${consultationId}_${sessionIdRef.current}`;

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

	// Upload queue with concurrency control
	const concurrencyRef = useRef<number>(DEFAULT_MAX_CONCURRENCY);
	const activeUploadsRef = useRef<number>(0);
	const queueRef = useRef<Array<() => Promise<void>>>([]);
	const uploadedPartsRef = useRef<UploadedPart[]>([]);

	// Buffer to aggregate 5s chunks into exact partSize parts
	const pendingBlobsRef = useRef<Blob[]>([]);
	const pendingSizeRef = useRef<number>(0);

	const runNextInQueue = useCallback(() => {
		if (activeUploadsRef.current >= concurrencyRef.current) return;
		const next = queueRef.current.shift();
		if (!next) return;
		activeUploadsRef.current += 1;
		next()
			.catch(() => {})
			.finally(() => {
				activeUploadsRef.current -= 1;
				setState((s) => ({ ...s, pendingParts: Math.max(0, s.pendingParts - 1) }));
				if (queueRef.current.length > 0) {
					setTimeout(runNextInQueue, 0);
				} else if (activeUploadsRef.current === 0 && state.isRecording === false && isStoppingRef.current) {
					// Await finalize in stop()
				}
			});
	}, [state.isRecording]);

	const enqueueUpload = useCallback((fn: () => Promise<void>) => {
		queueRef.current.push(fn);
		setState((s) => ({ ...s, pendingParts: s.pendingParts + 1 }));
		runNextInQueue();
	}, [runNextInQueue]);

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

	const uploadBlobPart = useCallback(async (blob: Blob, partNumber: number) => {
		const uploadId = uploadIdRef.current;
		if (!uploadId) throw new Error("No upload in progress");

		console.log(`🚀 [S3_UPLOAD] Uploading part ${partNumber}, size: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
		const { url } = await presignPart(uploadId, partNumber);
		const putRes = await fetch(url, {
			method: "PUT",
			body: blob,
			headers: { "Content-Type": "application/octet-stream" },
		});
		if (!putRes.ok) {
			console.error(`❌ [S3_UPLOAD] Part ${partNumber} failed: ${putRes.status} ${putRes.statusText}`);
			throw new Error(`S3 PUT failed with ${putRes.status}`);
		}
		const eTag = putRes.headers.get("ETag") || putRes.headers.get("Etag") || putRes.headers.get("etag");
		if (!eTag) {
			console.error(`❌ [S3_UPLOAD] Part ${partNumber} missing ETag header`);
			throw new Error("Missing ETag from S3 response; ensure CORS exposes ETag");
		}
		// Strip quotes to satisfy S3 CompleteMultipartUpload XML
		uploadedPartsRef.current.push({ partNumber, etag: eTag.replace(/"/g, "") });
		setState((s) => ({ ...s, uploadedParts: s.uploadedParts + 1, uploadedBytes: s.uploadedBytes + blob.size }));
		console.log(`✅ [S3_UPLOAD] Part ${partNumber} uploaded successfully, ETag: ${eTag}`);
	}, [presignPart]);

	// Helper: take exactly size bytes from pendingBlobsRef, returning a Blob and mutating the buffer
	const takeExactBytesFromBuffer = useCallback((size: number): Blob => {
		let remaining = size;
		const out: Blob[] = [];
		while (remaining > 0 && pendingBlobsRef.current.length > 0) {
			const head = pendingBlobsRef.current[0];
			if (head.size <= remaining) {
				out.push(head);
				pendingBlobsRef.current.shift();
				pendingSizeRef.current -= head.size;
				remaining -= head.size;
			} else {
				// Split head
				const part = head.slice(0, remaining);
				const leftover = head.slice(remaining);
				out.push(part);
				pendingBlobsRef.current[0] = leftover;
				pendingSizeRef.current -= remaining;
				remaining = 0;
			}
		}
		return new Blob(out, { type: "application/octet-stream" });
	}, []);

	const tryFlushFullParts = useCallback(() => {
		const partSize = partSizeRef.current;
		while (pendingSizeRef.current >= partSize) {
			const partBlob = takeExactBytesFromBuffer(partSize);
			const pn = nextPartNumberRef.current;
			enqueueUpload(() => uploadBlobPart(partBlob, pn));
			nextPartNumberRef.current = pn + 1;
		}
	}, [enqueueUpload, takeExactBytesFromBuffer, uploadBlobPart]);

	const handleChunk = useCallback((chunk: Blob) => {
		console.log(`📊 [RECORDING_CHUNK] Received ${(chunk.size / 1024).toFixed(1)}KB chunk, total pending: ${(pendingSizeRef.current / 1024 / 1024).toFixed(2)}MB`);
		pendingBlobsRef.current.push(chunk);
		pendingSizeRef.current += chunk.size;
		tryFlushFullParts();
	}, [tryFlushFullParts]);

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
			concurrencyRef.current = opts?.maxConcurrentUploads ?? DEFAULT_MAX_CONCURRENCY;

			// 1) Initiate multipart upload first
			const { uploadId, partSize } = await initiateMultipart(filename, preferredMime);
			uploadIdRef.current = uploadId;
			partSizeRef.current = Math.max(5 * 1024 * 1024, partSize || partSizeRef.current);
			setState((s) => ({ ...s, uploadId }));
			
			// Save upload session info for cleanup (not for recovery, since we can't recover data)
			localStorage.setItem(storageKey, JSON.stringify({
				uploadId,
				filename,
				timestamp: Date.now(),
				sessionId: sessionIdRef.current,
				status: 'recording' // Track recording status
			}));



			// 2) Capture screen (optionally with system audio if supported)
			const includeSystemAudio = opts?.captureSystemAudio === true;
			const screenStream = await navigator.mediaDevices.getDisplayMedia({
				video: { frameRate: 15 },
				audio: includeSystemAudio, // some browsers support tab/system audio when true
			});
			mediaStreamRef.current = screenStream;

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
					// Abort initiated multipart upload to avoid orphaned uploads
					try {
						const toAbort = uploadIdRef.current;
						if (toAbort) {
							await abortRecordingUpload({ uploadId: toAbort });
						}
					} catch {}
					uploadIdRef.current = null;
					uploadedPartsRef.current = [];
					queueRef.current = [];
					activeUploadsRef.current = 0;
					nextPartNumberRef.current = 1;
					pendingBlobsRef.current = [];
					pendingSizeRef.current = 0;
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
				const tooManyPending = state.pendingParts > 20;
				if (tooManyPending && recorder.state === "recording") {
					recorder.pause();
					const interval = setInterval(() => {
						const ok = queueRef.current.length < 5 && activeUploadsRef.current < concurrencyRef.current;
						if (ok) {
							clearInterval(interval);
							if (recorder.state === "paused") recorder.resume();
						}
					}, 500);
				}
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
			queueRef.current = [];
			activeUploadsRef.current = 0;
			nextPartNumberRef.current = 1;
			pendingBlobsRef.current = [];
			pendingSizeRef.current = 0;
		}
	}, [consultationId, handleChunk, initiateMultipart, state.isRecording, state.isInitializing]);

	const stop = useCallback(async () => {
		if (!state.isRecording && !state.isInitializing) return;
		isStoppingRef.current = true;
		setState((s) => ({ ...s, isRecording: false, isUploading: true }));

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

			// Flush any remaining buffered data as the final (possibly smaller) part
			if (pendingSizeRef.current > 0) {
				const finalBlob = takeExactBytesFromBuffer(pendingSizeRef.current);
				const pn = nextPartNumberRef.current;
				enqueueUpload(() => uploadBlobPart(finalBlob, pn));
				nextPartNumberRef.current = pn + 1;
			}

			await new Promise<void>((resolve) => {
				const check = () => {
					if (queueRef.current.length === 0 && activeUploadsRef.current === 0) return resolve();
					setTimeout(check, 250);
				};
				check();
			});

			const uploadId = uploadIdRef.current;
			if (uploadId) {
				const parts = [...uploadedPartsRef.current].sort((a, b) => a.partNumber - b.partNumber);
				const { key, playbackUrl } = await completeMultipart(uploadId, parts);
				console.log("✅ [RECORDING_COMPLETE] Recording saved successfully:", { 
					consultationId, 
					key, 
					playbackUrl,
					parts: parts.length,
					totalSize: uploadedPartsRef.current.reduce((sum, part) => sum + (part as any).size || 0, 0)
				});
				setState((s) => ({ ...s, s3Key: key, playbackUrl: playbackUrl ?? null }));
				
				// Clear localStorage since upload is complete
				localStorage.removeItem(storageKey);
			} else {
				console.log("⚠️ [RECORDING_COMPLETE] No upload ID found - recording may not have been saved");
			}
		} catch (err) {
			console.error("Failed to finalize upload:", err);
			setState((s) => ({ ...s, error: (err as Error).message }));
		} finally {
			uploadIdRef.current = null;
			uploadedPartsRef.current = [];
			queueRef.current = [];
			activeUploadsRef.current = 0;
			nextPartNumberRef.current = 1;
			pendingBlobsRef.current = [];
			pendingSizeRef.current = 0;
			isStoppingRef.current = false;
			setState((s) => ({ ...s, isUploading: false }));
		}
	}, [completeMultipart, enqueueUpload, state.isInitializing, state.isRecording, takeExactBytesFromBuffer, uploadBlobPart]);

	const complete = useCallback(async () => {
		const uploadId = uploadIdRef.current;
		if (!uploadId) return;

		// If there is pending buffered data that hasn't reached partSize, flush it as the final part
		if (pendingSizeRef.current > 0) {
			const finalBlob = takeExactBytesFromBuffer(pendingSizeRef.current);
			const pn = nextPartNumberRef.current;
			enqueueUpload(() => uploadBlobPart(finalBlob, pn));
			nextPartNumberRef.current = pn + 1;
		}

		// wait for queue drain
		await new Promise<void>((resolve) => {
			const check = () => {
				if (queueRef.current.length === 0 && activeUploadsRef.current === 0) return resolve();
				setTimeout(check, 250);
			};
			check();
		});

		if (uploadedPartsRef.current.length === 0) {
			await abortRecordingUpload({ uploadId });
			return;
		}
		const parts = [...uploadedPartsRef.current].sort((a, b) => a.partNumber - b.partNumber);
		await completeMultipart(uploadId, parts);
	}, [completeMultipart, enqueueUpload, takeExactBytesFromBuffer, uploadBlobPart]);

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
			// Clean up all state regardless of abort success/failure
			uploadIdRef.current = null;
			uploadedPartsRef.current = [];
			queueRef.current = [];
			activeUploadsRef.current = 0;
			nextPartNumberRef.current = 1;
			pendingBlobsRef.current = [];
			pendingSizeRef.current = 0;
			setState((s) => ({ ...s, isRecording: false, isUploading: false, uploadId: null, error: null }));
			
			// Clear localStorage since upload is aborted
			localStorage.removeItem(storageKey);
		}
	}, [storageKey]);

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

	// Check for incomplete uploads on mount
	useEffect(() => {
		const checkIncompleteUploads = async () => {
			try {
				// Check ALL localStorage keys for this consultation
				const allKeys = Object.keys(localStorage);
				const consultationKeys = allKeys.filter(key => 
					key.startsWith(`recording_${consultationId}_`) && key !== storageKey
				);
				
				console.log(`🔍 [RECORDING] Found ${consultationKeys.length} other recording sessions for consultation ${consultationId}`);
				
				for (const key of consultationKeys) {
					try {
						const stored = localStorage.getItem(key);
						if (!stored) continue;
						
						const { uploadId, timestamp, filename } = JSON.parse(stored);
						const isOld = Date.now() - timestamp > 30 * 60 * 1000; // 30 minutes
						
						if (uploadId && !isOld) {
							console.log("🔄 [RECORDING] Found incomplete upload from previous session:", uploadId, filename);
							
							// Instead of aborting, we'll let it remain incomplete but clean up localStorage
							// This allows multiple recording attempts without interfering with each other
							console.log("📂 [RECORDING] Allowing previous session to remain as incomplete record");
							console.log("🧹 [RECORDING] Cleaning up localStorage entry only");
						}
						
						// Remove the localStorage entry regardless of success/failure
						localStorage.removeItem(key);
					} catch (err) {
						console.error(`Error processing incomplete upload ${key}:`, err);
						localStorage.removeItem(key);
					}
				}
			} catch (err) {
				console.error("Error checking incomplete uploads:", err);
			}
		};
		
		checkIncompleteUploads();
	}, [consultationId, storageKey, complete]);

	return useMemo(() => ({ state, start, stop, complete, abort }), [state, start, stop, complete, abort]);
}


