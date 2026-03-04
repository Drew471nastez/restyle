'use client';

import { useState } from 'react';

const MAX_MB = 5;

export default function Home() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [uploaded, setUploaded] = useState('');
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const onFileChange = (event) => {
    const selected = event.target.files?.[0];
    setUploaded('');
    setMessage('');

    if (!selected) {
      setFile(null);
      setPreview('');
      return;
    }

    if (!selected.type.startsWith('image/')) {
      setFile(null);
      setPreview('');
      setMessage('Please choose an image file only.');
      return;
    }

    if (selected.size > MAX_MB * 1024 * 1024) {
      setFile(null);
      setPreview('');
      setMessage(`Image must be ${MAX_MB}MB or smaller.`);
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setMessage('Select a product image before uploading.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    setMessage('');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        setUploaded('');
        setMessage(data.error || 'Upload failed. Try again.');
        return;
      }

      setUploaded(data.previewDataUrl || '');
      setMessage('Product image uploaded successfully.');
    } catch {
      setUploaded('');
      setMessage('Upload failed due to a network/server error.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main style={{ maxWidth: 640, margin: '2rem auto', fontFamily: 'Arial, sans-serif' }}>
      <h1>Restyle Product Upload</h1>
      <p>Upload a product photo to verify the image upload flow is working.</p>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '1rem' }}>
        <input
          aria-label="Upload product image"
          accept="image/*"
          type="file"
          onChange={onFileChange}
        />
        <button type="submit" disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Upload product image'}
        </button>
      </form>

      {message && <p>{message}</p>}

      {(preview || uploaded) && (
        <section style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
          {preview && (
            <div>
              <h2>Selected preview</h2>
              <img src={preview} alt="Selected product" style={{ maxWidth: '100%' }} />
            </div>
          )}

          {uploaded && (
            <div>
              <h2>Server-processed preview</h2>
              <img src={uploaded} alt="Uploaded product" style={{ maxWidth: '100%' }} />
            </div>
          )}
        </section>
      )}
    </main>
  );
}
