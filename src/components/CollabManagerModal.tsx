'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  TrendingUp,
  Clock,
  Check,
  Search,
  FileSpreadsheet,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  Sparkles,
  ShieldCheck,
  BarChart3,
  ChevronRight,
  Receipt,
  FileText,
  Calendar,
  CreditCard,
} from 'lucide-react';
import {
  CollabItem,
  CollabType,
  DeliverableType,
  PaymentStatus,
  InvoiceStatus,
  WorkStatus,
  PaymentMode,
  GoogleSheetSyncConfig,
  CollabMonthSummary,
} from '@/lib/collab-types';
import {
  getSavedCollabs,
  saveCollabs,
  getSyncConfig,
  saveSyncConfig,
  getUniqueMonths,
  calculateMonthSummary,
  calculateAllMonthsSummary,
  formatMonthLabel,
  getMonthName,
} from '@/lib/collab-storage';

interface CollabManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLLAB_TYPES: CollabType[] = [
  'Fixed',
  'Bonus',
  'Performance',
  'Barter',
  'Retainer',
  'Other',
];

const DELIVERABLE_TYPES: DeliverableType[] = [
  'Single Post',
  'Carousel',
  'Repost',
  'Video / Reel',
  'Newsletter',
  'Bundle',
  'Other',
];

const PAYMENT_MODES: PaymentMode[] = [
  'UPI',
  'Bank Transfer',
  'Stripe',
  'PayPal',
  'Other',
];

const GOOGLE_SCRIPT_CODE = `function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    
    if (data.action === "sync_collabs" && Array.isArray(data.collabs)) {
      
      // ==========================================
      // 1. MONTHLY ANALYTICS SUMMARY SHEET
      // ==========================================
      var analyticsSheet = ss.getSheetByName("Monthly Analytics");
      if (!analyticsSheet) {
        analyticsSheet = ss.insertSheet("Monthly Analytics", 0);
      }
      analyticsSheet.clear();
      analyticsSheet.appendRow([
        "Month", "Collaborations", "Revenue", "Spend", "Profit", "Pending", "Avg Deal Size"
      ]);
      
      analyticsSheet.getRange("A1:G1")
        .setFontWeight("bold")
        .setBackground("#1E293B")
        .setFontColor("#FFFFFF")
        .setHorizontalAlignment("center");
      analyticsSheet.setFrozenRows(1);
      
      if (Array.isArray(data.monthlyAnalytics)) {
        var totalCollabs = 0;
        var totalRev = 0;
        var totalSpend = 0;
        var totalProfit = 0;
        var totalPending = 0;
        
        data.monthlyAnalytics.forEach(function(m) {
          analyticsSheet.appendRow([
            m.monthName,
            m.collaborations,
            m.revenue,
            m.spend,
            m.profit,
            m.pending,
            m.avgDealSize
          ]);
          totalCollabs += m.collaborations;
          totalRev += m.revenue;
          totalSpend += m.spend;
          totalProfit += m.profit;
          totalPending += m.pending;
        });
        
        // Grand Total Row
        analyticsSheet.appendRow([
          "TOTAL",
          totalCollabs,
          totalRev,
          totalSpend,
          totalProfit,
          totalPending,
          totalCollabs > 0 ? (totalRev / totalCollabs) : 0
        ]);
        
        var lastAnRow = analyticsSheet.getLastRow();
        if (lastAnRow > 1) {
          var totRange = analyticsSheet.getRange(lastAnRow, 1, 1, 7);
          totRange.setFontWeight("bold").setBackground("#FDE047").setFontColor("#1D1815");
        }
      }
      analyticsSheet.autoResizeColumns(1, 7);
      
      // ==========================================
      // 2. SEPARATE MONTH CRM SHEETS (July, August, September, etc.)
      // ==========================================
      var monthGroups = {};
      data.collabs.forEach(function(item) {
        var mKey = item.MonthKey || "General";
        if (!monthGroups[mKey]) monthGroups[mKey] = [];
        monthGroups[mKey].push(item);
      });
      
      var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

      Object.keys(monthGroups).sort().forEach(function(mKey) {
        var parts = mKey.split("-");
        var sheetTitle = mKey;
        if (parts.length === 2) {
          var mIndex = parseInt(parts[1], 10) - 1;
          if (mIndex >= 0 && mIndex < 12) {
            sheetTitle = monthNames[mIndex] + " CRM";
          }
        }
        
        var mSheet = ss.getSheetByName(sheetTitle);
        if (!mSheet) {
          mSheet = ss.insertSheet(sheetTitle);
        }
        
        mSheet.clear();
        mSheet.appendRow([
          "Brand", "Campaign", "Collaboration Type", "Deliverable Type", "Deliverable",
          "Posted Date", "Base Pay", "Bonus", "Total Amount", "Spend", "Net Profit",
          "Invoice Sent", "Payment Status", "Payment Date", "Status", "Content Link", "Notes"
        ]);
        
        mSheet.getRange("A1:Q1")
          .setFontWeight("bold")
          .setBackground("#1E293B")
          .setFontColor("#FFFFFF")
          .setHorizontalAlignment("center");
        mSheet.setFrozenRows(1);
        
        var items = monthGroups[mKey];
        items.forEach(function(c) {
          mSheet.appendRow([
            c.Brand,
            c.Campaign,
            c.CollaborationType,
            c.DeliverableType,
            c.Deliverable,
            c.PostedDate,
            c.BasePay,
            c.Bonus,
            c.TotalAmount,
            c.Spend,
            c.NetProfit,
            c.InvoiceSent,
            c.PaymentStatus,
            c.PaymentDate,
            c.Status,
            c.ContentLink,
            c.Notes
          ]);
        });
        
        for (var r = 2; r <= items.length + 1; r++) {
          mSheet.getRange(r, 1, 1, 17).setBackground(r % 2 === 0 ? "#EBF2FA" : "#FFFFFF");
        }
        mSheet.autoResizeColumns(1, 17);
      });

      // ==========================================
      // 3. PAYMENTS TRACKER SHEET
      // ==========================================
      var paySheet = ss.getSheetByName("Payments");
      if (!paySheet) {
        paySheet = ss.insertSheet("Payments");
      }
      paySheet.clear();
      paySheet.appendRow([
        "Brand", "Month", "Amount (INR)", "Payment Status", "Payment Date", "Invoice Sent", "Payment Mode", "Notes"
      ]);
      paySheet.getRange("A1:H1")
        .setFontWeight("bold")
        .setBackground("#0F766E")
        .setFontColor("#FFFFFF")
        .setHorizontalAlignment("center");
      paySheet.setFrozenRows(1);
      
      data.collabs.forEach(function(c) {
        paySheet.appendRow([
          c.Brand,
          c.MonthKey,
          c.TotalAmount,
          c.PaymentStatus,
          c.PaymentDate,
          c.InvoiceSent,
          c.PaymentMode || "-",
          c.Notes
        ]);
      });
      for (var p = 2; p <= data.collabs.length + 1; p++) {
        paySheet.getRange(p, 1, 1, 8).setBackground(p % 2 === 0 ? "#F0FDFA" : "#FFFFFF");
      }
      paySheet.autoResizeColumns(1, 8);

      // ==========================================
      // 4. BRAND DATABASE SHEET
      // ==========================================
      var brandMap = {};
      data.collabs.forEach(function(c) {
        var b = c.Brand || "Other";
        if (!brandMap[b]) {
          brandMap[b] = { count: 0, totalRev: 0, latestDate: c.PostedDate, status: c.PaymentStatus };
        }
        brandMap[b].count += 1;
        brandMap[b].totalRev += (c.TotalAmount || 0);
        if (c.PostedDate > brandMap[b].latestDate) brandMap[b].latestDate = c.PostedDate;
      });

      var brandSheet = ss.getSheetByName("Brand Database");
      if (!brandSheet) {
        brandSheet = ss.insertSheet("Brand Database");
      }
      brandSheet.clear();
      brandSheet.appendRow([
        "Brand Name", "Total Deals Done", "Lifetime Revenue (INR)", "Latest Deal Date"
      ]);
      brandSheet.getRange("A1:D1")
        .setFontWeight("bold")
        .setBackground("#4338CA")
        .setFontColor("#FFFFFF")
        .setHorizontalAlignment("center");
      brandSheet.setFrozenRows(1);

      var brandKeys = Object.keys(brandMap).sort();
      brandKeys.forEach(function(bName) {
        var bInfo = brandMap[bName];
        brandSheet.appendRow([
          bName,
          bInfo.count,
          bInfo.totalRev,
          bInfo.latestDate
        ]);
      });
      for (var b = 2; b <= brandKeys.length + 1; b++) {
        brandSheet.getRange(b, 1, 1, 4).setBackground(b % 2 === 0 ? "#EEF2FF" : "#FFFFFF");
      }
      brandSheet.autoResizeColumns(1, 4);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        syncedCount: data.collabs.length,
        sheetsCreated: Object.keys(monthGroups).length + 3
      })).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

export function CollabManagerModal({ isOpen, onClose }: CollabManagerModalProps) {
  const [collabs, setCollabs] = useState<CollabItem[]>([]);
  const [activeView, setActiveView] = useState<'month' | 'analytics'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-07');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Add / Edit Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CollabItem | null>(null);

  // Form Fields
  const [formBrand, setFormBrand] = useState('');
  const [formCampaign, setFormCampaign] = useState('');
  const [formCollabType, setFormCollabType] = useState<CollabType>('Fixed');
  const [formDeliverableType, setFormDeliverableType] = useState<DeliverableType>('Single Post');
  const [formDeliverableQty, setFormDeliverableQty] = useState('Single');
  const [formDate, setFormDate] = useState('2026-09-05');
  const [formBasePay, setFormBasePay] = useState<number>(3000);
  const [formBonus, setFormBonus] = useState<number>(0);
  const [formSpending, setFormSpending] = useState<number>(0);
  const [formInvoiceSent, setFormInvoiceSent] = useState<InvoiceStatus>('Yes');
  const [formStatus, setFormStatus] = useState<PaymentStatus>('Paid');
  const [formPaymentDate, setFormPaymentDate] = useState('');
  const [formPaymentMode, setFormPaymentMode] = useState<PaymentMode>('UPI');
  const [formWorkStatus, setFormWorkStatus] = useState<WorkStatus>('Completed');
  const [formPostUrl, setFormPostUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Sync / Webhook State
  const [syncConfig, setSyncConfig] = useState<GoogleSheetSyncConfig>({ webhookUrl: '', autoSync: false });
  const [isSyncSettingsOpen, setIsSyncSettingsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Load from local storage
  useEffect(() => {
    if (isOpen) {
      const items = getSavedCollabs();
      setCollabs(items);
      const conf = getSyncConfig();
      setSyncConfig(conf);
      if (items.length > 0 && selectedMonth === '2026-07') {
        const unique = getUniqueMonths(items);
        if (unique.includes('2026-07')) {
          setSelectedMonth('2026-07');
        } else if (unique.length > 0) {
          setSelectedMonth(unique[0]);
        }
      }
    }
  }, [isOpen]);

  // Derived Calculations
  const months = useMemo(() => getUniqueMonths(collabs), [collabs]);
  const monthSummary = useMemo(() => calculateMonthSummary(collabs, selectedMonth), [collabs, selectedMonth]);
  const allMonthsSummary = useMemo(() => calculateAllMonthsSummary(collabs), [collabs]);

  // Overall totals for Analytics tab
  const overallTotals = useMemo(() => {
    const totalCollabs = allMonthsSummary.reduce((s, m) => s + m.totalCollabs, 0);
    const totalRevenue = allMonthsSummary.reduce((s, m) => s + m.totalRevenue, 0);
    const totalSpend = allMonthsSummary.reduce((s, m) => s + m.totalSpend, 0);
    const totalProfit = allMonthsSummary.reduce((s, m) => s + m.totalProfit, 0);
    const pendingCount = allMonthsSummary.reduce((s, m) => s + m.pendingCount, 0);
    const avgDealSize = totalCollabs > 0 ? totalRevenue / totalCollabs : 0;
    return { totalCollabs, totalRevenue, totalSpend, totalProfit, pendingCount, avgDealSize };
  }, [allMonthsSummary]);

  // Filtered Collabs for Table
  const filteredCollabs = useMemo(() => {
    return collabs.filter((c) => {
      const matchMonth = selectedMonth === 'all' || c.month === selectedMonth;
      const matchSearch =
        searchQuery === '' ||
        c.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.campaign && c.campaign.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      return matchMonth && matchSearch && matchStatus;
    });
  }, [collabs, selectedMonth, searchQuery, statusFilter]);

  if (!isOpen) return null;

  // Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormBrand('');
    setFormCampaign('');
    setFormCollabType('Fixed');
    setFormDeliverableType('Single Post');
    setFormDeliverableQty('Single');
    const defaultDate = selectedMonth !== 'all' ? `${selectedMonth}-15` : new Date().toISOString().slice(0, 10);
    setFormDate(defaultDate);
    setFormBasePay(3000);
    setFormBonus(0);
    setFormSpending(0);
    setFormInvoiceSent('Yes');
    setFormStatus('Paid');
    setFormPaymentDate(defaultDate);
    setFormPaymentMode('UPI');
    setFormWorkStatus('Completed');
    setFormPostUrl('');
    setFormNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (item: CollabItem) => {
    setEditingItem(item);
    setFormBrand(item.brandName);
    setFormCampaign(item.campaign || '');
    setFormCollabType(item.collabType || 'Fixed');
    setFormDeliverableType(item.deliverableType || 'Single Post');
    setFormDeliverableQty(item.deliverableQty || 'Single');
    setFormDate(item.scheduledDate || '');
    setFormBasePay(item.basePay || 0);
    setFormBonus(item.bonus || 0);
    setFormSpending(item.spending || 0);
    setFormInvoiceSent(item.invoiceSent || 'Yes');
    setFormStatus(item.status || 'Paid');
    setFormPaymentDate(item.paymentReceivedDate || '');
    setFormPaymentMode(item.paymentMode || 'UPI');
    setFormWorkStatus(item.workStatus || 'Completed');
    setFormPostUrl(item.postUrl || '');
    setFormNotes(item.notes || '');
    setIsFormOpen(true);
  };

  const handleSaveCollab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBrand.trim()) return;

    const monthKey = formDate ? formDate.slice(0, 7) : selectedMonth !== 'all' ? selectedMonth : '2026-09';
    const totalAmount = Number(formBasePay || 0) + Number(formBonus || 0);
    const spend = Number(formSpending || 0);
    const net = totalAmount - spend;

    if (editingItem) {
      const updated = collabs.map((c) =>
        c.id === editingItem.id
          ? {
              ...c,
              month: monthKey,
              brandName: formBrand.trim(),
              campaign: formCampaign.trim(),
              collabType: formCollabType,
              deliverableType: formDeliverableType,
              deliverableQty: formDeliverableQty,
              scheduledDate: formDate,
              basePay: Number(formBasePay || 0),
              bonus: Number(formBonus || 0),
              amount: totalAmount,
              spending: spend,
              netProfit: net,
              invoiceSent: formInvoiceSent,
              status: formStatus,
              paymentReceivedDate: formPaymentDate || undefined,
              paymentMode: formPaymentMode,
              workStatus: formWorkStatus,
              postUrl: formPostUrl.trim() || undefined,
              notes: formNotes.trim() || undefined,
              updatedAt: new Date().toISOString(),
            }
          : c
      );
      setCollabs(updated);
      saveCollabs(updated);
    } else {
      const newItem: CollabItem = {
        id: `collab_${Date.now()}`,
        month: monthKey,
        brandName: formBrand.trim(),
        campaign: formCampaign.trim(),
        collabType: formCollabType,
        deliverableType: formDeliverableType,
        deliverableQty: formDeliverableQty,
        scheduledDate: formDate,
        basePay: Number(formBasePay || 0),
        bonus: Number(formBonus || 0),
        amount: totalAmount,
        spending: spend,
        netProfit: net,
        invoiceSent: formInvoiceSent,
        status: formStatus,
        paymentReceivedDate: formPaymentDate || undefined,
        paymentMode: formPaymentMode,
        workStatus: formWorkStatus,
        postUrl: formPostUrl.trim() || undefined,
        notes: formNotes.trim() || undefined,
        currency: 'INR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newItem, ...collabs];
      setCollabs(updated);
      saveCollabs(updated);
    }

    setIsFormOpen(false);
  };

  const handleDeleteCollab = (id: string) => {
    if (confirm('Delete this collaboration record?')) {
      const updated = collabs.filter((c) => c.id !== id);
      setCollabs(updated);
      saveCollabs(updated);
    }
  };

  const handleTogglePaymentStatus = (item: CollabItem) => {
    const nextStatus: PaymentStatus = item.status === 'Paid' ? 'Pending' : 'Paid';
    const updated = collabs.map((c) =>
      c.id === item.id
        ? {
            ...c,
            status: nextStatus,
            paymentReceivedDate: nextStatus === 'Paid' ? (c.paymentReceivedDate || new Date().toISOString().slice(0, 10)) : undefined,
            updatedAt: new Date().toISOString(),
          }
        : c
    );
    setCollabs(updated);
    saveCollabs(updated);
  };

  const handleSyncToGoogleSheet = async () => {
    if (!syncConfig.webhookUrl) {
      setIsSyncSettingsOpen(true);
      setSyncStatusMsg({
        text: 'Please enter a valid Google Apps Script Webhook URL.',
        isError: true,
      });
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg(null);

    try {
      const res = await fetch('/api/collabs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: syncConfig.webhookUrl,
          collabs,
          monthlyAnalytics: allMonthsSummary,
          monthFilter: 'all',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Sync failed.');
      }

      const updatedConf = { ...syncConfig, lastSyncedAt: new Date().toLocaleTimeString() };
      setSyncConfig(updatedConf);
      saveSyncConfig(updatedConf);
      setSyncStatusMsg({
        text: `✓ Synced ${data.syncedCount} records & updated Analytics successfully!`,
        isError: false,
      });
    } catch (err: any) {
      setSyncStatusMsg({
        text: err.message || 'Sync failed. Check your Webhook URL.',
        isError: true,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCopyGoogleScript = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(GOOGLE_SCRIPT_CODE);
      }
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-zinc-950 text-slate-900 dark:text-slate-100 w-full max-w-6xl max-h-[92vh] rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden my-auto transition-colors">
        
        {/* Sleek Executive Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-base tracking-tight text-white">
                  Kamal - LinkedIn Collabs 2026
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[11px] font-medium border border-emerald-500/30">
                  Live Sheet Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Monthly revenue tracking, brand CRM &amp; analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncToGoogleSheet}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="hidden sm:inline">Sync Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Deal</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sync Status Alert */}
        {syncStatusMsg && (
          <div
            className={`px-5 py-2 text-xs font-medium flex items-center justify-between border-b ${
              syncStatusMsg.isError
                ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>{syncStatusMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setSyncStatusMsg(null)}
              className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Navigation & Controls Bar */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Main Views (Monthly Analytics vs Month CRMs) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            {/* Monthly Analytics Tab */}
            <button
              type="button"
              onClick={() => setActiveView('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeView === 'analytics'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Monthly Analytics</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-200 dark:bg-zinc-800 mx-1 shrink-0" />

            {/* Individual Month CRM Tabs */}
            {months.map((m) => {
              const label = `${getMonthName(m)} CRM`;
              const isSelected = activeView === 'month' && selectedMonth === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setSelectedMonth(m);
                    setActiveView('month');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  {label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                setSelectedMonth('all');
                setActiveView('month');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer shrink-0 ${
                activeView === 'month' && selectedMonth === 'all'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-zinc-800/50'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Right Tools: Sheet Settings Toggle */}
          <button
            type="button"
            onClick={() => setIsSyncSettingsOpen(!isSyncSettingsOpen)}
            className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>Webhook Setup</span>
            {isSyncSettingsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Google Sheet Webhook Settings Drawer */}
        {isSyncSettingsOpen && (
          <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 space-y-2.5 text-xs animate-fadeIn shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Google Apps Script Deployment URL
              </span>
              <button
                type="button"
                onClick={handleCopyGoogleScript}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-medium text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedCode ? '✓ Script Copied' : 'Copy Multi-Sheet Script'}</span>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={syncConfig.webhookUrl}
                onChange={(e) => {
                  const next = { ...syncConfig, webhookUrl: e.target.value };
                  setSyncConfig(next);
                  saveSyncConfig(next);
                }}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleSyncToGoogleSheet}
                disabled={isSyncing || !syncConfig.webhookUrl}
                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs shrink-0 transition-colors cursor-pointer disabled:opacity-50"
              >
                Test &amp; Sync
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Paste the script in your Google Sheet under <b>Extensions &gt; Apps Script</b> &rarr; <b>Deploy &gt; Web app (Anyone)</b>. It will auto-create and update your <code>Monthly Analytics</code> and monthly sheets.
            </p>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5">
          
          {/* VIEW 1: MONTHLY ANALYTICS (Image 4 format) */}
          {activeView === 'analytics' ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Financial KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Revenue</span>
                  <p className="font-semibold text-2xl text-slate-900 dark:text-slate-100 mt-1">
                    ₹{overallTotals.totalRevenue.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-slate-500">{overallTotals.totalCollabs} Deals Across All Months</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Spend</span>
                  <p className="font-semibold text-2xl text-rose-600 dark:text-rose-400 mt-1">
                    ₹{overallTotals.totalSpend.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-slate-500">Production &amp; Outsource Costs</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Profit</span>
                  <p className="font-semibold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
                    ₹{overallTotals.totalProfit.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Take-Home Profit</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Avg Deal Size</span>
                  <p className="font-semibold text-2xl text-slate-900 dark:text-slate-100 mt-1">
                    ₹{Math.round(overallTotals.avgDealSize).toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">{overallTotals.pendingCount} Pending Payments</span>
                </div>
              </div>

              {/* Clean Analytics Table */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
                <div className="px-4 py-3 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    <h3 className="font-semibold text-xs tracking-wide uppercase text-slate-700 dark:text-slate-300">
                      Monthly Analytics Breakdown
                    </h3>
                  </div>
                  <span className="text-xs text-slate-500">
                    Auto-computed totals
                  </span>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/75 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 font-medium text-[11px] border-b border-slate-200 dark:border-zinc-800">
                        <th className="px-4 py-3 font-semibold">Month</th>
                        <th className="px-4 py-3 text-center font-semibold">Deals</th>
                        <th className="px-4 py-3 text-right font-semibold">Revenue</th>
                        <th className="px-4 py-3 text-right font-semibold">Spend</th>
                        <th className="px-4 py-3 text-right font-semibold">Net Profit</th>
                        <th className="px-4 py-3 text-center font-semibold">Pending</th>
                        <th className="px-4 py-3 text-right font-semibold">Avg Deal</th>
                        <th className="px-4 py-3 text-center font-semibold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                      {allMonthsSummary.map((m) => (
                        <tr key={m.month} className="hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-900 dark:text-slate-100">
                            {m.monthName}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">
                            {m.totalCollabs}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                            ₹{m.totalRevenue.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">
                            {m.totalSpend > 0 ? `₹${m.totalSpend.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                            ₹{m.totalProfit.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {m.pendingCount > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 text-[11px] font-medium">
                                {m.pendingCount}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">
                            ₹{Math.round(m.avgDealSize).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMonth(m.month);
                                setActiveView('month');
                              }}
                              className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-700 dark:text-slate-300 text-[11px] font-medium transition-colors cursor-pointer"
                            >
                              Open CRM &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* Total Summary Row */}
                      <tr className="bg-slate-50 dark:bg-zinc-900 font-semibold text-xs border-t border-slate-200 dark:border-zinc-700">
                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100">TOTAL</td>
                        <td className="px-4 py-3 text-center">{overallTotals.totalCollabs}</td>
                        <td className="px-4 py-3 text-right text-slate-900 dark:text-slate-100">₹{overallTotals.totalRevenue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-rose-600 dark:text-rose-400">₹{overallTotals.totalSpend.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">₹{overallTotals.totalProfit.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-center">{overallTotals.pendingCount}</td>
                        <td className="px-4 py-3 text-right">₹{Math.round(overallTotals.avgDealSize).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-center text-slate-400 text-[11px]">All Months</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 2: INDIVIDUAL MONTH CRM TABLE */
            <div className="space-y-5 animate-fadeIn">
              {/* Monthly KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Revenue ({monthSummary.monthLabel})</span>
                  <p className="font-semibold text-2xl text-slate-900 dark:text-slate-100 mt-1">
                    ₹{monthSummary.totalRevenue.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-slate-500">{monthSummary.totalCollabs} Deals Recorded</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Spend / Expenses</span>
                  <p className="font-semibold text-2xl text-rose-600 dark:text-rose-400 mt-1">
                    ₹{monthSummary.totalSpend.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-slate-500">Outsourced &amp; Production</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Profit</span>
                  <p className="font-semibold text-2xl text-emerald-600 dark:text-emerald-400 mt-1">
                    ₹{monthSummary.totalProfit.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Margin: {monthSummary.totalRevenue > 0 ? Math.round((monthSummary.totalProfit / monthSummary.totalRevenue) * 100) : 0}%</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-900/40 border border-slate-200/80 dark:border-zinc-800">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Payment Status</span>
                  <p className="font-semibold text-2xl text-amber-600 dark:text-amber-400 mt-1">
                    {monthSummary.pendingCount} Pending
                  </p>
                  <span className="text-[11px] text-slate-500">Avg Deal: ₹{Math.round(monthSummary.avgDealSize).toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Table Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search brand, campaign, notes..."
                    className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Invoiced">Invoiced</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Clean Brand Deals Table with Expandable Rows */}
              <div className="rounded-xl border border-slate-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-950">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100/75 dark:bg-zinc-900 text-slate-600 dark:text-slate-400 font-medium text-[11px] border-b border-slate-200 dark:border-zinc-800">
                        <th className="px-4 py-3 font-semibold">Brand &amp; Deliverable</th>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 text-right font-semibold">Pay Breakdown</th>
                        <th className="px-4 py-3 text-right font-semibold">Total Fee</th>
                        <th className="px-4 py-3 text-right font-semibold">Spend</th>
                        <th className="px-4 py-3 text-right font-semibold">Net Profit</th>
                        <th className="px-4 py-3 text-center font-semibold">Payment Status</th>
                        <th className="px-4 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60 font-medium">
                      {filteredCollabs.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-xs text-slate-500">
                            No collaborations found. Click <b>Add Deal</b> to record a brand collaboration!
                          </td>
                        </tr>
                      ) : (
                        filteredCollabs.map((item) => {
                          const isPaid = item.status === 'Paid';
                          const totalAmt = (item.basePay || 0) + (item.bonus || 0) || item.amount || 0;
                          const net = totalAmt - (item.spending || 0);
                          const isExpanded = expandedRowId === item.id;

                          return (
                            <React.Fragment key={item.id}>
                              <tr
                                className={`hover:bg-slate-50/80 dark:hover:bg-zinc-900/40 transition-colors ${
                                  isExpanded ? 'bg-slate-50/90 dark:bg-zinc-900/50' : ''
                                }`}
                              >
                                {/* Brand & Deliverable */}
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                                      className="text-slate-400 hover:text-slate-600 cursor-pointer"
                                      title="Toggle details"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                          {item.brandName}
                                        </span>
                                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-slate-300">
                                          {item.deliverableType || 'Post'}
                                          {item.deliverableQty && item.deliverableQty !== 'Single' ? ` (${item.deliverableQty})` : ''}
                                        </span>
                                      </div>
                                      {item.campaign && (
                                        <p className="text-[11px] text-slate-500 font-normal">
                                          {item.campaign}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Date */}
                                <td className="px-4 py-3.5 text-xs text-slate-600 dark:text-slate-400">
                                  {item.scheduledDate || '-'}
                                </td>

                                {/* Pay Breakdown */}
                                <td className="px-4 py-3.5 text-right text-xs">
                                  {item.bonus > 0 ? (
                                    <div className="space-y-0.5">
                                      <span className="text-slate-700 dark:text-slate-300 font-medium">₹{item.basePay.toLocaleString('en-IN')}</span>
                                      <span className="block text-[10px] text-blue-600 dark:text-blue-400">+₹{item.bonus.toLocaleString('en-IN')} bonus</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-600 dark:text-slate-400">₹{(item.basePay || item.amount).toLocaleString('en-IN')}</span>
                                  )}
                                </td>

                                {/* Total Amount */}
                                <td className="px-4 py-3.5 font-semibold text-right text-sm text-slate-900 dark:text-slate-100">
                                  ₹{totalAmt.toLocaleString('en-IN')}
                                </td>

                                {/* Spend */}
                                <td className="px-4 py-3.5 text-right text-xs text-rose-600 dark:text-rose-400">
                                  {item.spending ? `₹${item.spending.toLocaleString('en-IN')}` : '-'}
                                </td>

                                {/* Net Profit */}
                                <td className="px-4 py-3.5 font-semibold text-right text-sm text-emerald-600 dark:text-emerald-400">
                                  ₹{net.toLocaleString('en-IN')}
                                </td>

                                {/* Payment Status (1-Click Toggle) */}
                                <td className="px-4 py-3.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePaymentStatus(item)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium inline-flex items-center gap-1 transition-all cursor-pointer ${
                                      isPaid
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                    }`}
                                    title="Click to toggle Paid/Pending"
                                  >
                                    {isPaid ? (
                                      <>
                                        <Check className="w-3 h-3 stroke-[2.5]" />
                                        <span>Paid</span>
                                      </>
                                    ) : (
                                      <>
                                        <Clock className="w-3 h-3" />
                                        <span>Pending</span>
                                      </>
                                    )}
                                  </button>
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1">
                                    {item.postUrl && (
                                      <a
                                        href={item.postUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
                                        title="View Post"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(item)}
                                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCollab(item.id)}
                                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expandable Details Drawer */}
                              {isExpanded && (
                                <tr className="bg-slate-50/60 dark:bg-zinc-900/30 border-b border-slate-100 dark:border-zinc-800">
                                  <td colSpan={8} className="px-6 py-3 text-xs">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[11px]">
                                      <div>
                                        <span className="text-slate-400 block mb-0.5">Invoice Sent</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                          {item.invoiceSent || 'Yes'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block mb-0.5">Payment Date</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                          {item.paymentReceivedDate || '-'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block mb-0.5">Payment Mode</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                          {item.paymentMode || 'UPI'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400 block mb-0.5">Work Status</span>
                                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                                          {item.workStatus || 'Completed'}
                                        </span>
                                      </div>
                                    </div>
                                    {item.notes && (
                                      <div className="mt-2.5 pt-2 border-t border-slate-200/50 dark:border-zinc-800">
                                        <span className="text-slate-400 block text-[10px] mb-0.5">Notes &amp; Requirements</span>
                                        <p className="text-slate-700 dark:text-slate-300">{item.notes}</p>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Clean Add / Edit Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-zinc-900 text-slate-900 dark:text-slate-100 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-2xl p-5 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-zinc-800 mb-4">
                <h3 className="font-semibold text-base">
                  {editingItem ? 'Edit Collaboration Deal' : 'Add New Brand Deal'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCollab} className="space-y-3.5 text-xs font-medium">
                {/* Brand & Campaign */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="e.g. Morphic, Matiks..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      Campaign / Topic (Optional)
                    </label>
                    <input
                      type="text"
                      value={formCampaign}
                      onChange={(e) => setFormCampaign(e.target.value)}
                      placeholder="e.g. AI Carousel, Launch..."
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Collab Type, Deliverable, Qty */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      Collab Type
                    </label>
                    <select
                      value={formCollabType}
                      onChange={(e) => setFormCollabType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      {COLLAB_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      Deliverable
                    </label>
                    <select
                      value={formDeliverableType}
                      onChange={(e) => setFormDeliverableType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      {DELIVERABLE_TYPES.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      Quantity
                    </label>
                    <input
                      type="text"
                      value={formDeliverableQty}
                      onChange={(e) => setFormDeliverableQty(e.target.value)}
                      placeholder="e.g. Single, 2"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Date & Invoice */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      Invoice Sent
                    </label>
                    <select
                      value={formInvoiceSent}
                      onChange={(e) => setFormInvoiceSent(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                      <option value="Pending">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Financials: Base Pay, Bonus, Spend */}
                <div className="p-3 bg-slate-50 dark:bg-zinc-800/50 rounded-xl border border-slate-200 dark:border-zinc-700/60 space-y-2">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Base Pay (₹)
                      </label>
                      <input
                        type="number"
                        value={formBasePay}
                        onChange={(e) => setFormBasePay(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Bonus (₹)
                      </label>
                      <input
                        type="number"
                        value={formBonus}
                        onChange={(e) => setFormBonus(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs text-blue-600 dark:text-blue-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-500 mb-1">
                        Spend (₹)
                      </label>
                      <input
                        type="number"
                        value={formSpending}
                        onChange={(e) => setFormSpending(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-md border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 font-mono text-xs text-rose-600 dark:text-rose-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500">
                    <span>Total Fee: <b>₹{(Number(formBasePay || 0) + Number(formBonus || 0)).toLocaleString('en-IN')}</b></span>
                    <span>Net Profit: <b className="text-emerald-600 dark:text-emerald-400">₹{(Number(formBasePay || 0) + Number(formBonus || 0) - Number(formSpending || 0)).toLocaleString('en-IN')}</b></span>
                  </div>
                </div>

                {/* Status, Payment Date, Payment Mode */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      Payment Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      <option value="Paid">Paid</option>
                      <option value="Pending">Pending</option>
                      <option value="Invoiced">Invoiced</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      Payment Date
                    </label>
                    <input
                      type="date"
                      value={formPaymentDate}
                      onChange={(e) => setFormPaymentDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                      Payment Mode
                    </label>
                    <select
                      value={formPaymentMode}
                      onChange={(e) => setFormPaymentMode(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                    >
                      {PAYMENT_MODES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Content Link */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    LinkedIn Post URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formPostUrl}
                    onChange={(e) => setFormPostUrl(e.target.value)}
                    placeholder="https://linkedin.com/posts/..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">
                    Notes &amp; Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Deliverable details, instructions..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-slate-900 dark:text-slate-100 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs transition-colors cursor-pointer shadow-sm"
                  >
                    {editingItem ? 'Save Changes' : 'Save Brand Deal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
