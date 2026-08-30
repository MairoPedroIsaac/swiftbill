'use client';

import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styles from './InvoiceGenerator.module.css';
import { InvoiceState, LineItem } from '@/types/invoice';
import InvoiceForm from './InvoiceForm';
import LineItems from './LineItems';
import TemplateSelector from './TemplateSelector';

const initialState: InvoiceState = {
  senderName: '',
  senderAddress: '',
  clientName: '',
  clientAddress: '',
  invoiceNumber: 'INV-001',
  date: new Date().toISOString().split('T')[0],
  dueDate: '',
  currency: 'USD',
  taxRate: 0,
  notes: '',
  terms: 'Please pay within 14 days of receiving this invoice.',
  items: [{ id: uuidv4(), description: '', quantity: 1, rate: 0 }]
};

export default function InvoiceGenerator() {
  const [state, setState] = useState<InvoiceState>(initialState);

  const updateState = (field: keyof InvoiceState, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  return (
    <section id="invoice-generator-tool" className={styles.container}>
      <div className={`glass-panel ${styles.wrapper}`}>
        <div className={styles.grid}>
          <div className={styles.mainColumn}>
            <h2 className={styles.heading}>Invoice Details</h2>
            <InvoiceForm state={state} updateState={updateState} />
            <div className={styles.divider} />
            <LineItems state={state} updateState={updateState} />
          </div>
          <div className={styles.sidebar}>
            <TemplateSelector state={state} />
          </div>
        </div>
      </div>
    </section>
  );
}
