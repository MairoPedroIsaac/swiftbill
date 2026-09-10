'use client';

import React from 'react';
import { InvoiceState, CURRENCIES } from '@/types/invoice';
import styles from './InvoiceForm.module.css';

import NumericInput from './NumericInput';

interface Props {
  state: InvoiceState;
  updateState: (field: keyof InvoiceState, value: any) => void;
  customers?: any[];
}

export default function InvoiceForm({ state, updateState, customers = [] }: Props) {
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
            list="customers-list"
            onChange={(e) => {
              const val = e.target.value;
              updateState('clientName', val);
              
              const match = customers.find(c => c.name.toLowerCase() === val.toLowerCase());
              if (match && match.address && !state.clientAddress) {
                updateState('clientAddress', match.address);
              }
            }}
          />
          <datalist id="customers-list">
            {customers.map((c: any) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
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
          <label>Invoice Number (Auto-Generated)</label>
          <input 
            type="text" 
            value={state.invoiceNumber || "Auto-Generated (e.g. INV-001)"}
            readOnly
            style={{ opacity: 0.75, cursor: "not-allowed", backgroundColor: "rgba(0, 0, 0, 0.03)" }}
            title="Invoice numbers are automatically incremented to prevent duplicate collisions"
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
          <NumericInput 
            placeholder="0.00"
            value={state.taxRate}
            onChange={(val) => updateState('taxRate', val)}
          />
        </div>
      </div>
    </div>
  );
}
