"use client";

/**
 * Test Video Generator
 * Creates synthetic video blobs for testing recording functionality
 */

export interface TestVideoOptions {
  durationMs: number;
  width: number;
  height: number;
  fps: number;
  chunkDurationMs: number;
  includeAudio: boolean;
}

export interface TestVideoChunk {
  blob: Blob;
  chunkIndex: number;
  timestamp: number;
  size: number;
}

export class TestVideoGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Generate test video chunks simulating a real recording
   */
  async generateTestRecording(
    options: TestVideoOptions,
    onChunk: (chunk: TestVideoChunk) => void,
    onComplete: () => void
  ): Promise<void> {
    const {
      durationMs = 30000, // 30 seconds
      width = 1280,
      height = 720,
      fps = 15,
      chunkDurationMs = 3000, // 3 second chunks
      includeAudio = true
    } = options;

    this.canvas.width = width;
    this.canvas.height = height;

    console.log(`🎬 [TEST_VIDEO] Starting test recording generation: ${durationMs/1000}s @ ${width}x${height}`);

    try {
      // Create canvas stream
      const canvasStream = this.canvas.captureStream(fps);
      
      // Add audio if requested
      let combinedStream = canvasStream;
      if (includeAudio) {
        const audioStream = await this.createTestAudioStream();
        combinedStream = new MediaStream([
          ...canvasStream.getTracks(),
          ...audioStream.getTracks()
        ]);
      }

      // Create MediaRecorder
      const mimeType = this.getSupportedMimeType();
      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 1000000 // 1 Mbps
      });

      let chunkIndex = 0;
      const startTime = Date.now();

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          const chunk: TestVideoChunk = {
            blob: event.data,
            chunkIndex: chunkIndex++,
            timestamp: Date.now(),
            size: event.data.size
          };
          
          console.log(`📊 [TEST_VIDEO] Generated chunk ${chunk.chunkIndex}: ${(chunk.size / 1024).toFixed(1)}KB`);
          onChunk(chunk);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log(`✅ [TEST_VIDEO] Test recording generation complete: ${chunkIndex} chunks`);
        this.cleanup();
        onComplete();
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('❌ [TEST_VIDEO] MediaRecorder error:', error);
        this.cleanup();
      };

      // Start recording with chunks
      this.mediaRecorder.start(chunkDurationMs);

      // Start animation loop
      this.startAnimation(startTime, durationMs);

      // Stop after duration
      setTimeout(() => {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }, durationMs);

    } catch (error) {
      console.error('❌ [TEST_VIDEO] Failed to start test recording:', error);
      throw error;
    }
  }

  /**
   * Create animated canvas content
   */
  private startAnimation(startTime: number, durationMs: number): void {
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);

      // Clear canvas
      this.ctx.fillStyle = '#1e293b'; // Dark blue background
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw animated content
      this.drawTestPattern(elapsed, progress);
      this.drawProgressBar(progress);
      this.drawTimestamp(elapsed);
      this.drawBouncingBall(elapsed);

      // Continue animation if recording
      if (progress < 1 && this.mediaRecorder?.state === 'recording') {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }

  private drawTestPattern(elapsed: number, progress: number): void {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    // Rotating gradient circle
    const angle = (elapsed / 1000) * Math.PI * 2;
    const radius = 100 + Math.sin(elapsed / 1000) * 20;

    this.ctx.save();
    this.ctx.translate(centerX, centerY);
    this.ctx.rotate(angle);

    const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    gradient.addColorStop(0, '#3b82f6'); // Blue
    gradient.addColorStop(0.5, '#8b5cf6'); // Purple
    gradient.addColorStop(1, '#ef4444'); // Red

    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  private drawProgressBar(progress: number): void {
    const barWidth = this.canvas.width * 0.8;
    const barHeight = 20;
    const x = (this.canvas.width - barWidth) / 2;
    const y = this.canvas.height - 60;

    // Background
    this.ctx.fillStyle = '#374151';
    this.ctx.fillRect(x, y, barWidth, barHeight);

    // Progress
    this.ctx.fillStyle = '#10b981';
    this.ctx.fillRect(x, y, barWidth * progress, barHeight);

    // Border
    this.ctx.strokeStyle = '#6b7280';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, barWidth, barHeight);

    // Progress text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(
      `Recording Progress: ${Math.round(progress * 100)}%`,
      this.canvas.width / 2,
      y - 10
    );
  }

  private drawTimestamp(elapsed: number): void {
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const timestamp = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 24px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Time: ${timestamp}`, 20, 40);
    this.ctx.fillText('🎬 Test Recording', 20, 70);
    this.ctx.fillText('🔄 Refresh-Safe Demo', 20, 100);
  }

  private drawBouncingBall(elapsed: number): void {
    const ballRadius = 15;
    const bounceHeight = 200;
    const bounceSpeed = 0.003;
    
    const x = (this.canvas.width / 4) + Math.sin(elapsed * bounceSpeed) * (this.canvas.width / 4);
    const y = (this.canvas.height / 2) + Math.sin(elapsed * bounceSpeed * 2) * bounceHeight;

    this.ctx.fillStyle = '#fbbf24';
    this.ctx.beginPath();
    this.ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    this.ctx.fill();

    // Ball shadow
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(x + 5, y + 5, ballRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private async createTestAudioStream(): Promise<MediaStream> {
    this.audioContext = new AudioContext();
    
    // Create oscillator for test tone
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // A4 note
    this.oscillator.type = 'sine';

    // Create gain node for volume control
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime); // Low volume

    // Create destination for MediaStream
    const destination = this.audioContext.createMediaStreamDestination();

    // Connect nodes
    this.oscillator.connect(gainNode);
    gainNode.connect(destination);

    // Start oscillator
    this.oscillator.start();

    return destination.stream;
  }

  private getSupportedMimeType(): string {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=h264,opus',
      'video/webm',
      'video/mp4'
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log(`🎬 [TEST_VIDEO] Using MIME type: ${type}`);
        return type;
      }
    }

    console.warn('⚠️ [TEST_VIDEO] No optimal MIME type found, using default');
    return 'video/webm';
  }

  private cleanup(): void {
    if (this.oscillator) {
      this.oscillator.stop();
      this.oscillator = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.mediaRecorder = null;
  }

  /**
   * Stop the test recording early
   */
  stop(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }
}

/**
 * Quick utility to generate a test recording
 */
export async function generateTestRecording(
  onChunk: (chunk: TestVideoChunk) => void,
  options: Partial<TestVideoOptions> = {}
): Promise<void> {
  const generator = new TestVideoGenerator();
  
  return new Promise((resolve, reject) => {
    generator.generateTestRecording(
      {
        durationMs: 30000,
        width: 1280,
        height: 720,
        fps: 15,
        chunkDurationMs: 3000,
        includeAudio: true,
        ...options
      },
      onChunk,
      resolve
    ).catch(reject);
  });
}
