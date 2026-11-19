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

const STATUS_OPTIONS = ["DRAFT", "SENT", "PAID"] as const;

function formatMoney(amount: number, currency?: string | null) {
  const code = (currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

function formatDate(value: string) {
  if (!value) return "";
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

function InvoiceList({
  invoices,
  onEdit,
  onStatusChange,
}: {
  invoices: InvoiceItem[];
  onEdit: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className={styles.invoiceList}>
      <div className={styles.invoiceHead} aria-hidden="true">
        <span>Invoice</span>
        <span>Client</span>
        <span>Date</span>
        <span>Status</span>
        <span className={styles.alignRight}>Amount</span>
      </div>
      <ul className={styles.invoiceRows}>
        {invoices.map((inv) => (
          <li key={inv.id} className={styles.invoiceRow}>
            <button
              type="button"
              onClick={() => onEdit(inv.id)}
              className={styles.invoiceNumber}
              title="Open this invoice"
            >
              {inv.invoiceNumber}
            </button>
            <span className={styles.invoiceClient}>{inv.clientName}</span>
            <span className={styles.invoiceDate}>{formatDate(inv.date)}</span>
            <span className={styles.invoiceStatus}>
              <select
                value={inv.status}
                onChange={(e) => onStatusChange(inv.id, e.target.value)}
                className={`${styles.statusSelect} ${styles[`status${inv.status}`] || ""}`}
                aria-label={`Status for ${inv.invoiceNumber}`}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </span>
            <span className={`${styles.invoiceAmount} tabular`}>
              {formatMoney(inv.amount, inv.currency)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
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

      setSuccessMsg("Business settings saved.");
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
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
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

            {/* 3. Invoice Builder - Only show when active to indicate current view */}
            {activeTab === "builder" && (
              <button
                className={`${styles.navItem} ${styles.activeNavItem}`}
              >
                <Plus size={18} />
                Invoice Builder
              </button>
            )}

            {/* 4. Account & Security */}
            <button
              onClick={() => handleSelectTab("account")}
              className={`${styles.navItem} ${activeTab === "account" ? styles.activeNavItem : ""}`}
            >
              <ShieldCheck size={18} />
              Account & Security
            </button>

            {/* 5. Settings */}
            <button
              onClick={() => handleSelectTab("settings")}
              className={`${styles.navItem} ${activeTab === "settings" ? styles.activeNavItem : ""}`}
            >
              <Settings size={18} />
              Settings
            </button>

            {/* 6. + New Invoice - Hide when already in builder to avoid redundancy */}
            {activeTab !== "builder" && (
              <button
                onClick={() => handleSelectTab("builder")}
                className={styles.btnNewInvoiceSidebar}
              >
                <Plus size={18} />
                New Invoice
              </button>
            )}
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
        <div className={styles.mainInner}>
        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <>
            <div className={styles.pageHeader}>
              <h1 className={styles.pageTitle}>Overview</h1>
              <p className={styles.pageSubtitle}>
                {stats.totalInvoices === 0
                  ? `Welcome, ${displayName}. Create your first invoice to get started.`
                  : `Welcome back, ${displayName}. Here is where your invoices stand.`}
              </p>
            </div>

            {/* Real-time Metric Cards */}
            <div className={styles.statsGrid}>
              <div className={`glass-panel ${styles.statCard}`}>
                <div className={styles.statIcon}>
                  <FileText size={20} />
                </div>
                <div>
                  <div className={`${styles.statValue} tabular`}>{stats.totalInvoices}</div>
                  <div className={styles.statLabel}>Invoices</div>
                </div>
              </div>

              <div className={`glass-panel ${styles.statCard}`}>
                <div className={`${styles.statIcon} ${styles.statIconGreen}`}>
                  <CheckCircle2 size={20} />
                </div>
                <div>
                  <div className={`${styles.statValue} tabular`}>
                    {formatMoney(stats.paidAmount, defaultCurrency)}
                  </div>
                  <div className={styles.statLabel}>Paid</div>
                </div>
              </div>

              <div className={`glass-panel ${styles.statCard}`}>
                <div className={`${styles.statIcon} ${styles.statIconAmber}`}>
                  <Clock size={20} />
                </div>
                <div>
                  <div className={`${styles.statValue} tabular`}>{stats.pendingDrafts}</div>
                  <div className={styles.statLabel}>Drafts</div>
                </div>
              </div>

              <div className={`glass-panel ${styles.statCard}`}>
                <div className={`${styles.statIcon} ${styles.statIconViolet}`}>
                  <DollarSign size={20} />
                </div>
                <div>
                  <div className={`${styles.statValue} tabular`}>
                    {formatMoney(stats.totalDraftAmount, defaultCurrency)}
                  </div>
                  <div className={styles.statLabel}>Unpaid drafts</div>
                </div>
              </div>
            </div>

            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Invoices</h2>
              <button
                onClick={() => handleSelectTab("builder")}
                className={styles.btnPrimary}
              >
                <Plus size={16} />
                New invoice
              </button>
            </div>

            {invoices.length > 0 ? (
              <div className={`glass-panel ${styles.listCard}`}>
                <InvoiceList
                  invoices={invoices.slice(0, 5)}
                  onEdit={handleEditInvoice}
                  onStatusChange={handleStatusChange}
                />
                {invoices.length > 5 && (
                  <div className={styles.listFooter}>
                    <button onClick={() => handleSelectTab("invoices")} className={styles.btnGhost}>
                      View all invoices
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={`glass-panel ${styles.listCard}`}>
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>
                    <FileText size={32} />
                  </div>
                  <h3 className={styles.emptyTitle}>No invoices yet</h3>
                  <p>Create one and it will show up here.</p>
                  <button
                    onClick={() => handleSelectTab("builder")}
                    className={styles.btnPrimary}
                  >
                    <Plus size={18} />
                    Create invoice
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
              Tap an invoice number to open it, or change its status right here.
            </p>
            
            <div className={`glass-panel ${styles.listCard}`}>
              {invoices.length > 0 ? (
                <InvoiceList
                  invoices={invoices}
                  onEdit={handleEditInvoice}
                  onStatusChange={handleStatusChange}
                />
              ) : (
                <div className={styles.emptyState}>
                  <p>No invoices yet. Your saved invoices will show up here.</p>
                </div>
              )}

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={styles.btnGhost}
                  >
                    Previous
                  </button>
                  <span className={styles.paginationLabel}>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={styles.btnGhost}
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
            <h1 className={styles.pageTitle}>{editingInvoice ? `Edit ${editingInvoice.invoiceNumber}` : 'New invoice'}</h1>
            <p className={styles.pageSubtitle}>
              Fill in the details, then save or download the PDF. Downloads are saved to your account too.
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
            <h1 className={styles.pageTitle}>
              Account & Security
            </h1>
            <p className={styles.pageSubtitle}>
              Your photo, display name and password.
            </p>

            {successMsg && <div className={styles.alertSuccess}>{successMsg}</div>}
            {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}

            <form onSubmit={handleSaveProfile}>
              <div className={styles.avatarSection}>
                {avatar ? (
                  <img src={avatar} alt="Profile Avatar" className={styles.largeAvatar} />
                ) : (
                  <div className={styles.largeAvatar}>{avatarChar}</div>
                )}

                <div className={styles.avatarActions}>
                  <label className={styles.fileInputLabel}>
                    <Upload size={16} />
                    Upload photo
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
                  <span className={styles.hint}>
                    JPG, PNG or WEBP, up to 4MB.
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
                  className={styles.inputDisabled}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`${styles.btnPrimary} ${styles.btnSubmit}`}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Save Profile
              </button>
            </form>

            <div className={styles.divider} />

            <form onSubmit={handleUpdatePassword}>
              <h3 className={styles.subTitle}>
                <Lock size={18} />
                Change password
              </h3>

              {passwordSuccessMsg && <div className={styles.alertSuccess}>{passwordSuccessMsg}</div>}
              {passwordErrorMsg && <div className={styles.alertError}>{passwordErrorMsg}</div>}

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
                className={`${styles.btnPrimary} ${styles.btnSubmit}`}
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
            <h1 className={styles.pageTitle}>
              Business settings
            </h1>
            <p className={styles.pageSubtitle}>
              These details fill in every new invoice automatically.
            </p>

            {successMsg && <div className={styles.alertSuccess}>{successMsg}</div>}
            {errorMsg && <div className={styles.alertError}>{errorMsg}</div>}

            <form onSubmit={handleSaveBusinessSettings}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>
                  <Building size={16} />
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
                  <MapPin size={16} />
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
                  <Mail size={16} />
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
                  <Phone size={16} />
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
                  <Globe size={16} />
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
                  <FileText size={16} />
                  Custom Invoice Prefix
                </label>
                <input
                  type="text"
                  value={invoicePrefix}
                  onChange={(e) => setInvoicePrefix(e.target.value)}
                  placeholder="e.g. INV-, BILL-, FAC-"
                  required
                />
                <span className={styles.hint}>
                  New invoices will look like {invoicePrefix || "INV-"}001. Numbering keeps counting up and never resets.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`${styles.btnPrimary} ${styles.btnSubmit}`}
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Settings size={18} />}
                Save Business Settings
              </button>
            </form>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
