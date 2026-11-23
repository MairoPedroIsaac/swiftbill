'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, Save, ArrowRight, Loader2, Check } from 'lucide-react';
import { InvoiceState } from '@/types/invoice';
import { generatePDF } from '@/utils/pdfGenerator';
import styles from './TemplateSelector.module.css';
import toast from 'react-hot-toast';

interface Props {
  state: InvoiceState;
  /** False on the public homepage: the PDF downloads, nothing is sent to the server. */
  canSave?: boolean;
  onInvoiceSaved?: (invoice: any, isDownload: boolean) => void;
}

const TEMPLATES = [
  { id: 'minimal', name: 'Minimal', desc: 'Clean and quiet. Lets your logo lead.' },
  { id: 'modern', name: 'Modern', desc: 'Bold navy header with a blue total.' },
  { id: 'classic', name: 'Classic', desc: 'Formal serif layout for traditional clients.' },
] as const;

export default function TemplateSelector({ state, onInvoiceSaved, canSave = true }: Props) {
  const [template, setTemplate] = useState<'minimal' | 'modern' | 'classic'>('minimal');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [justDownloaded, setJustDownloaded] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    const started = Date.now();
    try {
      // Let the spinner paint before the PDF work starts
      await new Promise((r) => setTimeout(r, 30));
      // 1. Generate & download the PDF invoice
      await generatePDF(state, template);
      // Keep the loading state up long enough to be seen
      const left = 700 - (Date.now() - started);
      if (left > 0) await new Promise((r) => setTimeout(r, left));
      // Confirm on the button itself, so nothing pops over the page
      setJustDownloaded(true);
      setTimeout(() => setJustDownloaded(false), 2200);

      // 2. Signed-in users: also save the invoice to their account
      if (canSave) {
        try {
          const method = state.id ? 'PUT' : 'POST';
          const res = await fetch('/api/invoices', {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...state, logo: undefined, template }),
          });
          if (res.ok && onInvoiceSaved) {
            const data = await res.json();
            onInvoiceSaved(data, true);
          } else if (!res.ok && res.status !== 401) {
            const errText = await res.text();
            toast.error(`The PDF downloaded, but saving failed (${res.status}). ${errText}`);
          }
        } catch {
          toast.error('The PDF downloaded, but we could not reach the server to save it.');
        }
      }
    } catch (error) {
      console.error('Failed to generate PDF', error);
      toast.error('There was an error generating the PDF.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveOnly = async () => {
    setIsSaving(true);
    try {
      const method = state.id ? 'PUT' : 'POST';
      const res = await fetch('/api/invoices', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...state, logo: undefined, template }),
      });
      if (res.ok && onInvoiceSaved) {
        const data = await res.json();
        onInvoiceSaved(data, false);
        toast.success('Invoice saved successfully!');
      } else if (!res.ok) {
        const errText = await res.text();
        if (res.status === 401) {
          toast.error('Sign in to save invoices online.');
        } else {
          toast.error(`Failed to save invoice to database. Status: ${res.status}. Error: ${errText}`);
        }
      }
    } catch (saveErr) {
      console.error('Save error', saveErr);
      toast.error('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`glass-panel ${styles.container}`}>
      <h3 className={styles.heading}>Select Template</h3>
      
      <div className={styles.options}>
        {TEMPLATES.map((t) => (
          <label key={t.id} className={`${styles.option} ${template === t.id ? styles.selected : ''}`}>
            <input
              type="radio"
              name="template"
              value={t.id}
              checked={template === t.id}
              onChange={() => setTemplate(t.id)}
              className={styles.radio}
            />
            <div className={styles.info}>
              <span className={styles.name}>{t.name}</span>
              <span className={styles.desc}>{t.desc}</span>
            </div>
          </label>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        {canSave && (
        <button 
          className={styles.saveBtn} 
          onClick={handleSaveOnly}
          disabled={isDownloading || isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>
        )}

        <button 
          className={`${styles.downloadBtn} ${justDownloaded ? styles.done : ''}`}
          onClick={handleDownload}
          disabled={isDownloading || isSaving}
          aria-busy={isDownloading}
        >
          {isDownloading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Preparing PDF...
            </>
          ) : justDownloaded ? (
            <>
              <Check size={18} />
              PDF downloaded
            </>
          ) : (
            <>
              <Download size={18} />
              Download PDF
            </>
          )}
        </button>

        {!canSave && (
          <p className={styles.guestNote}>
            Want to keep your clients and invoices?{' '}
            <Link href="/auth/signup">
              Create a free account <ArrowRight size={13} />
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
