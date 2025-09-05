const API_BASE = 'http://localhost:5000';

export async function listRecordings() {
  const res = await fetch(`${API_BASE}/api/recordings`);
  if (!res.ok) throw new Error('Failed to fetch recordings');
  return res.json();
}

export async function uploadRecording(blob, filename = 'recording.webm') {
  const form = new FormData();
  form.append('video', blob, filename);
  const res = await fetch(`${API_BASE}/api/recordings`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export function playbackUrl(id) {
  return `${API_BASE}/api/recordings/${id}`;
}