'use client';

import React from 'react';
import { InvoiceState, CURRENCIES } from '@/types/invoice';
import styles from './InvoiceForm.module.css';

interface Props {
  state: InvoiceState;
  updateState: (field: keyof InvoiceState, value: any) => void;
}

export default function InvoiceForm({ state, updateState }: Props) {
  return (
    <div className={styles.formContainer}>
      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label>Your Business Name</label>
          <input 
            type="text" 
            placeholder="e.g. Acme Corp" 
            value={state.senderName}
            onChange={(e) => updateState('senderName', e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>Client's Name</label>
          <input 
            type="text" 
            placeholder="e.g. Global Industries" 
            value={state.clientName}
            onChange={(e) => updateState('clientName', e.target.value)}
          />
        </div>
      </div>
      
      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label>Your Address</label>
          <textarea 
            rows={3}
            placeholder="123 Business Rd..." 
            value={state.senderAddress}
            onChange={(e) => updateState('senderAddress', e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>Client's Address</label>
          <textarea 
            rows={3}
            placeholder="456 Client St..." 
            value={state.clientAddress}
            onChange={(e) => updateState('clientAddress', e.target.value)}
          />
        </div>
      </div>

      <div className={styles.row3}>
        <div className={styles.fieldGroup}>
          <label>Invoice Number</label>
          <input 
            type="text" 
            value={state.invoiceNumber}
            onChange={(e) => updateState('invoiceNumber', e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>Date</label>
          <input 
            type="date" 
            value={state.date}
            onChange={(e) => updateState('date', e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>Due Date</label>
          <input 
            type="date" 
            value={state.dueDate}
            onChange={(e) => updateState('dueDate', e.target.value)}
          />
        </div>
      </div>

      <div className={styles.row}>
        <div className={styles.fieldGroup}>
          <label>Currency</label>
          <select 
            value={state.currency}
            onChange={(e) => updateState('currency', e.target.value)}
          >
            {CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol}) - {c.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.fieldGroup}>
          <label>Tax Rate (%)</label>
          <input 
            type="number" 
            min="0"
            max="100"
            step="0.01"
            value={state.taxRate}
            onChange={(e) => updateState('taxRate', parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
}
