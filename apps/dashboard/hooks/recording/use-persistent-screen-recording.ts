"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { 
  recordingStorage, 
  generateChunkId, 
  generateSessionId,
  type StoredRecordingSession,
  type StoredChunk,
  type StoredRawChunk,
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
	agoraClient?: any; // Agora RTC client to capture remote audio from
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

const DEFAULT_TIMESLICE = 3000; // 3 seconds for more frequent data availability
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
	const audioContextRef = useRef<AudioContext | null>(null);
	const trackedVideoRef = useRef<MediaStreamTrack | null>(null);
	const trackedStreamRef = useRef<MediaStream | null>(null);
	const trackEndHandlerRef = useRef<(() => void) | null>(null);
	const streamInactiveHandlerRef = useRef<(() => void) | null>(null);
	const remoteAudioNodesRef = useRef<Map<string, { source: MediaStreamAudioSourceNode; stream: MediaStream }>>(new Map());
	const agoraAudioCleanupRef = useRef<(() => void) | null>(null);
	const uploadIdRef = useRef<string | null>(null);
	const s3KeyRef = useRef<string | null>(null);
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
	const pendingRawChunkIdsRef = useRef<string[]>([]); // parallel to pendingBlobsRef: blob[i] <-> rawChunkId[i]
	const pendingSizeRef = useRef<number>(0);

	// Raw chunk tracking (immediate persistence for crash/refresh recovery)
	const rawChunkIndexRef = useRef<number>(0);
	const rawChunkIdsInCurrentFlushRef = useRef<string[]>([]);

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
									errorMsg.includes('invalid');
			
			if (isSessionInvalid) {
				console.error("❌ [UPLOAD] Upload session appears to be invalid, marking for recovery:", errorMsg);
				setState((s) => ({ 
					...s, 
					error: `Upload session invalid: ${errorMsg}`,
					hasActiveSession: false 
				}));
				
				uploadIdRef.current = null;
				sessionIdRef.current = null;
				uploadedPartsRef.current = [];
				
				return;
			}
			
			console.error("Upload failed for chunk:", chunkId, error);
			throw error;
		}
	}, [presignPart]);

	// Helper: take exactly size bytes from pendingBlobsRef, returning a Blob and mutating the buffer.
	// Also populates rawChunkIdsInCurrentFlushRef with raw chunk IDs for fully-consumed blobs (for upload tracking).
	const takeExactBytesFromBuffer = useCallback((size: number): Blob => {
		rawChunkIdsInCurrentFlushRef.current = [];
		let remaining = size;
		const out: Blob[] = [];
		while (remaining > 0 && pendingBlobsRef.current.length > 0) {
			const head = pendingBlobsRef.current[0];
			const rawId = pendingRawChunkIdsRef.current[0];
			if (head.size <= remaining) {
				out.push(head);
				pendingBlobsRef.current.shift();
				if (rawId) {
					pendingRawChunkIdsRef.current.shift();
					rawChunkIdsInCurrentFlushRef.current.push(rawId);
				}
				pendingSizeRef.current -= head.size;
				remaining -= head.size;
			} else {
				// Split head - don't consume raw chunk id (partial blob stays)
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
		if (!sessionIdRef.current || !uploadIdRef.current) {
			console.warn("⚠️ [FLUSH] No active session, skipping chunk flush");
			return;
		}

		const partSize = partSizeRef.current;
		while (pendingSizeRef.current >= partSize) {
			rawChunkIdsInCurrentFlushRef.current = [];
			const partBlob = takeExactBytesFromBuffer(partSize);
			try {
				const chunkId = await saveChunkToStorage(partBlob);
				const pn = nextPartNumberRef.current;
				const rawIds = [...rawChunkIdsInCurrentFlushRef.current];
				enqueueUpload(async () => {
					await uploadBlobPart(partBlob, pn, chunkId);
					if (rawIds.length > 0) {
						await recordingStorage.markRawChunksAsUploaded(rawIds);
					}
				});
				nextPartNumberRef.current = pn + 1;
			} catch (error) {
				console.error("❌ [FLUSH] Failed to save chunk to storage:", error);
				break;
			}
		}
	}, [enqueueUpload, takeExactBytesFromBuffer, uploadBlobPart, saveChunkToStorage]);

	const handleChunk = useCallback(async (chunk: Blob) => {
		if (!sessionIdRef.current || !uploadIdRef.current) {
			console.warn("⚠️ [HANDLE_CHUNK] No active session, discarding chunk");
			return;
		}

		// Persist raw chunk immediately to IndexedDB (survives refresh)
		const rawIndex = rawChunkIndexRef.current++;
		const rawId = `raw-${sessionIdRef.current}-${rawIndex}`;
		try {
			await recordingStorage.saveRawChunk({
				id: rawId,
				sessionId: sessionIdRef.current,
				chunkIndex: rawIndex,
				blob: chunk,
				timestamp: Date.now(),
				isUploaded: false,
			});
		} catch (e) {
			console.warn("⚠️ [RAW_CHUNK] Failed to persist raw chunk:", e);
		}

		pendingBlobsRef.current.push(chunk);
		pendingRawChunkIdsRef.current.push(rawId);
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
			await new Promise((r) => setTimeout(r, 500));
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

			try {
				console.log("🧪 [RECOVERY] Testing upload session validity...");
				await presignPart(activeSession.uploadId, 1);
				console.log("✅ [RECOVERY] Upload session is valid, proceeding with recovery");
				
				sessionIdRef.current = activeSession.sessionId;
				uploadIdRef.current = activeSession.uploadId;
				partSizeRef.current = activeSession.partSize;
				nextPartNumberRef.current = activeSession.nextPartNumber;
				uploadedPartsRef.current = [...activeSession.uploadedParts];

				// Keep isRecovering true until ALL uploads + finalize complete
				setState((s) => ({
					...s,
					sessionId: activeSession.sessionId,
					uploadId: activeSession.uploadId,
					s3Key: activeSession.s3Key || null,
					uploadedParts: activeSession.uploadedParts.length,
					hasActiveSession: true,
					isRecovering: true,
					isUploading: true,
					error: null,
				}));

				// 1) Resume pending aggregate chunks
				const pendingChunks = await recordingStorage.getPendingChunks(activeSession.sessionId);
				if (pendingChunks.length > 0) {
					console.log(`📤 [RECOVERY] Resuming upload of ${pendingChunks.length} pending chunks`);
					for (const chunk of pendingChunks) {
						enqueueUpload(() => uploadBlobPart(chunk.blob, chunk.partNumber, chunk.id));
					}
				}

				// 2) Process unuploaded raw chunks (3s segments persisted before refresh)
				const unuploadedRaw = await recordingStorage.getUnuploadedRawChunks(activeSession.sessionId);
				if (unuploadedRaw.length > 0) {
					console.log(`📦 [RECOVERY] Found ${unuploadedRaw.length} raw chunks to aggregate and upload`);
					const partSize = activeSession.partSize;
					let acc: Blob[] = [];
					let accSize = 0;
					let pn = nextPartNumberRef.current;
					for (const raw of unuploadedRaw) {
						acc.push(raw.blob);
						accSize += raw.blob.size;
						while (accSize >= partSize) {
							const take = Math.min(partSize, accSize);
							const toTake: Blob[] = [];
							let remaining = take;
							while (remaining > 0 && acc.length > 0) {
								const h = acc[0];
								if (h.size <= remaining) {
									toTake.push(acc.shift()!);
									accSize -= h.size;
									remaining -= h.size;
								} else {
									toTake.push(h.slice(0, remaining));
									acc[0] = h.slice(remaining);
									accSize -= remaining;
									remaining = 0;
								}
							}
							const partBlob = new Blob(toTake, { type: "application/octet-stream" });
							const chunkId = await saveChunkToStorage(partBlob);
							const partNum = pn++;
							const rawIdsToMark = unuploadedRaw
								.filter((r) => toTake.some((b) => b === r.blob))
								.map((r) => r.id);
							enqueueUpload(async () => {
								await uploadBlobPart(partBlob, partNum, chunkId);
								if (rawIdsToMark.length > 0) {
									await recordingStorage.markRawChunksAsUploaded(rawIdsToMark);
								}
							});
							nextPartNumberRef.current = pn;
							accSize = acc.reduce((s, b) => s + b.size, 0);
						}
					}
					if (acc.length > 0 && accSize > 0) {
						const finalBlob = new Blob(acc, { type: "application/octet-stream" });
						const chunkId = await saveChunkToStorage(finalBlob);
						const partNum = pn++;
						enqueueUpload(() => uploadBlobPart(finalBlob, partNum, chunkId));
						nextPartNumberRef.current = pn;
						const rawIdsToMark = unuploadedRaw.filter((r) => acc.includes(r.blob)).map((r) => r.id);
						if (rawIdsToMark.length > 0) {
							recordingStorage.markRawChunksAsUploaded(rawIdsToMark).catch(() => {});
						}
					}
				}

				// 3) Auto-finalize when uploads drain (capture from closure to avoid race)
				const recoveryUploadId = activeSession.uploadId;
				const recoverySessionId = activeSession.sessionId;
				(async () => {
					try {
						await waitUntilUploadsSettled(1500);
						if (recoveryUploadId && uploadedPartsRef.current.length > 0) {
							const result = await finalizeNow(recoveryUploadId);
							if (result?.playbackUrl) {
								const storageKey = `recordings_${consultationId}`;
								const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
								if (!saved.some((r: any) => r.url === result.playbackUrl)) {
									saved.push({
										id: `recovery-${Date.now()}`,
										name: `Recovered Recording - ${new Date().toLocaleString()}`,
										url: result.playbackUrl,
										timestamp: new Date().toISOString(),
										status: "completed",
										segmentType: "recovery",
									});
									localStorage.setItem(storageKey, JSON.stringify(saved));
								}
								setState((s) => ({ ...s, playbackUrl: result.playbackUrl ?? null }));
							}
							try {
								await recordingStorage.deactivateSession(recoverySessionId);
								await recordingStorage.deleteSessionChunks(recoverySessionId);
								await recordingStorage.deleteRawChunksForSession(recoverySessionId);
							} catch {}
						}
					} finally {
						setState((s) => ({ ...s, isRecovering: false, isUploading: false, hasActiveSession: false }));
						console.log("✅ [RECOVERY] Recovery complete — Start Recording button now available");
					}
				})();

				return true;
			} catch (error) {
				console.log("⚠️ [RECOVERY] Cannot recover existing session, attempting final completion:", error);
				
				try {
					console.log("🎯 [RECOVERY] Attempting final completion of pre-refresh session...");
					
					const pendingChunks = await recordingStorage.getPendingChunks(activeSession.sessionId);
					if (pendingChunks.length > 0) {
						console.log(`📦 [RECOVERY] Found ${pendingChunks.length} chunks from pre-refresh session`);
						
						const allChunks = pendingChunks.map(chunk => chunk.blob);
						const totalSize = allChunks.reduce((total, chunk) => total + chunk.size, 0);
						const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
						const recordingBlob = new Blob(allChunks, { type: 'video/webm' });
						const blobUrl = URL.createObjectURL(recordingBlob);
						
						const savedRecordings = JSON.parse(localStorage.getItem(`recordings_${consultationId}`) || '[]');
						const recoveredRecording = {
							id: `recovered-${Date.now()}`,
							name: `Pre-Refresh Recording - ${new Date().toLocaleString()}`,
							url: blobUrl,
							size: `${sizeInMB}MB`,
							chunks: allChunks.length,
							timestamp: new Date().toISOString(),
							status: 'recovered',
							reason: 'Session invalid, saved as backup',
							segmentType: 'pre_refresh_backup'
						};
						
						savedRecordings.push(recoveredRecording);
						localStorage.setItem(`recordings_${consultationId}`, JSON.stringify(savedRecordings));
						
						console.log(`💾 [RECOVERY] Saved pre-refresh recording as backup: ${sizeInMB}MB`);
					} else {
						console.log("ℹ️ [RECOVERY] No chunks found in failed session");
					}
				} catch (backupError) {
					console.error("❌ [RECOVERY] Failed to save pre-refresh backup:", backupError);
				}
				
				try {
					await recordingStorage.deleteSession(activeSession.sessionId);
					console.log("🧹 [RECOVERY] Cleaned up invalid session from storage");
				} catch (cleanupError) {
					console.error("❌ [RECOVERY] Failed to clean up invalid session:", cleanupError);
				}
			}

			console.log("🧹 Cleaning up broken session and starting fresh");
			await recordingStorage.deactivateSession(activeSession.sessionId);
			await recordingStorage.deleteSessionChunks(activeSession.sessionId);
			
			setState((s) => ({ ...s, isRecovering: false, hasActiveSession: false }));
			return false;

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
				await recordingStorage.cleanupOldSessions();
				
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

	// Aggressive pre-refresh recovery
	useEffect(() => {
		const saveAbandonedChunks = async () => {
			try {
				console.log("🔍 [ABANDONED] Checking for abandoned chunks from previous sessions...");
				
				const allSessions = await recordingStorage.getAllSessions();
				const abandonedSessions = allSessions.filter(session => 
					session.consultationId === consultationId && 
					!session.isActive && 
					session.sessionId !== sessionIdRef.current
				);
				
				console.log(`📦 [ABANDONED] Found ${abandonedSessions.length} abandoned sessions`);
				
				for (const session of abandonedSessions) {
					try {
						const chunks = await recordingStorage.getPendingChunks(session.sessionId);
						if (chunks.length > 0) {
							console.log(`📦 [ABANDONED] Session ${session.sessionId} has ${chunks.length} unsaved chunks`);
							
							const allChunks = chunks.map(chunk => chunk.blob);
							const totalSize = allChunks.reduce((total, chunk) => total + chunk.size, 0);
							const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
							const recordingBlob = new Blob(allChunks, { type: 'video/webm' });
							const blobUrl = URL.createObjectURL(recordingBlob);
							
							const savedRecordings = JSON.parse(localStorage.getItem(`recordings_${consultationId}`) || '[]');
							const recoveredRecording = {
								id: `abandoned-${session.sessionId}-${Date.now()}`,
								name: `Recovered Recording - ${new Date(session.createdAt).toLocaleString()}`,
								url: blobUrl,
								size: `${sizeInMB}MB`,
								chunks: allChunks.length,
								timestamp: new Date().toISOString(),
								status: 'recovered',
								reason: 'Abandoned session recovered',
								segmentType: 'abandoned_recovery'
							};
							
							savedRecordings.push(recoveredRecording);
							localStorage.setItem(`recordings_${consultationId}`, JSON.stringify(savedRecordings));
							
							console.log(`💾 [ABANDONED] Recovered abandoned recording: ${sizeInMB}MB`);
							
							await recordingStorage.deleteSession(session.sessionId);
							await recordingStorage.deleteSessionChunks(session.sessionId);
						}
					} catch (error) {
						console.error(`❌ [ABANDONED] Failed to recover session ${session.sessionId}:`, error);
					}
				}
			} catch (error) {
				console.error("❌ [ABANDONED] Failed to check for abandoned chunks:", error);
			}
		};

		const timeoutId = setTimeout(saveAbandonedChunks, 3000);
		return () => clearTimeout(timeoutId);
	}, [consultationId]);

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
		if (state.isRecording || state.isInitializing || state.isRecovering) return;
		setState((s) => ({ ...s, isInitializing: true, error: null }));

		try {
			if (sessionIdRef.current) {
				console.log("🧹 [START] Cleaning up existing session before starting new one");
				try {
					await recordingStorage.deactivateSession(sessionIdRef.current);
					await recordingStorage.deleteSessionChunks(sessionIdRef.current);
					await recordingStorage.deleteRawChunksForSession(sessionIdRef.current);
				} catch (cleanupError) {
					console.warn("⚠️ [START] Failed to clean up existing session:", cleanupError);
				}
			}

			uploadIdRef.current = null;
			sessionIdRef.current = null;
			uploadedPartsRef.current = [];
			queueRef.current = [];
			activeUploadsRef.current = 0;
			nextPartNumberRef.current = 1;
			pendingBlobsRef.current = [];
			pendingRawChunkIdsRef.current = [];
			pendingSizeRef.current = 0;
			rawChunkIndexRef.current = 0;

			const filename = opts?.filename || `consultation-${consultationId}-${Date.now()}.webm`;
			const mimeTypeCandidates = [
				"video/webm;codecs=vp9,opus",
				"video/webm;codecs=vp8,opus",
				"video/webm",
			];
			const preferredMime = mimeTypeCandidates.find((c) => MediaRecorder.isTypeSupported(c)) || "video/webm";
			const timeslice = opts?.timesliceMs ?? DEFAULT_TIMESLICE;
			concurrencyRef.current = opts?.maxConcurrentUploads ?? DEFAULT_MAX_CONCURRENCY;

			const { uploadId, partSize, key } = await initiateMultipart(filename, preferredMime);
			uploadIdRef.current = uploadId;
			partSizeRef.current = Math.max(5 * 1024 * 1024, partSize || partSizeRef.current);
			
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

			const includeSystemAudio = opts?.captureSystemAudio === true;
			const screenStream = await navigator.mediaDevices.getDisplayMedia({
				video: { frameRate: 15 },
				audio: includeSystemAudio,
			});
			mediaStreamRef.current = screenStream;

			try {
				const vTrack = screenStream.getVideoTracks()[0] || null;
				trackedVideoRef.current = vTrack;
				trackedStreamRef.current = screenStream;
				if (vTrack) {
					const onEnded = async () => {
						if (!uploadIdRef.current && mediaRecorderRef.current == null) return;
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

			if (opts?.requireEntireScreen) {
				const track = screenStream.getVideoTracks()[0];
				const settings = (track?.getSettings?.() as any) || {};
				if (settings?.displaySurface !== "monitor") {
					try { track?.stop?.(); } catch {}
					mediaStreamRef.current = null;
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

			let finalStream: MediaStream = screenStream;
			const wantsMic = opts?.captureMic !== false;
			
			const agoraClient = opts?.agoraClient;
			const hasAgoraAudio = Boolean(agoraClient);
			
			if (wantsMic || hasAgoraAudio) {
				try {
					console.log("🎵 Setting up audio mixing...", { wantsMic, hasAgoraAudio });
					
					const audioContext = new AudioContext();
					audioContextRef.current = audioContext;
					const audioDestination = audioContext.createMediaStreamDestination();
					
					if (wantsMic) {
						try {
							const mic = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
							micStreamRef.current = mic;
							const micSource = audioContext.createMediaStreamSource(mic);
							micSource.connect(audioDestination);
							console.log("🎤 Microphone audio connected to mixer");
						} catch (e) {
							console.warn("🎤 Mic capture failed:", e);
						}
					}
					
					if (audioContext.state === "suspended") {
						try {
							await audioContext.resume();
						} catch (resumeErr) {
							console.warn("⚠️ Failed to resume AudioContext before mixing:", resumeErr);
						}
					}

					const attachRemoteAudio = async (remoteUser: any) => {
						try {
							if (!remoteUser?.uid) return;

							const key = String(remoteUser.uid);
							if (remoteAudioNodesRef.current.has(key)) {
								return;
							}

							if (agoraClient?.subscribe) {
								try {
									await agoraClient.subscribe(remoteUser, "audio");
								} catch (subscribeErr) {
									console.warn("🔊 Failed to subscribe to remote audio:", subscribeErr);
								}
							}

							const track = remoteUser.audioTrack?.getMediaStreamTrack?.();
							if (!track) {
								console.warn("🔊 Remote audio track not ready for user:", remoteUser.uid);
								return;
							}

							const remoteStream = new MediaStream([track]);
							const remoteSource = audioContext.createMediaStreamSource(remoteStream);
							remoteSource.connect(audioDestination);
							remoteAudioNodesRef.current.set(key, { source: remoteSource, stream: remoteStream });
							console.log("🔊 Remote audio connected to mixer from user:", remoteUser.uid);
						} catch (err) {
							console.warn("🔊 attachRemoteAudio failed:", err);
						}
					};

					const detachRemoteAudio = (remoteUser: any) => {
						const key = String(remoteUser?.uid);
						const existing = remoteAudioNodesRef.current.get(key);
						if (existing) {
							try { existing.source.disconnect(); } catch {}
							try { existing.stream.getTracks().forEach((t) => t.stop()); } catch {}
							remoteAudioNodesRef.current.delete(key);
							console.log("🔇 Remote audio disconnected from mixer for user:", remoteUser?.uid);
						}
					};

					if (hasAgoraAudio && agoraClient) {
						try {
							const remoteUsers = agoraClient.remoteUsers || [];
							console.log("👥 Attaching existing remote users for audio mix:", remoteUsers.length);
							for (const remoteUser of remoteUsers) {
								attachRemoteAudio(remoteUser);
							}

							const handleUserPublished = async (user: any, mediaType: string) => {
								if (mediaType !== "audio") return;
								await attachRemoteAudio(user);
							};

							const handleUserUnpublished = (user: any, mediaType: string) => {
								if (mediaType !== "audio") return;
								detachRemoteAudio(user);
							};

							const handleUserLeft = (user: any) => detachRemoteAudio(user);

							agoraClient.on?.("user-published", handleUserPublished);
							agoraClient.on?.("user-unpublished", handleUserUnpublished);
							agoraClient.on?.("user-left", handleUserLeft);

							agoraAudioCleanupRef.current = () => {
								agoraClient.off?.("user-published", handleUserPublished);
								agoraClient.off?.("user-unpublished", handleUserUnpublished);
								agoraClient.off?.("user-left", handleUserLeft);
								remoteAudioNodesRef.current.forEach(({ source }) => {
									try { source.disconnect(); } catch {}
								});
								remoteAudioNodesRef.current.clear();
							};
						} catch (e) {
							console.warn("🔊 Failed to capture remote audio:", e);
						}
					}
					
					const screenAudioTracks = screenStream.getAudioTracks();
					if (screenAudioTracks.length > 0) {
						try {
							const screenAudioSource = audioContext.createMediaStreamSource(
								new MediaStream(screenAudioTracks)
							);
							screenAudioSource.connect(audioDestination);
							console.log("🖥️ Screen audio connected to mixer");
						} catch (e) {
							console.warn("🖥️ Failed to add screen audio to mixer:", e);
						}
					}
					
					const mixedAudioTracks = audioDestination.stream.getAudioTracks();
					finalStream = new MediaStream([
						...screenStream.getVideoTracks(),
						...mixedAudioTracks,
					]);
					
					console.log("✅ Audio mixing complete. Final stream tracks:", {
						video: finalStream.getVideoTracks().length,
						audio: finalStream.getAudioTracks().length,
					});
					
				} catch (e) {
					console.error("❌ Audio mixing failed:", e);
					console.warn("Falling back to screen stream only");
					finalStream = screenStream;
				}
			}

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
				setState((s) => ({ ...s, isRecording: false }));
			};

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
	}, [consultationId, handleChunk, initiateMultipart, state.isRecording, state.isInitializing, state.isRecovering, state.pendingParts]);

	const stop = useCallback(async () => {
		if (!state.isRecording && !state.isInitializing) return;
		isStoppingRef.current = true;
		setState((s) => ({ ...s, isRecording: false, isUploading: true }));

		try {
			try {
				if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
					// Flush any buffered data before stop (captures last few seconds)
					mediaRecorderRef.current.requestData();
					mediaRecorderRef.current.stop();
				}
			} catch {}
			mediaRecorderRef.current = null;
			try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
			mediaStreamRef.current = null;
			try { micStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
			micStreamRef.current = null;
			try { 
				if (audioContextRef.current) {
					audioContextRef.current.close();
					audioContextRef.current = null;
				}
			} catch {}
			try {
				agoraAudioCleanupRef.current?.();
			} catch {}
			agoraAudioCleanupRef.current = null;
			try { trackEndHandlerRef.current?.(); } catch {}
			trackEndHandlerRef.current = null;
			try { streamInactiveHandlerRef.current?.(); } catch {}
			streamInactiveHandlerRef.current = null;
			trackedVideoRef.current = null;
			trackedStreamRef.current = null;

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

				if (sessionIdRef.current) {
					await recordingStorage.deactivateSession(sessionIdRef.current);
					await recordingStorage.deleteSessionChunks(sessionIdRef.current);
					await recordingStorage.deleteRawChunksForSession(sessionIdRef.current);
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
			pendingRawChunkIdsRef.current = [];
			pendingSizeRef.current = 0;
			isStoppingRef.current = false;
			setState((s) => ({ ...s, isUploading: false, hasActiveSession: false }));
		}
	}, [finalizeNow, state.isInitializing, state.isRecording, takeExactBytesFromBuffer, uploadBlobPart, saveChunkToStorage, enqueueUpload]);

	const complete = useCallback(async () => {
		const uploadId = uploadIdRef.current;
		if (!uploadId) return;

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

		if (uploadedPartsRef.current.length === 0) {
			await abortRecordingUpload({ uploadId });
			if (sessionIdRef.current) {
				await recordingStorage.deleteSession(sessionIdRef.current);
				await recordingStorage.deleteSessionChunks(sessionIdRef.current);
			}
			return;
		}
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
				break;
			}
		}
		if (parts.length === 0 || parts[0].partNumber !== 1) {
			throw new Error("Cannot complete: no contiguous parts starting at 1");
		}
		const result = await finalizeNow(uploadId);
		if (sessionIdRef.current) {
			await recordingStorage.deactivateSession(sessionIdRef.current);
			await recordingStorage.deleteSessionChunks(sessionIdRef.current);
			await recordingStorage.deleteRawChunksForSession(sessionIdRef.current);
		}

		setState((s) => ({ ...s, hasActiveSession: false }));
		return result;
	}, [finalizeNow, enqueueUpload, takeExactBytesFromBuffer, uploadBlobPart, saveChunkToStorage]);

	const abort = useCallback(async () => {
		const uploadId = uploadIdRef.current;
		if (!uploadId) return;
		try {
			await abortRecordingUpload({ uploadId });
			
			if (sessionIdRef.current) {
				await recordingStorage.deleteSession(sessionIdRef.current);
				await recordingStorage.deleteSessionChunks(sessionIdRef.current);
				await recordingStorage.deleteRawChunksForSession(sessionIdRef.current);
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
