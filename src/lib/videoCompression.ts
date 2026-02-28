/**
 * Compress a video file using canvas + MediaRecorder re-encoding.
 * Works entirely client-side. Falls back to the original file on error.
 */
export async function compressVideo(
  file: File,
  maxWidth = 720,
  maxHeight = 720,
  videoBitrate = 800_000 // 800 kbps
): Promise<Blob> {
  // Skip if already small enough (under 2MB)
  if (file.size < 2 * 1024 * 1024) return file;

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const timeout = setTimeout(() => {
      cleanup();
      resolve(file); // fallback to original
    }, 60_000);

    const cleanup = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(video.src);
    };

    video.onloadedmetadata = async () => {
      try {
        let { videoWidth: w, videoHeight: h } = video;
        if (w === 0 || h === 0) { cleanup(); resolve(file); return; }

        // Scale down
        if (w > maxWidth || h > maxHeight) {
          const ratio = Math.min(maxWidth / w, maxHeight / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        // Ensure even dimensions (required by many codecs)
        w = w % 2 === 0 ? w : w - 1;
        h = h % 2 === 0 ? h : h - 1;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { cleanup(); resolve(file); return; }

        // Pick best supported mime
        const preferredTypes = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
          'video/mp4',
        ];
        const mimeType = preferredTypes.find(t => {
          try { return MediaRecorder.isTypeSupported(t); } catch { return false; }
        });
        if (!mimeType) { cleanup(); resolve(file); return; }

        // Capture stream from canvas
        const stream = canvas.captureStream(24); // 24 fps

        // Try to get audio track from the video
        try {
          // Use AudioContext to extract audio
          if (typeof AudioContext !== 'undefined') {
            const audioCtx = new AudioContext();
            const source = audioCtx.createMediaElementSource(video);
            const dest = audioCtx.createMediaStreamDestination();
            source.connect(dest);
            source.connect(audioCtx.destination); // keep audio playing
            dest.stream.getAudioTracks().forEach(t => stream.addTrack(t));
          }
        } catch {
          // No audio - that's fine
        }

        const chunks: Blob[] = [];
        const recorder = new MediaRecorder(stream, {
          mimeType,
          videoBitsPerSecond: videoBitrate,
        });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.onstop = () => {
          cleanup();
          const compressed = new Blob(chunks, { type: mimeType });
          // Only use compressed if it's actually smaller
          if (compressed.size < file.size * 0.9) {
            resolve(compressed);
          } else {
            resolve(file);
          }
        };

        recorder.onerror = () => { cleanup(); resolve(file); };

        // Play video and draw frames to canvas
        video.currentTime = 0;
        await video.play();
        recorder.start();

        const drawFrame = () => {
          if (video.ended || video.paused) {
            recorder.stop();
            return;
          }
          ctx.drawImage(video, 0, 0, w, h);
          requestAnimationFrame(drawFrame);
        };
        requestAnimationFrame(drawFrame);

        video.onended = () => {
          if (recorder.state !== 'inactive') recorder.stop();
        };
      } catch {
        cleanup();
        resolve(file);
      }
    };

    video.onerror = () => { cleanup(); resolve(file); };
    video.src = URL.createObjectURL(file);
  });
}
