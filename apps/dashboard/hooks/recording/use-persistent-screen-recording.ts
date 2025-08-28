"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { 
  recordingStorage, 
  generateChunkId, 
  generateSessionId,
  type StoredRecordingSession,
  type StoredChunk 
} from "@/utils/recording-storage";

import initiateRecordingUpload from "@/actions/recordings/initiate";
import presignRecordingPart from "@/actions/recordings/presign-part";
import completeRecordingUpload from "@/actions/recordings/complete";
import abortRecordingUpload from "@/actions/recordings/abort";

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

export type PersistentRecordingState = {
	isRecording: boolean;
	isInitializing: boolean;
	isUploading: boolean;
	isRecovering: boolean;
	error: string | null;
	uploadedBytes: number;
	uploadedParts: number;
	pendingParts: number;
	uploadId: string | null;
	s3Key: string | null;
  playbackUrl: string | null;
	sessionId: string | null;
	hasActiveSession: boolean;
};

const DEFAULT_TIMESLICE = 5000;
const DEFAULT_MAX_CONCURRENCY = 3;

export function usePersistentScreenRecording(consultationId: string) {
	const [state, setState] = useState<PersistentRecordingState>({
		isRecording: false,
		isInitializing: false,
		isUploading: false,
		isRecovering: false,
		error: null,
		uploadedBytes: 0,
		uploadedParts: 0,
		pendingParts: 0,
		uploadId: null,
		s3Key: null,
    playbackUrl: null,
		sessionId: null,
		hasActiveSession: false,
	});

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
	const sessionIdRef = useRef<string | null>(null);

	// Upload queue with concurrency control
	const concurrencyRef = useRef<number>(DEFAULT_MAX_CONCURRENCY);
	const activeUploadsRef = useRef<number>(0);
	const queueRef = useRef<Array<() => Promise<void>>>([]);
	const uploadedPartsRef = useRef<UploadedPart[]>([]);

	// Buffer to aggregate 5s chunks into exact partSize parts
	const pendingBlobsRef = useRef<Blob[]>([]);
	const pendingSizeRef = useRef<number>(0);

	// Storage-related refs
	const isRestoringRef = useRef<boolean>(false);

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

	const uploadBlobPart = useCallback(async (blob: Blob, partNumber: number, chunkId?: string) => {
		const uploadId = uploadIdRef.current;
		if (!uploadId) throw new Error("No upload in progress");

		try {
			const { url } = await presignPart(uploadId, partNumber);
			const putRes = await fetch(url, {
				method: "PUT",
				body: blob,
				headers: { "Content-Type": "application/octet-stream" },
			});
			if (!putRes.ok) throw new Error(`S3 PUT failed with ${putRes.status}`);
			const eTag = putRes.headers.get("ETag") || putRes.headers.get("Etag") || putRes.headers.get("etag");
			if (!eTag) throw new Error("Missing ETag from S3 response; ensure CORS exposes ETag");
			
			// Strip quotes to satisfy S3 CompleteMultipartUpload XML
			const uploadedPart = { partNumber, etag: eTag.replace(/"/g, "") };
			uploadedPartsRef.current.push(uploadedPart);
			
			// Mark chunk as uploaded in storage
			if (chunkId) {
				await recordingStorage.markChunkUploaded(chunkId);
			}

			// Update session in storage
			if (sessionIdRef.current) {
				const session = await recordingStorage.getSession(sessionIdRef.current);
				if (session) {
					session.uploadedParts = [...uploadedPartsRef.current];
					await recordingStorage.saveSession(session);
				}
			}

			setState((s) => ({ ...s, uploadedParts: s.uploadedParts + 1, uploadedBytes: s.uploadedBytes + blob.size }));
		} catch (error) {
			// If upload fails, the chunk remains in storage for retry
			console.error("Upload failed for chunk:", chunkId, error);
			throw error;
		}
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

	const saveChunkToStorage = useCallback(async (chunk: Blob): Promise<string> => {
		if (!sessionIdRef.current) throw new Error("No active session");
		
		const chunkId = generateChunkId();
		const partNumber = nextPartNumberRef.current;
		
		const storedChunk: StoredChunk = {
			id: chunkId,
			sessionId: sessionIdRef.current,
			partNumber,
			blob: chunk,
			timestamp: Date.now(),
			isUploaded: false,
		};

		await recordingStorage.saveChunk(storedChunk);
		return chunkId;
	}, []);

	const tryFlushFullParts = useCallback(async () => {
		const partSize = partSizeRef.current;
		while (pendingSizeRef.current >= partSize) {
			const partBlob = takeExactBytesFromBuffer(partSize);
			const chunkId = await saveChunkToStorage(partBlob);
			const pn = nextPartNumberRef.current;
			enqueueUpload(() => uploadBlobPart(partBlob, pn, chunkId));
			nextPartNumberRef.current = pn + 1;
		}
	}, [enqueueUpload, takeExactBytesFromBuffer, uploadBlobPart, saveChunkToStorage]);

	const handleChunk = useCallback(async (chunk: Blob) => {
		pendingBlobsRef.current.push(chunk);
		pendingSizeRef.current += chunk.size;
		await tryFlushFullParts();
	}, [tryFlushFullParts]);

	// Recovery function to restore session from storage
	const recoverSession = useCallback(async (): Promise<boolean> => {
		try {
			setState((s) => ({ ...s, isRecovering: true }));
			
			const activeSession = await recordingStorage.getActiveSession(consultationId);
			if (!activeSession) {
				setState((s) => ({ ...s, isRecovering: false }));
				return false;
			}

			console.log("🔄 Recovering recording session:", activeSession.sessionId);

			// Restore session state
			sessionIdRef.current = activeSession.sessionId;
			uploadIdRef.current = activeSession.uploadId;
			partSizeRef.current = activeSession.partSize;
			nextPartNumberRef.current = activeSession.nextPartNumber;
			uploadedPartsRef.current = [...activeSession.uploadedParts];

			setState((s) => ({
				...s,
				sessionId: activeSession.sessionId,
				uploadId: activeSession.uploadId,
				s3Key: activeSession.s3Key,
				uploadedParts: activeSession.uploadedParts.length,
				hasActiveSession: true,
				isRecovering: false,
			}));

			// Resume uploading pending chunks
			const pendingChunks = await recordingStorage.getPendingChunks(activeSession.sessionId);
			if (pendingChunks.length > 0) {
				console.log(`📤 Resuming upload of ${pendingChunks.length} pending chunks`);
				setState((s) => ({ ...s, isUploading: true }));

				for (const chunk of pendingChunks) {
					enqueueUpload(() => uploadBlobPart(chunk.blob, chunk.partNumber, chunk.id));
				}
			}

			return true;
		} catch (error) {
			console.error("Failed to recover session:", error);
			setState((s) => ({ ...s, isRecovering: false, error: "Failed to recover recording session" }));
			return false;
		}
	}, [consultationId, enqueueUpload, uploadBlobPart]);

	// Initialize and check for existing sessions on mount
	useEffect(() => {
		const initialize = async () => {
			try {
				// Clean up old sessions first
				await recordingStorage.cleanupOldSessions();
				
				// Check for active session
				const hasActive = await recoverSession();
				setState((s) => ({ ...s, hasActiveSession: hasActive }));
			} catch (error) {
				console.error("Failed to initialize recording storage:", error);
			}
		};

		initialize();
	}, [consultationId, recoverSession]);

	// Add beforeunload warning
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (state.isRecording || state.isUploading || (state.pendingParts > 0)) {
				e.preventDefault();
				e.returnValue = "Recording is in progress. Leaving will pause the upload but data will be preserved.";
				return e.returnValue;
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [state.isRecording, state.isUploading, state.pendingParts]);

	const start = useCallback(async (opts?: StartOptions) => {
		if (state.isRecording || state.isInitializing) return;
		setState((s) => ({ ...s, isInitializing: true, error: null }));

		try {
			const filename = opts?.filename || `consultation-${consultationId}-${Date.now()}.webm`;
			const mimeTypeCandidates = [
				"video/webm;codecs=vp9,opus",
				"video/webm;codecs=vp8,opus",
				"video/webm",
			];
			const preferredMime = mimeTypeCandidates.find((c) => MediaRecorder.isTypeSupported(c)) || "video/webm";
			const timeslice = opts?.timesliceMs ?? DEFAULT_TIMESLICE;
			concurrencyRef.current = opts?.maxConcurrentUploads ?? DEFAULT_MAX_CONCURRENCY;

			// 1) Initiate multipart upload first
			const { uploadId, partSize, key } = await initiateMultipart(filename, preferredMime);
			uploadIdRef.current = uploadId;
			partSizeRef.current = Math.max(5 * 1024 * 1024, partSize || partSizeRef.current);
			
			// 2) Create new session in storage
			const sessionId = generateSessionId();
			sessionIdRef.current = sessionId;
			
			const session: StoredRecordingSession = {
				sessionId,
				consultationId,
				uploadId,
				s3Key: key,
				partSize: partSizeRef.current,
				filename,
				mimeType: preferredMime,
				nextPartNumber: 1,
				uploadedParts: [],
				pendingChunks: [],
				isActive: true,
				createdAt: Date.now(),
				lastUpdated: Date.now(),
			};

			await recordingStorage.saveSession(session);

			setState((s) => ({ 
				...s, 
				uploadId, 
				s3Key: key, 
				sessionId,
				hasActiveSession: true 
			}));

			// 3) Capture screen (optionally with system audio if supported)
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
					// Abort initiated multipart upload and clean up storage
					try {
						const toAbort = uploadIdRef.current;
						if (toAbort) {
							await abortRecordingUpload({ uploadId: toAbort });
						}
						if (sessionIdRef.current) {
							await recordingStorage.deleteSession(sessionIdRef.current);
							await recordingStorage.deleteSessionChunks(sessionIdRef.current);
						}
					} catch {}
					
					// Reset state
					uploadIdRef.current = null;
					sessionIdRef.current = null;
					uploadedPartsRef.current = [];
					queueRef.current = [];
					activeUploadsRef.current = 0;
					nextPartNumberRef.current = 1;
					pendingBlobsRef.current = [];
					pendingSizeRef.current = 0;
					setState((s) => ({ ...s, isInitializing: false, hasActiveSession: false, error: "Please select 'Entire Screen' in the share picker." }));
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

			// 4) Create MediaRecorder
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

			// 5) Start recording with timeslices
			recorder.start(timeslice);
			setState((s) => ({ ...s, isRecording: true, isInitializing: false }));
		} catch (err) {
			console.error("Failed to start screen recording:", err);
			setState((s) => ({ ...s, isInitializing: false, error: (err as Error).message }));
			
			// Cleanup on error
			try { mediaRecorderRef.current?.stop(); } catch {}
			mediaRecorderRef.current = null;
			try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
			try { micStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
			mediaStreamRef.current = null;
			micStreamRef.current = null;
			
			// Clean up storage
			if (sessionIdRef.current) {
				try {
					await recordingStorage.deleteSession(sessionIdRef.current);
					await recordingStorage.deleteSessionChunks(sessionIdRef.current);
				} catch {}
			}
			
			uploadIdRef.current = null;
			sessionIdRef.current = null;
			uploadedPartsRef.current = [];
			queueRef.current = [];
			activeUploadsRef.current = 0;
			nextPartNumberRef.current = 1;
			pendingBlobsRef.current = [];
			pendingSizeRef.current = 0;
			setState((s) => ({ ...s, hasActiveSession: false }));
		}
	}, [consultationId, handleChunk, initiateMultipart, state.isRecording, state.isInitializing, state.pendingParts]);

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
				const chunkId = await saveChunkToStorage(finalBlob);
				const pn = nextPartNumberRef.current;
				enqueueUpload(() => uploadBlobPart(finalBlob, pn, chunkId));
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
				try { console.log("[RECORDING_COMPLETE]", { key, playbackUrl }); } catch {}
				setState((s) => ({ ...s, s3Key: key, playbackUrl: playbackUrl ?? null }));

				// Mark session as completed and clean up storage
				if (sessionIdRef.current) {
					await recordingStorage.deactivateSession(sessionIdRef.current);
					await recordingStorage.deleteSessionChunks(sessionIdRef.current);
				}
			}
		} catch (err) {
			console.error("Failed to finalize upload:", err);
			setState((s) => ({ ...s, error: (err as Error).message }));
		} finally {
			uploadIdRef.current = null;
			sessionIdRef.current = null;
			uploadedPartsRef.current = [];
			queueRef.current = [];
			activeUploadsRef.current = 0;
			nextPartNumberRef.current = 1;
			pendingBlobsRef.current = [];
			pendingSizeRef.current = 0;
			isStoppingRef.current = false;
			setState((s) => ({ ...s, isUploading: false, hasActiveSession: false }));
		}
	}, [completeMultipart, enqueueUpload, state.isInitializing, state.isRecording, takeExactBytesFromBuffer, uploadBlobPart, saveChunkToStorage]);

	const complete = useCallback(async () => {
		const uploadId = uploadIdRef.current;
		if (!uploadId) return;

		// If there is pending buffered data that hasn't reached partSize, flush it as the final part
		if (pendingSizeRef.current > 0) {
			const finalBlob = takeExactBytesFromBuffer(pendingSizeRef.current);
			const chunkId = await saveChunkToStorage(finalBlob);
			const pn = nextPartNumberRef.current;
			enqueueUpload(() => uploadBlobPart(finalBlob, pn, chunkId));
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
			// Clean up storage
			if (sessionIdRef.current) {
				await recordingStorage.deleteSession(sessionIdRef.current);
				await recordingStorage.deleteSessionChunks(sessionIdRef.current);
			}
			return;
		}
		const parts = [...uploadedPartsRef.current].sort((a, b) => a.partNumber - b.partNumber);
		const result = await completeMultipart(uploadId, parts);

		// Clean up storage after successful completion
		if (sessionIdRef.current) {
			await recordingStorage.deactivateSession(sessionIdRef.current);
			await recordingStorage.deleteSessionChunks(sessionIdRef.current);
		}

		setState((s) => ({ ...s, hasActiveSession: false }));
		return result;
	}, [completeMultipart, enqueueUpload, takeExactBytesFromBuffer, uploadBlobPart, saveChunkToStorage]);

	const abort = useCallback(async () => {
		const uploadId = uploadIdRef.current;
		if (!uploadId) return;
		try {
			await abortRecordingUpload({ uploadId });
			
			// Clean up storage
			if (sessionIdRef.current) {
				await recordingStorage.deleteSession(sessionIdRef.current);
				await recordingStorage.deleteSessionChunks(sessionIdRef.current);
			}
		} finally {
			uploadIdRef.current = null;
			sessionIdRef.current = null;
			uploadedPartsRef.current = [];
			queueRef.current = [];
			activeUploadsRef.current = 0;
			nextPartNumberRef.current = 1;
			pendingBlobsRef.current = [];
			pendingSizeRef.current = 0;
			setState((s) => ({ ...s, isRecording: false, isUploading: false, uploadId: null, hasActiveSession: false }));
		}
	}, []);

	// Resume uploading pending chunks manually
	const resumeUploads = useCallback(async () => {
		if (!sessionIdRef.current) return;
		
		const pendingChunks = await recordingStorage.getPendingChunks(sessionIdRef.current);
		if (pendingChunks.length === 0) return;

		setState((s) => ({ ...s, isUploading: true }));
		
		for (const chunk of pendingChunks) {
			enqueueUpload(() => uploadBlobPart(chunk.blob, chunk.partNumber, chunk.id));
		}
	}, [enqueueUpload, uploadBlobPart]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			try { mediaRecorderRef.current?.stop(); } catch {}
			try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
			try { trackEndHandlerRef.current?.(); } catch {}
			try { streamInactiveHandlerRef.current?.(); } catch {}
		};
	}, []);

	return useMemo(() => ({ 
		state, 
		start, 
		stop, 
		complete, 
		abort, 
		resumeUploads,
		recoverSession 
	}), [state, start, stop, complete, abort, resumeUploads, recoverSession]);
}
