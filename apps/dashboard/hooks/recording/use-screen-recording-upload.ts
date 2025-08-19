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
	});

	const mediaRecorderRef = useRef<MediaRecorder | null>(null);
	const mediaStreamRef = useRef<MediaStream | null>(null);
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
		uploadedPartsRef.current.push({ partNumber, etag: eTag.replace(/"/g, "") });
		setState((s) => ({ ...s, uploadedParts: s.uploadedParts + 1, uploadedBytes: s.uploadedBytes + blob.size }));
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
		pendingBlobsRef.current.push(chunk);
		pendingSizeRef.current += chunk.size;
		tryFlushFullParts();
	}, [tryFlushFullParts]);

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
			const { uploadId, partSize } = await initiateMultipart(filename, preferredMime);
			uploadIdRef.current = uploadId;
			partSizeRef.current = Math.max(5 * 1024 * 1024, partSize || partSizeRef.current);
			setState((s) => ({ ...s, uploadId }));

			// 2) Capture screen
			const stream = await navigator.mediaDevices.getDisplayMedia({
				video: { frameRate: 15 },
				audio: false,
			});
			mediaStreamRef.current = stream;

			// 3) Create MediaRecorder
			const recorder = new MediaRecorder(stream, { mimeType: preferredMime, videoBitsPerSecond: 2_000_000 });
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

			// 4) Start recording with timeslices
			recorder.start(timeslice);
			setState((s) => ({ ...s, isRecording: true, isInitializing: false }));
		} catch (err) {
			console.error("Failed to start screen recording:", err);
			setState((s) => ({ ...s, isInitializing: false, error: (err as Error).message }));
			try { mediaRecorderRef.current?.stop(); } catch {}
			mediaRecorderRef.current = null;
			try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
			mediaStreamRef.current = null;
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
				const { key } = await completeMultipart(uploadId, parts);
				setState((s) => ({ ...s, s3Key: key }));
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
		if (!uploadId) return;
		try {
			await abortRecordingUpload({ uploadId });
		} finally {
			uploadIdRef.current = null;
			uploadedPartsRef.current = [];
			queueRef.current = [];
			activeUploadsRef.current = 0;
			nextPartNumberRef.current = 1;
			pendingBlobsRef.current = [];
			pendingSizeRef.current = 0;
			setState((s) => ({ ...s, isRecording: false, isUploading: false }));
		}
	}, []);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			try { mediaRecorderRef.current?.stop(); } catch {}
			try { mediaStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
		};
	}, []);

	return useMemo(() => ({ state, start, stop, complete, abort }), [state, start, stop, complete, abort]);
}


