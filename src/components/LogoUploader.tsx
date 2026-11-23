'use client';

import React, { useRef, useState } from 'react';
import { ImagePlus, Trash2, Loader2 } from 'lucide-react';
import { LOGO_ACCEPT, logoFileToDataUrl } from '@/utils/logo';
import styles from './LogoUploader.module.css';

interface Props {
  value?: string | null;
  onChange: (dataUrl: string | null) => void;
  label?: string;
  hint?: string;
}

// Shows the current logo on a checkerboard (so white and transparent logos stay visible)
// and lets people upload or remove it. The file is resized in the browser before it is stored.
export default function LogoUploader({
  value,
  onChange,
  label = 'Logo',
  hint = 'PNG with a transparent background looks best. JPG, WEBP and SVG work too.',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      onChange(await logoFileToDataUrl(file));
    } catch (err: any) {
      setError(err?.message || 'That logo could not be used.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <span className={styles.label}>{label}</span>
      <div className={styles.row}>
        <button
          type="button"
          className={styles.preview}
          onClick={() => inputRef.current?.click()}
          aria-label={value ? 'Change logo' : 'Upload logo'}
        >
          {busy ? (
            <Loader2 size={20} className="animate-spin" />
          ) : value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Your logo" />
          ) : (
            <ImagePlus size={22} />
          )}
        </button>
        <div className={styles.actions}>
          <div className={styles.buttons}>
            <button type="button" className={styles.upload} onClick={() => inputRef.current?.click()} disabled={busy}>
              {value ? 'Change logo' : 'Upload logo'}
            </button>
            {value && (
              <button type="button" className={styles.remove} onClick={() => onChange(null)} disabled={busy}>
                <Trash2 size={14} /> Remove
              </button>
            )}
          </div>
          <span className={error ? styles.error : styles.hint}>{error || hint}</span>
        </div>
      </div>
      <input ref={inputRef} type="file" accept={LOGO_ACCEPT} onChange={handleFile} hidden />
    </div>
  );
}
