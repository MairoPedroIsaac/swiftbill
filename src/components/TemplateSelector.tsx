'use client';

import React, { useState } from 'react';
import { Download, Save } from 'lucide-react';
import { InvoiceState } from '@/types/invoice';
import { generatePDF } from '@/utils/pdfGenerator';
import styles from './TemplateSelector.module.css';

interface Props {
  state: InvoiceState;
  onInvoiceSaved?: (invoice: any, isDownload: boolean) => void;
}

export default function TemplateSelector({ state, onInvoiceSaved }: Props) {
  const [template, setTemplate] = useState<'minimal' | 'modern' | 'classic'>('minimal');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // 1. Generate & download the PDF invoice
      await generatePDF(state, template);

      // 2. Save invoice to database (if authenticated)
      try {
        const method = state.id ? 'PUT' : 'POST';
        const res = await fetch('/api/invoices', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...state, template }),
        });
        if (res.ok && onInvoiceSaved) {
          const data = await res.json();
          onInvoiceSaved(data, true);
        } else if (!res.ok) {
          const errText = await res.text();
          console.error('Server error on download&save:', res.status, errText);
          alert(`Failed to save invoice. Status: ${res.status}. Error: ${errText}`);
        }
      } catch (saveErr) {
        console.log('Guest invoice generated (not saved to database)');
      }
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert('There was an error generating the PDF.');
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
        body: JSON.stringify({ ...state, template }),
      });
      if (res.ok && onInvoiceSaved) {
        const data = await res.json();
        onInvoiceSaved(data, false);
      } else if (!res.ok) {
        const errText = await res.text();
        console.error('Server returned error:', res.status, errText);
        alert(`Failed to save invoice to database. Status: ${res.status}. Error: ${errText}`);
      }
    } catch (saveErr) {
      console.error('Save error', saveErr);
      alert('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={`glass-panel ${styles.container}`}>
      <h3 className={styles.heading}>Select Template</h3>
      
      <div className={styles.options}>
        <label className={`${styles.option} ${template === 'minimal' ? styles.selected : ''}`}>
          <input 
            type="radio" 
            name="template" 
            value="minimal"
            checked={template === 'minimal'}
            onChange={() => setTemplate('minimal')}
            className={styles.radio}
          />
          <div className={styles.info}>
            <span className={styles.name}>Minimal</span>
            <span className={styles.desc}>Clean, lots of whitespace.</span>
          </div>
        </label>

        <label className={`${styles.option} ${template === 'modern' ? styles.selected : ''}`}>
          <input 
            type="radio" 
            name="template" 
            value="modern"
            checked={template === 'modern'}
            onChange={() => setTemplate('modern')}
            className={styles.radio}
          />
          <div className={styles.info}>
            <span className={styles.name}>Modern</span>
            <span className={styles.desc}>Sleek with color accents.</span>
          </div>
        </label>

        <label className={`${styles.option} ${template === 'classic' ? styles.selected : ''}`}>
          <input 
            type="radio" 
            name="template" 
            value="classic"
            checked={template === 'classic'}
            onChange={() => setTemplate('classic')}
            className={styles.radio}
          />
          <div className={styles.info}>
            <span className={styles.name}>Classic</span>
            <span className={styles.desc}>Traditional business look.</span>
          </div>
        </label>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button 
          className={styles.saveBtn} 
          onClick={handleSaveOnly}
          disabled={isDownloading || isSaving}
        >
          {isSaving ? (
            <>
              <Save size={18} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              Save Changes
            </>
          )}
        </button>

        <button 
          className={styles.downloadBtn} 
          onClick={handleDownload}
          disabled={isDownloading || isSaving}
        >
          {isDownloading ? (
            <>
              <Download size={18} className="animate-bounce" />
              Generating...
            </>
          ) : (
            <>
              <Download size={18} />
              Download PDF & Save
            </>
          )}
        </button>
      </div>
    </div>
  );
}
