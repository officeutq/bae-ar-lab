export type SnapshotKind = 'source' | 'processed';

export type SnapshotExportResult =
  | { ok: true; filename: string }
  | { ok: false; reason: string };

type SnapshotExporter = {
  exportCanvasSnapshot: (canvas: HTMLCanvasElement | null, kind: SnapshotKind) => SnapshotExportResult;
  exportVideoSnapshot: (video: HTMLVideoElement | null, kind: SnapshotKind) => SnapshotExportResult;
  readCanvasSnapshotDataUrl: (canvas: HTMLCanvasElement | null) => string | null;
  readVideoSnapshotDataUrl: (video: HTMLVideoElement | null) => string | null;
};

const MIME_TYPE = 'image/png';

function pad2(value: number) {
  return String(value).padStart(2, '0');
}

function buildTimestamp(date: Date) {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hour = pad2(date.getHours());
  const minute = pad2(date.getMinutes());
  const second = pad2(date.getSeconds());
  return `${year}-${month}-${day}-${hour}${minute}${second}`;
}

function buildFilename(kind: SnapshotKind, now: Date) {
  return `bae-${kind}-${buildTimestamp(now)}.png`;
}

function triggerDownload(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}

function exportBlob(blob: Blob | null, filename: string): SnapshotExportResult {
  if (!blob) {
    return { ok: false, reason: 'Failed to encode PNG blob.' };
  }
  triggerDownload(blob, filename);
  return { ok: true, filename };
}

export function createSnapshotExporter(nowProvider: () => Date = () => new Date()): SnapshotExporter {
  const readCanvasSnapshotDataUrl = (canvas: HTMLCanvasElement | null): string | null => {
    if (!canvas || canvas.width <= 0 || canvas.height <= 0) {
      return null;
    }
    return canvas.toDataURL(MIME_TYPE);
  };

  return {
    exportCanvasSnapshot(canvas, kind) {
      if (!canvas) {
        return { ok: false, reason: 'Canvas is not ready.' };
      }
      if (canvas.width <= 0 || canvas.height <= 0) {
        return { ok: false, reason: 'Canvas has no drawable frame.' };
      }
      const filename = buildFilename(kind, nowProvider());
      const dataUrl = canvas.toDataURL(MIME_TYPE);
      const byteString = atob(dataUrl.split(',')[1] ?? '');
      const bytes = new Uint8Array(byteString.length);
      for (let index = 0; index < byteString.length; index += 1) {
        bytes[index] = byteString.charCodeAt(index);
      }
      return exportBlob(new Blob([bytes], { type: MIME_TYPE }), filename);
    },
    exportVideoSnapshot(video, kind) {
      if (!video) {
        return { ok: false, reason: 'Video is not ready.' };
      }
      if (video.videoWidth <= 0 || video.videoHeight <= 0) {
        return { ok: false, reason: 'Video frame is unavailable.' };
      }
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const context = tempCanvas.getContext('2d');
      if (!context) {
        return { ok: false, reason: '2D context is unavailable.' };
      }
      context.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      return this.exportCanvasSnapshot(tempCanvas, kind);
    },
    readCanvasSnapshotDataUrl,
    readVideoSnapshotDataUrl(video) {
      if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) {
        return null;
      }
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = video.videoWidth;
      tempCanvas.height = video.videoHeight;
      const context = tempCanvas.getContext('2d');
      if (!context) {
        return null;
      }
      context.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      return readCanvasSnapshotDataUrl(tempCanvas);
    },
  };
}
