'use client';

import React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Trash2 } from 'lucide-react';
import { InvoiceState, LineItem, CURRENCIES } from '@/types/invoice';
import styles from './LineItems.module.css';

interface Props {
  state: InvoiceState;
  updateState: (field: keyof InvoiceState, value: any) => void;
}

export default function LineItems({ state, updateState }: Props) {
  const currencySymbol = CURRENCIES.find(c => c.code === state.currency)?.symbol || '$';

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    const newItems = state.items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    updateState('items', newItems);
  };

  const addItem = () => {
    updateState('items', [...state.items, { id: uuidv4(), description: '', quantity: 1, rate: 0 }]);
  };

  const removeItem = (id: string) => {
    if (state.items.length === 1) return; // keep at least one
    updateState('items', state.items.filter(item => item.id !== id));
  };

  const subtotal = state.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const tax = subtotal * (state.taxRate / 100);
  const total = subtotal + tax;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.colDesc}>Description</div>
        <div className={styles.colQty}>Qty</div>
        <div className={styles.colRate}>Rate</div>
        <div className={styles.colAmount}>Amount</div>
        <div className={styles.colAction}></div>
      </div>

      <div className={styles.itemsList}>
        {state.items.map((item, index) => (
          <div key={item.id} className={styles.row}>
            <div className={styles.colDesc}>
              <input 
                type="text" 
                placeholder="Item description" 
                value={item.description}
                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
              />
            </div>
            <div className={styles.colQty}>
              <input 
                type="number" 
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
              />
            </div>
            <div className={styles.colRate}>
              <div className={styles.inputWithSymbol}>
                <span className={styles.symbol}>{currencySymbol}</span>
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  value={item.rate}
                  onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className={styles.colAmount}>
              {currencySymbol} {(item.quantity * item.rate).toFixed(2)}
            </div>
            <div className={styles.colAction}>
              <button 
                className={styles.deleteBtn} 
                onClick={() => removeItem(item.id)}
                disabled={state.items.length === 1}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className={styles.addBtn} onClick={addItem}>
        <Plus size={16} /> Add Item
      </button>

      <div className={styles.totalsContainer}>
        <div className={styles.totalsWrapper}>
          <div className={styles.totalsRow}>
            <span>Subtotal:</span>
            <span>{currencySymbol} {subtotal.toFixed(2)}</span>
          </div>
          {state.taxRate > 0 && (
            <div className={styles.totalsRow}>
              <span>Tax ({state.taxRate}%):</span>
              <span>{currencySymbol} {tax.toFixed(2)}</span>
            </div>
          )}
          <div className={`${styles.totalsRow} ${styles.grandTotal}`}>
            <span>Total:</span>
            <span>{currencySymbol} {total.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
      <div className={styles.footerInputs}>
        <div className={styles.fieldGroup}>
          <label>Notes</label>
          <textarea 
            rows={2}
            placeholder="Thank you for your business..." 
            value={state.notes}
            onChange={(e) => updateState('notes', e.target.value)}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label>Terms & Conditions</label>
          <textarea 
            rows={2}
            placeholder="Payment terms..." 
            value={state.terms}
            onChange={(e) => updateState('terms', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
