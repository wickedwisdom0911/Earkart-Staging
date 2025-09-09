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

	// Normalize and strictly order parts for completion
	const buildOrderedParts = useCallback((): UploadedPart[] => {
		const normalized = uploadedPartsRef.current
			.filter((p) => p && (p as any).partNumber != null && (p as any).etag != null)
			.map((p) => ({
				partNumber: Number((p as any).partNumber),
				etag: String((p as any).etag).replace(/"/g, ""),
			}))
			.filter((p) => Number.isFinite(p.partNumber) && p.partNumber > 0 && p.etag.length > 0);

		// Deduplicate by part number (keep last occurrence)
		const byNumber = new Map<number, UploadedPart>();
		for (const p of normalized) {
			byNumber.set(p.partNumber, p);
		}

		return Array.from(byNumber.values()).sort((a, b) => a.partNumber - b.partNumber);
	}, []);

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
			
			// Store ETag exactly as returned by S3 (including quotes if present)
			const uploadedPart = { partNumber, etag: eTag };
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
			// Check if this is a presign error indicating invalid session
			const errorMsg = (error as any)?.message || '';
			const isSessionInvalid = errorMsg.includes('Unexpected presign response shape') || 
									errorMsg.includes('Failed to presign part') ||
									errorMsg.includes('Unauthorized') ||
									errorMsg.includes('expired') ||
									errorMsg.includes('invalid') ||
									errorMsg.includes('not found');
			
			if (isSessionInvalid) {
				console.error("❌ [UPLOAD] Upload session appears to be invalid, attempting recovery:", errorMsg);
				
				// Try to recover by creating a new upload session
				try {
					console.log("🔄 [RECOVERY] Attempting to create new upload session...");
					
					// Generate new session details
					const filename = `consultation-${consultationId}-${Date.now()}.webm`;
					const mimeType = "video/webm";
					
					// Create new upload session
					const { uploadId: newUploadId, partSize: newPartSize, key: newKey } = await initiateMultipart(filename, mimeType);
					
					// Update refs with new session
					uploadIdRef.current = newUploadId;
					partSizeRef.current = Math.max(5 * 1024 * 1024, newPartSize || partSizeRef.current);
					
					// Reset part numbering for new session
					nextPartNumberRef.current = 1;
					uploadedPartsRef.current = [];
					
					// Update storage session
					if (sessionIdRef.current) {
						const session = await recordingStorage.getSession(sessionIdRef.current);
						if (session) {
							session.uploadId = newUploadId;
							session.s3Key = newKey;
							session.partSize = partSizeRef.current;
							session.nextPartNumber = 1;
							session.uploadedParts = [];
							await recordingStorage.saveSession(session);
						}
					}
					
					// Update state
					setState((s) => ({ 
						...s, 
						uploadId: newUploadId,
						s3Key: newKey,
						uploadedParts: 0,
						error: null 
					}));
					
					console.log("✅ [RECOVERY] Created new upload session, retrying upload...");
					console.log("🔄 [RECOVERY] Upload session was refreshed automatically - recording continues seamlessly");
					
					// Retry the upload with new session
					const { url } = await presignPart(newUploadId, 1); // Always start with part 1 for new session
					const putRes = await fetch(url, {
						method: "PUT",
						body: blob,
						headers: { "Content-Type": "application/octet-stream" },
					});
					if (!putRes.ok) throw new Error(`S3 PUT failed with ${putRes.status}`);
					const eTag = putRes.headers.get("ETag") || putRes.headers.get("Etag") || putRes.headers.get("etag");
					if (!eTag) throw new Error("Missing ETag from S3 response; ensure CORS exposes ETag");
					
					// Store ETag for new session
					const uploadedPart = { partNumber: 1, etag: eTag };
					uploadedPartsRef.current.push(uploadedPart);
					nextPartNumberRef.current = 2; // Next part will be 2
					
					// Mark chunk as uploaded in storage
					if (chunkId) {
						await recordingStorage.markChunkUploaded(chunkId);
					}

					// Update session in storage
					if (sessionIdRef.current) {
						const session = await recordingStorage.getSession(sessionIdRef.current);
						if (session) {
							session.uploadedParts = [...uploadedPartsRef.current];
							session.nextPartNumber = nextPartNumberRef.current;
							await recordingStorage.saveSession(session);
						}
					}

					setState((s) => ({ ...s, uploadedParts: s.uploadedParts + 1, uploadedBytes: s.uploadedBytes + blob.size }));
					console.log("✅ [RECOVERY] Successfully recovered and uploaded chunk");
					return;
					
				} catch (recoveryError) {
					console.error("❌ [RECOVERY] Failed to recover upload session:", recoveryError);
					// Mark the current session as failed
					setState((s) => ({ 
						...s, 
						error: `Upload session recovery failed: ${(recoveryError as any)?.message || recoveryError}`,
						hasActiveSession: false 
					}));
					
					// Clear the invalid session data
					uploadIdRef.current = null;
					sessionIdRef.current = null;
					uploadedPartsRef.current = [];
					return;
				}
			}
			
			// For other errors, the chunk remains in storage for retry
			console.error("Upload failed for chunk:", chunkId, error);
			throw error;
		}
	}, [presignPart, consultationId, initiateMultipart]);

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
		if (!sessionIdRef.current) {
			console.error("❌ [STORAGE] No active session when trying to save chunk");
			throw new Error("No active session");
		}
		
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
		// Don't try to flush if there's no active session
		if (!sessionIdRef.current || !uploadIdRef.current) {
			console.warn("⚠️ [FLUSH] No active session, skipping chunk flush");
			return;
		}

		const partSize = partSizeRef.current;
		while (pendingSizeRef.current >= partSize) {
			const partBlob = takeExactBytesFromBuffer(partSize);
			try {
				const chunkId = await saveChunkToStorage(partBlob);
				const pn = nextPartNumberRef.current;
				enqueueUpload(() => uploadBlobPart(partBlob, pn, chunkId));
				nextPartNumberRef.current = pn + 1;
			} catch (error) {
				console.error("❌ [FLUSH] Failed to save chunk to storage:", error);
				// If we can't save to storage, we can't continue
				break;
			}
		}
	}, [enqueueUpload, takeExactBytesFromBuffer, uploadBlobPart, saveChunkToStorage]);

	const handleChunk = useCallback(async (chunk: Blob) => {
		// Don't process chunks if there's no active session
		if (!sessionIdRef.current || !uploadIdRef.current) {
			console.warn("⚠️ [HANDLE_CHUNK] No active session, discarding chunk");
			return;
		}

		pendingBlobsRef.current.push(chunk);
		pendingSizeRef.current += chunk.size;
		await tryFlushFullParts();
	}, [tryFlushFullParts]);

	// Helper functions for recording finalization - defined early to avoid TDZ
	const resumeUploads = useCallback(async () => {
		const sessionId = sessionIdRef.current;
		if (!sessionId) return;
		
		const pendingChunks = await recordingStorage.getPendingChunks(sessionId);
		
		for (const chunk of pendingChunks) {
			enqueueUpload(() => uploadBlobPart(chunk.blob, chunk.partNumber, chunk.id));
		}
	}, [enqueueUpload, uploadBlobPart]);

	// Wait for queue drain and optional extra settle time
	const waitUntilUploadsSettled = useCallback(async (extraMs: number = 0) => {
		await new Promise<void>((resolve) => {
			const check = () => {
				if (queueRef.current.length === 0 && activeUploadsRef.current === 0) return resolve();
				setTimeout(check, 250);
			};
			check();
		});
		if (extraMs > 0) await new Promise((r) => setTimeout(r, extraMs));
	}, []);

	// Build longest contiguous prefix [1..N] with normalized ETags
	const buildContiguousParts = useCallback((): Array<{ partNumber: number; etag: string }> => {
		const normalized = uploadedPartsRef.current
			.filter((p) => p && (p as any).partNumber != null && (p as any).etag != null)
			.map((p) => {
				const pn = Number((p as any).partNumber);
				let et = String((p as any).etag);
				// Ensure ETag is quoted once (as S3 typically returns)
				if (!/^".*"$/.test(et)) et = `"${et.replace(/\"/g, "")}"`;
				return { partNumber: pn, etag: et };
			})
			.filter((p) => Number.isFinite(p.partNumber) && p.partNumber > 0 && p.etag.length > 0)
			.sort((a, b) => a.partNumber - b.partNumber);
		let expected = 1;
		const parts: { partNumber: number; etag: string }[] = [];
		for (const p of normalized) {
			if (p.partNumber === expected) {
				parts.push(p);
				expected += 1;
			} else {
				break;
			}
		}
		return parts;
	}, []);

	// Refresh-safe finalizer with retries
	const finalizeNow = useCallback(async (uploadId: string): Promise<{ key: string; playbackUrl?: string } | undefined> => {
		const maxAttempts = 3;
		for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
			// Wait for uploads to drain a bit
			await new Promise((r) => setTimeout(r, 500));
			// Build longest contiguous prefix [1..N] with quoted ETags
			const normalized = uploadedPartsRef.current
				.filter((p) => p && (p as any).partNumber != null && (p as any).etag != null)
				.map((p) => {
					const pn = Number((p as any).partNumber);
					let et = String((p as any).etag);
					if (!/^".*"$/.test(et)) et = `"${et.replace(/\"/g, "")}"`;
					return { partNumber: pn, etag: et };
				})
				.filter((p) => Number.isFinite(p.partNumber) && p.partNumber > 0 && p.etag.length > 0)
				.sort((a, b) => a.partNumber - b.partNumber);
			let expected = 1;
			const parts: { partNumber: number; etag: string }[] = [];
			for (const p of normalized) {
				if (p.partNumber === expected) { parts.push(p); expected += 1; } else { break; }
			}
			if (parts.length === 0 || parts[0].partNumber !== 1) {
				try { await resumeUploads(); } catch {}
				await new Promise((r) => setTimeout(r, 1500));
				continue;
			}
			try {
				return await completeMultipart(uploadId, parts);
			} catch (e) {
				const msg = String((e as any)?.message || e || "");
				if (attempt === maxAttempts || !/(not found|etag|ascending|order)/i.test(msg)) throw e;
				try { await resumeUploads(); } catch {}
				await new Promise((r) => setTimeout(r, 2000));
			}
		}
	}, [completeMultipart, resumeUploads]);

	// Recovery function to restore session from storage
	const recoverSession = useCallback(async (): Promise<boolean> => {
		try {
			setState((s) => ({ ...s, isRecovering: true }));
			
			const activeSession = await recordingStorage.getActiveSession(consultationId);
			if (!activeSession) {
				setState((s) => ({ ...s, isRecovering: false }));
				return false;
			}

			console.log("🔄 Found existing recording session:", activeSession.sessionId);
			
			// First, try to complete the existing session to get a URL
			console.log("🎯 [RECOVERY] Attempting to complete existing session for URL...");
			try {
				const finalResult = await finalizeNow(activeSession.uploadId);
				if (finalResult?.playbackUrl) {
					console.log("✅ [RECOVERY] Successfully completed previous recording:", finalResult.playbackUrl);
					
					// Save the completed URL
					const savedRecordings = JSON.parse(localStorage.getItem(`recordings_${consultationId}`) || '[]');
					savedRecordings.push({
						id: `recovered-${Date.now()}`,
						name: `Recovered Recording - ${new Date().toLocaleString()}`,
						url: finalResult.playbackUrl,
						timestamp: new Date().toISOString(),
						status: 'recovered_on_refresh'
					});
					localStorage.setItem(`recordings_${consultationId}`, JSON.stringify(savedRecordings));
					console.log("💾 [RECOVERY] Saved recovered recording URL");
				}
			} catch (completeError) {
				console.log("⚠️ [RECOVERY] Could not complete previous session, will clean up:", completeError);
			}

			// Always clean up the old session and start fresh after completing it
			console.log("🧹 [RECOVERY] Cleaning up previous session to start fresh...");
			try {
				await recordingStorage.deleteSession(activeSession.sessionId);
				await recordingStorage.deleteSessionChunks(activeSession.sessionId);
				console.log("✅ [RECOVERY] Cleaned up previous session successfully");
			} catch (cleanupError) {
				console.error("❌ [RECOVERY] Failed to clean up previous session:", cleanupError);
			}
			
			setState((s) => ({ ...s, isRecovering: false, hasActiveSession: false }));
			return false; // Always return false to indicate we should start fresh

		} catch (error) {
			console.error("Failed to recover session:", error);
			setState((s) => ({ ...s, isRecovering: false, error: "Failed to recover recording session" }));
			return false;
		}
	}, [consultationId, enqueueUpload, uploadBlobPart, finalizeNow]);

	// Initialize and check for existing sessions on mount
	useEffect(() => {
		const initialize = async () => {
			try {
				console.log("🔄 Initializing recording system...");
				// Clean up old sessions first
				await recordingStorage.cleanupOldSessions();
				
				// Check for active session
				const hasActive = await recoverSession();
				console.log("📋 Recovery result:", { hasActive });
				setState((s) => ({ ...s, hasActiveSession: hasActive }));
				
				if (!hasActive) {
					console.log("💻 No existing recording session - ready for new recording");
				}
			} catch (error) {
				console.error("❌ Failed to initialize recording storage:", error);
				setState((s) => ({ ...s, hasActiveSession: false }));
			}
		};

		initialize();
	}, [consultationId, recoverSession]);

	// Handle page refresh - complete recording before unload
	useEffect(() => {
		const handleBeforeUnload = async (e: BeforeUnloadEvent) => {
			if (state.isRecording || state.isUploading || (state.pendingParts > 0)) {
				e.preventDefault();
				e.returnValue = "Recording is in progress. Completing current recording...";
				
				// Try to complete current recording quickly
				try {
					console.log("🔄 [BEFOREUNLOAD] Attempting to complete recording before page unload...");
					
					// Stop MediaRecorder to flush final chunks
					if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
						mediaRecorderRef.current.stop();
					}
					
					// Wait a bit for final chunks to process
					await new Promise(resolve => setTimeout(resolve, 1000));
					
					// Try to complete if we have an active upload
					const uploadId = uploadIdRef.current;
					if (uploadId && uploadedPartsRef.current.length > 0) {
						await finalizeNow(uploadId);
						console.log("✅ [BEFOREUNLOAD] Successfully completed recording before unload");
					}
				} catch (error) {
					console.error("❌ [BEFOREUNLOAD] Failed to complete recording before unload:", error);
				}
				
				return e.returnValue;
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => window.removeEventListener("beforeunload", handleBeforeUnload);
	}, [state.isRecording, state.isUploading, state.pendingParts, finalizeNow]);

	const start = useCallback(async (opts?: StartOptions) => {
		if (state.isRecording || state.isInitializing) return;
		setState((s) => ({ ...s, isInitializing: true, error: null }));

		try {
			// Clean up any existing invalid session first
			if (sessionIdRef.current) {
				console.log("🧹 [START] Cleaning up existing session before starting new one");
				try {
					await recordingStorage.deactivateSession(sessionIdRef.current);
					await recordingStorage.deleteSessionChunks(sessionIdRef.current);
				} catch (cleanupError) {
					console.warn("⚠️ [START] Failed to clean up existing session:", cleanupError);
				}
			}

			// Reset all refs to ensure clean state
			uploadIdRef.current = null;
			sessionIdRef.current = null;
			uploadedPartsRef.current = [];
			queueRef.current = [];
			activeUploadsRef.current = 0;
			nextPartNumberRef.current = 1;
			pendingBlobsRef.current = [];
			pendingSizeRef.current = 0;

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
				const result = await finalizeNow(uploadId);
				if (result) {
					const { key, playbackUrl } = result;
					try { console.log("[RECORDING_COMPLETE]", { key, playbackUrl }); } catch {}
					setState((s) => ({ ...s, s3Key: key, playbackUrl: playbackUrl ?? null }));
				}

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
	}, [finalizeNow, state.isInitializing, state.isRecording, takeExactBytesFromBuffer, uploadBlobPart, saveChunkToStorage]);

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
		// Normalize, sort, and enforce contiguous prefix starting at 1
		const normalized = uploadedPartsRef.current
			.filter((p) => p && (p as any).partNumber != null && (p as any).etag != null)
			.map((p) => {
				const pn = Number((p as any).partNumber);
				let et = String((p as any).etag);
				if (!/^".*"$/.test(et)) et = `"${et.replace(/\"/g, "")}"`;
				return { partNumber: pn, etag: et };
			})
			.filter((p) => Number.isFinite(p.partNumber) && p.partNumber > 0 && p.etag.length > 0)
			.sort((a, b) => a.partNumber - b.partNumber);
		let expected = 1;
		const parts: { partNumber: number; etag: string }[] = [];
		for (const p of normalized) {
			if (p.partNumber === expected) {
				parts.push(p);
				expected += 1;
			} else {
				break; // stop at first gap
			}
		}
		if (parts.length === 0 || parts[0].partNumber !== 1) {
			throw new Error("Cannot complete: no contiguous parts starting at 1");
		}
		const result = await finalizeNow(uploadId);
		// Clean up storage after successful completion
		if (sessionIdRef.current) {
			await recordingStorage.deactivateSession(sessionIdRef.current);
			await recordingStorage.deleteSessionChunks(sessionIdRef.current);
		}

		setState((s) => ({ ...s, hasActiveSession: false }));
		return result;
	}, [finalizeNow, enqueueUpload, takeExactBytesFromBuffer, uploadBlobPart, saveChunkToStorage]);

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
