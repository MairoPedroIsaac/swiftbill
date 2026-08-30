'use client';

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { InvoiceState } from '@/types/invoice';
import { generatePDF } from '@/utils/pdfGenerator';
import styles from './TemplateSelector.module.css';

interface Props {
  state: InvoiceState;
}

export default function TemplateSelector({ state }: Props) {
  const [template, setTemplate] = useState<'minimal' | 'modern' | 'classic'>('minimal');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await generatePDF(state, template);
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert('There was an error generating the PDF.');
    } finally {
      setIsGenerating(false);
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

      <button 
        className={styles.downloadBtn} 
        onClick={handleDownload}
        disabled={isGenerating}
      >
        <Download size={18} />
        {isGenerating ? 'Generating...' : 'Download PDF'}
      </button>
    </div>
  );
}
