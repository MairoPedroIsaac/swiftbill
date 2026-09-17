'use client';

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { RotateCcw, CheckCircle, Save } from 'lucide-react';
import styles from './InvoiceGenerator.module.css';
import { InvoiceState } from '@/types/invoice';
import InvoiceForm from './InvoiceForm';
import LineItems from './LineItems';
import TemplateSelector from './TemplateSelector';

const STORAGE_KEY = 'swiftbill_invoice_draft';

const getInitialState = (info?: { name: string; address: string }, editData?: InvoiceState): InvoiceState => {
  if (editData) return { ...editData };
  return {
    senderName: info?.name || '',
    senderAddress: info?.address || '',
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
};

interface InvoiceGeneratorProps {
  onInvoiceSaved?: (invoice: any, isDownload: boolean) => void;
  initialBusinessInfo?: { name: string; address: string };
  editingInvoice?: InvoiceState | null;
}

export default function InvoiceGenerator({ onInvoiceSaved, initialBusinessInfo, editingInvoice }: InvoiceGeneratorProps = {}) {
  const [state, setState] = useState<InvoiceState>(() => getInitialState(initialBusinessInfo, editingInvoice || undefined));
  const [isHydrated, setIsHydrated] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");

  const [customers, setCustomers] = useState<any[]>([]);
  const [catalogItems, setCatalogItems] = useState<any[]>([]);

  const fetchBusinessData = async () => {
    try {
      const res = await fetch('/api/business-data', { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
        setCatalogItems(data.items || []);
        
        // Auto-increment draft invoice number only if we aren't editing an existing one
        if (!editingInvoice && data.nextInvoiceNumber) {
          setState(prev => prev.invoiceNumber === 'INV-001' 
            ? { ...prev, invoiceNumber: data.nextInvoiceNumber } 
            : prev
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch business data', err);
    }
  };

  useEffect(() => {
    fetchBusinessData();
  }, []);

  const handleInvoiceSavedWrapper = (invoice: any, isDownload: boolean) => {
    fetchBusinessData();
    if (invoice && invoice.id && !state.id) {
      setState(prev => ({ ...prev, id: invoice.id }));
    }
    setSuccessMsg(isDownload ? "Invoice saved and PDF downloaded successfully!" : "Invoice saved successfully!");
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (onInvoiceSaved) onInvoiceSaved(invoice, isDownload);
  };

  // 1. Rehydrate form state from localStorage on initial client mount
  useEffect(() => {
    if (editingInvoice) {
      setIsHydrated(true);
      return;
    }
    
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items) && parsed.items.length > 0) {
          if ((!parsed.senderName || parsed.senderName === 'My Business') && initialBusinessInfo?.name) {
            parsed.senderName = initialBusinessInfo.name;
          }
          if (!parsed.senderAddress && initialBusinessInfo?.address) {
            parsed.senderAddress = initialBusinessInfo.address;
          }
          setState(parsed);
          setLastSavedTime('Restored');
        }
      }
    } catch (err) {
      console.error('Error restoring localStorage invoice draft:', err);
    }
    setIsHydrated(true);
  }, [editingInvoice]);

  // Sync draft with global business settings if they change
  useEffect(() => {
    if (!editingInvoice && initialBusinessInfo) {
      setState(prev => ({
        ...prev,
        senderName: initialBusinessInfo.name || prev.senderName,
        senderAddress: initialBusinessInfo.address || prev.senderAddress,
      }));
    }
  }, [initialBusinessInfo?.name, initialBusinessInfo?.address, editingInvoice]);

  // 2. Autosave state changes to localStorage (only if not editing an existing saved invoice)
  useEffect(() => {
    if (!isHydrated || editingInvoice) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setLastSavedTime('Autosaved');
    } catch (err) {
      console.error('Error autosaving invoice draft to localStorage:', err);
    }
  }, [state, isHydrated, editingInvoice]);

  // 3. beforeunload warning prompt if form has non-empty unsaved content
  useEffect(() => {
    const isDirty =
      state.senderName.trim() !== '' ||
      state.clientName.trim() !== '' ||
      state.senderAddress.trim() !== '' ||
      state.clientAddress.trim() !== '' ||
      state.notes.trim() !== '' ||
      state.items.some(item => item.description.trim() !== '' || item.rate > 0);

    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = ''; // Standard browser navigation warning prompt
      return '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state]);

  const updateState = (field: keyof InvoiceState, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
  };

  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear the invoice form? All entered details will be reset.')) {
      const freshState = getInitialState(initialBusinessInfo);
      setState(freshState);
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.error('Error clearing localStorage draft:', err);
      }
      setLastSavedTime(null);
    }
  };

  return (
    <section id="invoice-generator-tool" className={styles.container}>
      <div className={`glass-panel ${styles.wrapper}`}>
        <div className={styles.headerWrapper}>
          <h2 className={styles.heading}>Invoice Details</h2>
          <div className={styles.headerActions}>
            {lastSavedTime && (
              <span className={styles.autosaveBadge}>
                <CheckCircle size={14} style={{ color: '#22c55e' }} />
                {lastSavedTime}
              </span>
            )}
            <button 
              type="button" 
              onClick={handleClearForm} 
              className={styles.clearBtn}
              title="Reset all invoice fields"
            >
              <RotateCcw size={14} />
              Clear Form
            </button>
          </div>
        </div>

        {successMsg && (
          <div style={{
            backgroundColor: "rgba(34, 197, 94, 0.1)",
            color: "#16a34a",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}>
            <CheckCircle size={18} />
            {successMsg}
          </div>
        )}

        <div className={styles.grid}>
          <div className={styles.mainColumn} style={{ position: 'relative' }}>
            {state.status === 'PAID' && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(255,255,255,0.7)', zIndex: 10,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                backdropFilter: 'blur(2px)', borderRadius: '1rem'
              }}>
                <div style={{
                  background: 'white', padding: '1.5rem', borderRadius: '0.75rem',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center',
                  maxWidth: '80%', border: '1px solid #e2e8f0'
                }}>
                  <CheckCircle size={32} style={{ color: '#22c55e', margin: '0 auto 0.5rem' }} />
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0f172a', margin: '0 0 0.5rem 0' }}>Invoice is Paid</h3>
                  <p style={{ color: '#64748b', fontSize: '0.875rem', margin: 0 }}>
                    Financial details cannot be modified to preserve transaction records. 
                    Change status to Draft or Sent in the dashboard to enable editing.
                  </p>
                </div>
              </div>
            )}
            <InvoiceForm state={state} updateState={updateState} customers={customers} />
            <div className={styles.divider} />
            <LineItems state={state} updateState={updateState} catalogItems={catalogItems} />
          </div>
          <div className={styles.sidebar}>
            <TemplateSelector state={state} onInvoiceSaved={handleInvoiceSavedWrapper} />
          </div>
        </div>
      </div>
    </section>
  );
}
