"use client";

import { useState, useEffect } from "react";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  ShieldCheck,
  Settings,
  Plus,
  LogOut,
  CheckCircle2,
  Clock,
  DollarSign,
  Upload,
  Trash2,
  Loader2,
  Lock,
  Menu,
  X,
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  CheckCircle,
  Save
} from "lucide-react";
import styles from "./Dashboard.module.css";
import InvoiceGenerator from "@/components/InvoiceGenerator";

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  clientName: string;
  date: string;
  status: string;
  currency: string;
  amount: number;
}

interface DashboardStats {
  totalInvoices: number;
  paidAmount: number;
  pendingDrafts: number;
  totalDraftAmount: number;
}

interface DashboardClientProps {
  user: {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    businessProfile?: {
      name?: string | null;
      address?: string | null;
      phone?: string | null;
      email?: string | null;
      defaultCurrency?: string | null;
      invoicePrefix?: string | null;
      lastInvoiceNumber?: number | null;
    } | null;
    createdAt?: string | Date;
  };
  initialStats?: DashboardStats;
  initialInvoices?: InvoiceItem[];
  initialPagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export default function DashboardClient({
  user,
  initialStats,
  initialInvoices,
  initialPagination,
}: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "invoices" | "builder" | "account" | "settings">("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  
  const [currentPage, setCurrentPage] = useState(initialPagination?.page || 1);
  const [totalPages, setTotalPages] = useState(initialPagination?.totalPages || 1);
  const itemsPerPage = initialPagination?.limit || 10;

  // Live Real-Time Dashboard Stats & Invoices
  const [stats, setStats] = useState<DashboardStats>(
    initialStats || {
      totalInvoices: 0,
      paidAmount: 0,
      pendingDrafts: 0,
      totalDraftAmount: 0,
    }
  );
  const [invoices, setInvoices] = useState<InvoiceItem[]>(initialInvoices || []);
  const [rawInvoices, setRawInvoices] = useState<any[]>([]);

  // User Profile States
  const [name, setName] = useState(user.name || "");
  const [avatar, setAvatar] = useState<string | null>(user.image || null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Business Profile States
  const [businessName, setBusinessName] = useState(user.businessProfile?.name || "My Business");
  const [businessAddress, setBusinessAddress] = useState(user.businessProfile?.address || "");
  const [businessPhone, setBusinessPhone] = useState(user.businessProfile?.phone || "");
  const [businessEmail, setBusinessEmail] = useState(user.businessProfile?.email || user.email || "");
  const [defaultCurrency, setDefaultCurrency] = useState(user.businessProfile?.defaultCurrency || "USD");
  const [invoicePrefix, setInvoicePrefix] = useState(user.businessProfile?.invoicePrefix || "INV-");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState("");
  const [passwordErrorMsg, setPasswordErrorMsg] = useState("");

  const displayName = name || user.email?.split("@")[0] || "User";
  const avatarChar = displayName.charAt(0).toUpperCase();

  // Refresh live statistics from API
  const refreshInvoicesAndStats = async (page = currentPage) => {
    try {
      const res = await fetch(`/api/invoices?page=${page}&limit=${itemsPerPage}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      if (data.stats) {
        setStats(data.stats);
      }
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setCurrentPage(data.pagination.page);
      }
      if (data.invoices) {
        setRawInvoices(data.invoices);
        const formatted = data.invoices.map((inv: any) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.customer?.name || "Client",
          date: inv.date ? new Date(inv.date).toISOString().split("T")[0] : "",
          status: inv.status,
          currency: inv.currency,
          amount:
            inv.lineItems.reduce((sum: number, item: any) => sum + item.quantity * item.rate, 0) *
            (1 + (inv.taxRate || 0) / 100),
        }));
        setInvoices(formatted);
      }
    } catch (err) {
      console.error("Failed to refresh stats", err);
    }
  };

  useEffect(() => {
    if (activeTab === "overview" || activeTab === "invoices") {
      refreshInvoicesAndStats(currentPage);
    }
  }, [currentPage]);

  const handleSelectTab = (tab: "overview" | "invoices" | "builder" | "account" | "settings") => {
    setActiveTab(tab);
    setMobileOpen(false);
    setSuccessMsg("");
    setErrorMsg("");
    if (tab === "overview" || tab === "invoices") {
      refreshInvoicesAndStats();
    }
    if (tab !== "builder") {
      setEditingInvoice(null);
    }
  };

  const handleEditInvoice = (id: string) => {
    const raw = rawInvoices.find(r => r.id === id);
    if (!raw) return;

    const editState = {
      id: raw.id,
      status: raw.status,
      senderName: businessName,
      senderAddress: businessAddress,
      clientName: raw.customer?.name || "",
      clientAddress: raw.customer?.address || "",
      invoiceNumber: raw.invoiceNumber,
      date: raw.date ? new Date(raw.date).toISOString().split("T")[0] : "",
      dueDate: raw.dueDate ? new Date(raw.dueDate).toISOString().split("T")[0] : "",
      currency: raw.currency || "USD",
      taxRate: raw.taxRate || 0,
      notes: raw.notes || "",
      terms: raw.terms || "",
      items: raw.lineItems.map((li: any) => ({
        id: li.id,
        description: li.description,
        quantity: li.quantity,
        rate: li.rate,
      }))
    };

    setEditingInvoice(editState);
    setActiveTab("builder");
  };

  // Update Invoice Status (DRAFT -> SENT -> PAID)
  const handleStatusChange = async (invoiceId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/invoices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId, status: newStatus }),
      });
      if (res.ok) {
        await refreshInvoicesAndStats();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update invoice status");
      }
    } catch (err) {
      console.error("Status update error", err);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "PAID":
        return { bg: "rgba(34, 197, 94, 0.15)", color: "#16a34a", border: "rgba(34, 197, 94, 0.3)" };
      case "SENT":
        return { bg: "rgba(59, 130, 246, 0.15)", color: "#2563eb", border: "rgba(59, 130, 246, 0.3)" };
      default:
        return { bg: "rgba(245, 158, 11, 0.15)", color: "#d97706", border: "rgba(245, 158, 11, 0.3)" };
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg("Image size must be less than 4MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Remove Avatar Handler
  const handleRemoveImage = async () => {
    setAvatar(null);
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeImage: true }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove image");

      setSuccessMsg("Profile image removed successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to remove image");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Save Account Profile Settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          image: avatar,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");

      setSuccessMsg("Account profile updated successfully!");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Password
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg("");
    setPasswordSuccessMsg("");

    if (!currentPassword) {
      setPasswordErrorMsg("Current password is required to set a new one");
      return;
    }

    if (!newPassword) {
      setPasswordErrorMsg("New password is required");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordErrorMsg("Password must be at least 8 characters long");
      return;
    }

    setIsSubmittingPassword(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      setPasswordSuccessMsg("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setPasswordErrorMsg(err.message || "An error occurred");
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Save Business Settings
  const handleSaveBusinessSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName,
          businessAddress,
          businessPhone,
          businessEmail,
          defaultCurrency,
          invoicePrefix,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update business profile");

      setSuccessMsg("Business settings updated! Invoice prefix updated while sequence counter continues seamlessly.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.dashboardLayout}>
      {/* Mobile Top Header */}
      <div className={styles.mobileHeader}>
        <div className={styles.brandHeader}>
          <div className={styles.brandIcon}>S</div>
          <span className={styles.brandText}>SwiftBill</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={styles.mobileMenuBtn}
          aria-label="Toggle Navigation Menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div className={styles.overlay} onClick={() => setMobileOpen(false)} />
      )}

      {/* SIDEBAR NAVIGATION */}
      <aside className={`${styles.sidebar} ${mobileOpen ? styles.sidebarOpen : ""}`}>
        <div className={styles.sidebarTop}>
          <div className={styles.brandHeader}>
            <div className={styles.brandIcon}>S</div>
            <span className={styles.brandText}>SwiftBill</span>
          </div>

          <nav className={styles.sidebarNav}>
            {/* 1. Overview */}
            <button
              onClick={() => handleSelectTab("overview")}
              className={`${styles.navItem} ${activeTab === "overview" ? styles.activeNavItem : ""}`}
            >
              <LayoutDashboard size={18} />
              Overview
            </button>

            {/* 2. Invoices List */}
            <button
              onClick={() => handleSelectTab("invoices")}
              className={`${styles.navItem} ${activeTab === "invoices" ? styles.activeNavItem : ""}`}
            >
              <FileText size={18} />
              All Invoices
            </button>

            {/* 3. Invoice Builder */}
            <button
              onClick={() => handleSelectTab("builder")}
              className={`${styles.navItem} ${activeTab === "builder" ? styles.activeNavItem : ""}`}
            >
              <Plus size={18} />
              Invoice Builder
            </button>

            {/* 4. Account & Security */}
            <button
              onClick={() => handleSelectTab("account")}
              className={`${styles.navItem} ${activeTab === "account" ? styles.activeNavItem : ""}`}
            >
              <ShieldCheck size={18} />
              Account & Security
            </button>

            {/* 4. Settings */}
            <button
              onClick={() => handleSelectTab("settings")}
              className={`${styles.navItem} ${activeTab === "settings" ? styles.activeNavItem : ""}`}
            >
              <Settings size={18} />
              Settings
            </button>

            {/* 5. + New Invoice */}
            <button
              onClick={() => handleSelectTab("builder")}
              className={styles.btnNewInvoiceSidebar}
            >
              <Plus size={18} />
              New Invoice
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userCard}>
            {avatar ? (
              <img src={avatar} alt={displayName} className={styles.avatar} />
            ) : (
              <div className={styles.avatar}>{avatarChar}</div>
            )}
            <div className={styles.userDetails}>
              <span className={styles.userName}>{displayName}</span>
              <span className={styles.userEmail}>{user.email}</span>
            </div>
          </div>

          {/* 6. Sign Out */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={styles.btnSignOut}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className={styles.mainContent}>
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Dashboard Overview</h1>
              <p className={styles.pageSubtitle}>
                {user.createdAt && Date.now() - new Date(user.createdAt).getTime() < 1000 * 60 * 60 
                  ? `Welcome, ${displayName}! Let's create your first invoice.` 
                  : `Welcome back, ${displayName}! Here is your real-time invoicing summary.`}
              </p>
            </div>

            {/* Real-time Metric Cards */}
            <div className={styles.statsGrid}>
              <div className={`glass-panel ${styles.statCard}`}>
                <div className={styles.statIcon}>
                  <FileText size={24} />
                </div>
                <div>
                  <div className={styles.statValue}>{stats.totalInvoices}</div>
                  <div className={styles.statLabel}>Total Invoices</div>
                </div>
              </div>

              <div className={`glass-panel ${styles.statCard}`}>
                <div className={styles.statIcon} style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e" }}>
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div className={styles.statValue}>
                    ${stats.paidAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={styles.statLabel}>Paid Invoices</div>
                </div>
              </div>

              <div className={`glass-panel ${styles.statCard}`}>
                <div className={styles.statIcon} style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
                  <Clock size={24} />
                </div>
                <div>
                  <div className={styles.statValue}>{stats.pendingDrafts}</div>
                  <div className={styles.statLabel}>Pending / Drafts</div>
                </div>
              </div>

              <div className={`glass-panel ${styles.statCard}`}>
                <div className={styles.statIcon} style={{ background: "rgba(168, 85, 247, 0.1)", color: "#a855f7" }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <div className={styles.statValue}>
                    ${stats.totalDraftAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className={styles.statLabel}>Total Draft Amount</div>
                </div>
              </div>
            </div>

            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Invoices</h2>
              <button
                onClick={() => handleSelectTab("builder")}
                className={styles.btnNewInvoiceSidebar}
                style={{ width: "auto", margin: 0, padding: "0.5rem 1rem" }}
              >
                <Plus size={16} />
                Create Invoice
              </button>
            </div>

            {invoices.length > 0 ? (
              <div className={`glass-panel ${styles.recentCard}`} style={{ textAlign: "left" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Invoice #</th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Client</th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Date</th>
                      <th style={{ padding: "0.75rem", textAlign: "left" }}>Status</th>
                      <th style={{ padding: "0.75rem", textAlign: "right" }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.slice(0, 5).map((inv) => {
                      const style = getStatusBadgeStyle(inv.status);
                      return (
                        <tr key={inv.id} style={{ borderBottom: "1px solid var(--border)", fontSize: "0.9rem" }}>
                          <td style={{ padding: "0.75rem", fontWeight: 600 }}>
                            <button onClick={() => handleEditInvoice(inv.id)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}>
                              {inv.invoiceNumber}
                            </button>
                          </td>
                          <td style={{ padding: "0.75rem" }}>{inv.clientName}</td>
                          <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{inv.date}</td>
                          <td style={{ padding: "0.75rem" }}>
                            <select
                              value={inv.status}
                              onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                              style={{
                                padding: "0.25rem 0.6rem",
                                borderRadius: "999px",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                                background: style.bg,
                                color: style.color,
                                border: `1px solid ${style.border}`,
                                cursor: "pointer",
                                outline: "none",
                              }}
                            >
                              <option value="DRAFT" style={{ background: "white", color: "#333" }}>DRAFT</option>
                              <option value="SENT" style={{ background: "white", color: "#333" }}>SENT</option>
                              <option value="PAID" style={{ background: "white", color: "#333" }}>PAID</option>
                            </select>
                          </td>
                          <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600 }}>
                            {inv.currency || "$"} {inv.amount.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {invoices.length > 5 && (
                  <div style={{ padding: "1rem", textAlign: "center", borderTop: "1px solid var(--border)" }}>
                    <button onClick={() => handleSelectTab("invoices")} className={styles.btnOutline} style={{ fontSize: "0.875rem", padding: "0.5rem 1rem", background: "none", border: "1px solid var(--border)", borderRadius: "6px", cursor: "pointer" }}>
                      View All Invoices
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={`glass-panel ${styles.recentCard}`}>
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <FileText size={32} />
                  </div>
                  <h3>Ready to create your next invoice?</h3>
                  <p>Generate professional client invoices right inside your SwiftBill workspace.</p>
                  <button
                    onClick={() => handleSelectTab("builder")}
                    className={styles.btnNewInvoiceSidebar}
                    style={{ width: "auto", marginTop: "0.5rem" }}
                  >
                    <Plus size={18} />
                    Create Invoice Now
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: ALL INVOICES */}
        {activeTab === "invoices" && (
          <div>
            <h1 className={styles.pageTitle}>All Invoices</h1>
            <p className={styles.pageSubtitle}>
              View and manage all your saved invoices. Click an invoice number to edit it.
            </p>
            
            <div className={`glass-panel ${styles.recentCard}`} style={{ textAlign: "left", marginTop: "1.5rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", color: "var(--text-muted)", fontSize: "0.875rem" }}>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Invoice #</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Client</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Date</th>
                    <th style={{ padding: "0.75rem", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "0.75rem", textAlign: "right" }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const style = getStatusBadgeStyle(inv.status);
                    return (
                      <tr key={inv.id} style={{ borderBottom: "1px solid var(--border)", fontSize: "0.9rem" }}>
                        <td style={{ padding: "0.75rem", fontWeight: 600 }}>
                          <button onClick={() => handleEditInvoice(inv.id)} style={{ color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: 0, textDecoration: 'underline' }}>
                            {inv.invoiceNumber}
                          </button>
                        </td>
                        <td style={{ padding: "0.75rem" }}>{inv.clientName}</td>
                        <td style={{ padding: "0.75rem", color: "var(--text-muted)" }}>{inv.date}</td>
                        <td style={{ padding: "0.75rem" }}>
                          <select
                            value={inv.status}
                            onChange={(e) => handleStatusChange(inv.id, e.target.value)}
                            style={{
                              padding: "0.25rem 0.6rem",
                              borderRadius: "999px",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              background: style.bg,
                              color: style.color,
                              border: `1px solid ${style.border}`,
                              cursor: "pointer",
                              outline: "none",
                            }}
                          >
                            <option value="DRAFT" style={{ background: "white", color: "#333" }}>DRAFT</option>
                            <option value="SENT" style={{ background: "white", color: "#333" }}>SENT</option>
                            <option value="PAID" style={{ background: "white", color: "#333" }}>PAID</option>
                          </select>
                        </td>
                        <td style={{ padding: "0.75rem", textAlign: "right", fontWeight: 600 }}>
                          {inv.currency || "$"} {inv.amount.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: currentPage === 1 ? '#f1f5f9' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ padding: '0.5rem 1rem', borderRadius: '6px', border: '1px solid var(--border)', background: currentPage === totalPages ? '#f1f5f9' : 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: INVOICE BUILDER */}
        {activeTab === "builder" && (
          <div>
            <h1 className={styles.pageTitle}>{editingInvoice ? `Edit Invoice: ${editingInvoice.invoiceNumber}` : 'Invoice Builder'}</h1>
            <p className={styles.pageSubtitle}>
              Draft and download professional invoices instantly. Downloads auto-save to your account!
            </p>
            <InvoiceGenerator 
              key={editingInvoice ? editingInvoice.id : 'new'}
              editingInvoice={editingInvoice}
              onInvoiceSaved={(savedInvoice, isDownload) => {
                refreshInvoicesAndStats();
              }} 
              initialBusinessInfo={{
                name: businessName,
                address: businessAddress,
              }}
            />
          </div>
        )}

        {/* TAB 3: ACCOUNT & SECURITY */}
        {activeTab === "account" && (
          <div className={`glass-panel ${styles.settingsCard}`}>
            <h1 className={styles.pageTitle} style={{ marginBottom: "0.5rem" }}>
              Account & Security
            </h1>
            <p className={styles.pageSubtitle}>
              Manage your profile picture, display name, and password security.
            </p>

            {successMsg && <div className={styles.alertSuccess}>{successMsg}</div>}
            {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}

            <form onSubmit={handleSaveProfile} style={{ marginBottom: "2rem" }}>
              <div className={styles.avatarSection}>
                {avatar ? (
                  <img src={avatar} alt="Profile Avatar" className={styles.largeAvatar} />
                ) : (
                  <div className={styles.largeAvatar}>{avatarChar}</div>
                )}

                <div className={styles.avatarActions}>
                  <label className={styles.fileInputLabel}>
                    <Upload size={16} />
                    Upload Custom Image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className={styles.fileInput}
                    />
                  </label>
                  {avatar && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className={styles.btnDanger}
                      disabled={isSubmitting}
                    >
                      <Trash2 size={16} />
                      Remove Photo
                    </button>
                  )}
                  <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Allowed JPG, PNG or WEBP (max 4MB).
                  </span>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name (Optional)"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email Address</label>
                <input
                  type="email"
                  value={user.email || ""}
                  disabled
                  style={{ opacity: 0.7, cursor: "not-allowed" }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.btnNewInvoiceSidebar}
                style={{ width: "fit-content", marginTop: "1rem", padding: "0.625rem 1.5rem" }}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Profile
              </button>
            </form>

            <div className={styles.divider} />

            <form onSubmit={handleUpdatePassword}>
              <h3 className={styles.sectionTitle} style={{ fontSize: "1.1rem", marginBottom: "1rem" }}>
                <Lock size={18} style={{ display: "inline", marginRight: "0.5rem", verticalAlign: "text-bottom" }} />
                Reset / Change Password
              </h3>

              {passwordSuccessMsg && <div className={styles.alertSuccess} style={{ marginBottom: "1rem" }}>{passwordSuccessMsg}</div>}
              {passwordErrorMsg && <div className={styles.alertError} style={{ marginBottom: "1rem" }}>{passwordErrorMsg}</div>}

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="•••••••• (Leave blank if signed in with Google)"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  minLength={8}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingPassword}
                className={styles.btnNewInvoiceSidebar}
                style={{ width: "fit-content", marginTop: "1rem", padding: "0.625rem 1.5rem" }}
              >
                {isSubmittingPassword ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                Update Password
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: SETTINGS */}
        {activeTab === "settings" && (
          <div className={`glass-panel ${styles.settingsCard}`}>
            <h1 className={styles.pageTitle} style={{ marginBottom: "0.5rem" }}>
              Business & Invoice Settings
            </h1>
            <p className={styles.pageSubtitle}>
              Configure your default business info to auto-fill every new invoice.
            </p>

            {successMsg && <div className={styles.alertSuccess}>{successMsg}</div>}
            {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}

            <form onSubmit={handleSaveBusinessSettings}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Building size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                  Business / Company Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Acme Corporation"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <MapPin size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                  Business Address
                </label>
                <textarea
                  rows={3}
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder="123 Business Rd, Tech City, ST 12345"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Mail size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                  Billing Contact Email
                </label>
                <input
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder="billing@yourcompany.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Phone size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                  Business Phone
                </label>
                <input
                  type="tel"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Globe size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                  Default Invoice Currency
                </label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                  <option value="AUD">AUD ($) - Australian Dollar</option>
                  <option value="NGN">NGN (₦) - Nigerian Naira</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <FileText size={16} style={{ display: "inline", marginRight: "0.5rem" }} />
                  Custom Invoice Prefix
                </label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="e.g. INV-, BILL-, FAC-"
                  required
                />
                <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.25rem", display: "block" }}>
                  Changing prefix updates invoice labels (e.g. {invoicePrefix || "INV-"}001). The sequence counter keeps incrementing continuously without resetting.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={styles.btnNewInvoiceSidebar}
                style={{ width: "fit-content", marginTop: "1rem", padding: "0.625rem 1.5rem" }}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Settings size={18} />}
                Save Business Settings
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
