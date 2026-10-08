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
  Users,
  Heart,
  Crown,
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
  LikeHandlerStat,
} from '@/lib/collab-types';
import {
  getSavedCollabs,
  saveCollabs,
  getSyncConfig,
  saveSyncConfig,
  getUniqueMonths,
  calculateMonthSummary,
  calculateAllMonthsSummary,
  calculateLikeHandlersStats,
  formatMonthLabel,
  getMonthName,
  getCurrentMonthKey,
} from '@/lib/collab-storage';

interface CollabManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLLAB_TYPES: CollabType[] = [
  'Fixed',
  'Bonus',
  'Performance',
  'Other',
];

const DELIVERABLE_TYPES: DeliverableType[] = [
  'Single Post',
  'Carousel',
  'Video / Reel',
  'Repost',
  'Other',
];

const PAYMENT_MODES: PaymentMode[] = [
  'UPI',
  'Bank Transfer',
  'Other',
];

const GOOGLE_SCRIPT_CODE = `function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    
    if (data.action === "sync_collabs" && Array.isArray(data.collabs)) {
      
      // ==========================================
      // 1. MONTHLY ANALYTICS SUMMARY SHEET (In-Place Update)
      // ==========================================
      var analyticsSheet = ss.getSheetByName("Monthly Analytics");
      if (!analyticsSheet) {
        analyticsSheet = ss.insertSheet("Monthly Analytics", 0);
      }
      
      var anHeaders = ["Month", "Collaborations", "Revenue", "Spend", "Profit", "Amount Collected", "Amount Pending", "Avg Deal Size"];
      if (analyticsSheet.getLastRow() === 0) {
        analyticsSheet.appendRow(anHeaders);
      } else {
        analyticsSheet.getRange(1, 1, 1, 8).setValues([anHeaders]);
      }
      analyticsSheet.getRange("A1:H1")
        .setFontWeight("bold")
        .setBackground("#1E293B")
        .setFontColor("#FFFFFF")
        .setHorizontalAlignment("center");
      analyticsSheet.setFrozenRows(1);
      
      if (Array.isArray(data.monthlyAnalytics)) {
        var lastAn = analyticsSheet.getLastRow();
        if (lastAn > 1) {
          analyticsSheet.getRange(2, 1, lastAn - 1, 8).clearContent();
        }
        
        var totalCollabs = 0;
        var totalRev = 0;
        var totalSpend = 0;
        var totalProfit = 0;
        var totalCollected = 0;
        var totalPendingAmount = 0;
        var anRows = [];
        
        data.monthlyAnalytics.forEach(function(m) {
          var mColl = m.amountCollected || 0;
          var mPend = m.amountPending || 0;
          anRows.push([
            m.monthName,
            m.collaborations,
            m.revenue,
            m.spend,
            m.profit,
            mColl,
            mPend,
            m.avgDealSize
          ]);
          totalCollabs += m.collaborations;
          totalRev += m.revenue;
          totalSpend += m.spend;
          totalProfit += m.profit;
          totalCollected += mColl;
          totalPendingAmount += mPend;
        });
        
        // Grand Total Row
        anRows.push([
          "TOTAL",
          totalCollabs,
          totalRev,
          totalSpend,
          totalProfit,
          totalCollected,
          totalPendingAmount,
          totalCollabs > 0 ? (totalRev / totalCollabs) : 0
        ]);
        
        if (anRows.length > 0) {
          analyticsSheet.getRange(2, 1, anRows.length, 8).setValues(anRows);
          var totRow = anRows.length + 1;
          analyticsSheet.getRange(totRow, 1, 1, 8)
            .setFontWeight("bold")
            .setBackground("#FDE047")
            .setFontColor("#1D1815");
        }
      }
      analyticsSheet.autoResizeColumns(1, 8);
      
      // ==========================================
      // 2. SEPARATE MONTH CRM SHEETS (SMART INCREMENTAL UPSERT)
      // ==========================================
      var monthGroups = {};
      data.collabs.forEach(function(item) {
        var mKey = item.MonthKey || "General";
        if (!monthGroups[mKey]) monthGroups[mKey] = [];
        monthGroups[mKey].push(item);
      });
      
      var monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      var headers = [
        "Brand", "Campaign", "Collaboration Type", "Deliverable Type", "Deliverable",
        "Posted Date", "Base Pay", "Bonus", "Total Amount", "Spend", "Net Profit",
        "Like Handler", "Like Cost",
        "Invoice Sent", "Payment Status", "Payment Date", "Status", "Content Link", "Notes", "Collab ID"
      ];

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
        
        if (mSheet.getLastRow() === 0) {
          mSheet.appendRow(headers);
        } else {
          mSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
        }
        
        mSheet.getRange(1, 1, 1, headers.length)
          .setFontWeight("bold")
          .setBackground("#1E293B")
          .setFontColor("#FFFFFF")
          .setHorizontalAlignment("center");
        mSheet.setFrozenRows(1);
        
        // Read existing rows to build lookup map for in-place upsert
        var existingData = mSheet.getDataRange().getValues();
        var rowLookup = {}; // Key: CollabID or (Brand + "_" + PostedDate) -> RowNumber (1-indexed)
        
        for (var i = 1; i < existingData.length; i++) {
          var rBrand = String(existingData[i][0] || "").trim().toLowerCase();
          var rDate = String(existingData[i][5] || "").trim();
          var rId = String(existingData[i][19] || existingData[i][17] || "").trim();
          
          if (rId) {
            rowLookup["id_" + rId] = i + 1;
          }
          if (rBrand && rDate) {
            rowLookup["key_" + rBrand + "_" + rDate] = i + 1;
          }
        }
        
        var items = monthGroups[mKey];
        items.forEach(function(c) {
          var cId = String(c.ID || c.id || "").trim();
          var cBrand = String(c.Brand || "").trim().toLowerCase();
          var cDate = String(c.PostedDate || "").trim();
          
          var targetRow = rowLookup["id_" + cId] || rowLookup["key_" + cBrand + "_" + cDate];
          
          var rowValues = [
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
            c.LikeHandler || "None",
            c.LikeCost || c.Spend || 0,
            c.InvoiceSent,
            c.PaymentStatus,
            c.PaymentDate,
            c.Status,
            c.ContentLink,
            c.Notes,
            c.ID || c.id || ""
          ];
          
          if (targetRow) {
            // Update existing row in place without destroying notes or formatting!
            mSheet.getRange(targetRow, 1, 1, headers.length).setValues([rowValues]);
          } else {
            // Append newly added deal
            mSheet.appendRow(rowValues);
            var newRowNum = mSheet.getLastRow();
            mSheet.getRange(newRowNum, 1, 1, headers.length).setBackground(newRowNum % 2 === 0 ? "#EBF2FA" : "#FFFFFF");
            if (cId) rowLookup["id_" + cId] = newRowNum;
            if (cBrand && cDate) rowLookup["key_" + cBrand + "_" + cDate] = newRowNum;
          }
        });
        
        mSheet.autoResizeColumns(1, headers.length);
      });

      // ==========================================
      // 3. PAYMENTS TRACKER SHEET (Smart Upsert)
      // ==========================================
      var paySheet = ss.getSheetByName("Payments");
      if (!paySheet) {
        paySheet = ss.insertSheet("Payments");
      }
      var payHeaders = ["Brand", "Month", "Amount (INR)", "Payment Status", "Payment Date", "Invoice Sent", "Payment Mode", "Notes", "Collab ID"];
      if (paySheet.getLastRow() === 0) {
        paySheet.appendRow(payHeaders);
      } else {
        paySheet.getRange(1, 1, 1, payHeaders.length).setValues([payHeaders]);
      }
      paySheet.getRange(1, 1, 1, payHeaders.length)
        .setFontWeight("bold")
        .setBackground("#0F766E")
        .setFontColor("#FFFFFF")
        .setHorizontalAlignment("center");
      paySheet.setFrozenRows(1);
      
      var payData = paySheet.getDataRange().getValues();
      var payLookup = {};
      for (var p = 1; p < payData.length; p++) {
        var pBrand = String(payData[p][0] || "").trim().toLowerCase();
        var pMonth = String(payData[p][1] || "").trim();
        var pId = String(payData[p][8] || "").trim();
        if (pId) payLookup["id_" + pId] = p + 1;
        if (pBrand && pMonth) payLookup["key_" + pBrand + "_" + pMonth] = p + 1;
      }
      
      data.collabs.forEach(function(c) {
        var cId = String(c.ID || c.id || "").trim();
        var cBrand = String(c.Brand || "").trim().toLowerCase();
        var cMonth = String(c.MonthKey || "").trim();
        var pRow = payLookup["id_" + cId] || payLookup["key_" + cBrand + "_" + cMonth];
        
        var pValues = [
          c.Brand,
          c.MonthKey,
          c.TotalAmount,
          c.PaymentStatus,
          c.PaymentDate,
          c.InvoiceSent,
          c.PaymentMode || "-",
          c.Notes,
          c.ID || c.id || ""
        ];
        
        if (pRow) {
          paySheet.getRange(pRow, 1, 1, payHeaders.length).setValues([pValues]);
        } else {
          paySheet.appendRow(pValues);
          var newPayRow = paySheet.getLastRow();
          paySheet.getRange(newPayRow, 1, 1, payHeaders.length).setBackground(newPayRow % 2 === 0 ? "#F0FDFA" : "#FFFFFF");
          if (cId) payLookup["id_" + cId] = newPayRow;
          if (cBrand && cMonth) payLookup["key_" + cBrand + "_" + cMonth] = newPayRow;
        }
      });
      paySheet.autoResizeColumns(1, payHeaders.length);

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
      var brandHeaders = ["Brand Name", "Total Deals Done", "Lifetime Revenue (INR)", "Latest Deal Date"];
      if (brandSheet.getLastRow() === 0) {
        brandSheet.appendRow(brandHeaders);
      } else {
        brandSheet.getRange(1, 1, 1, 4).setValues([brandHeaders]);
      }
      brandSheet.getRange("A1:D1")
        .setFontWeight("bold")
        .setBackground("#4338CA")
        .setFontColor("#FFFFFF")
        .setHorizontalAlignment("center");
      brandSheet.setFrozenRows(1);

      var brandKeys = Object.keys(brandMap).sort();
      var lastBr = brandSheet.getLastRow();
      if (lastBr > 1) {
        brandSheet.getRange(2, 1, lastBr - 1, 4).clearContent();
      }
      
      var brRows = [];
      brandKeys.forEach(function(bName) {
        var bInfo = brandMap[bName];
        brRows.push([
          bName,
          bInfo.count,
          bInfo.totalRev,
          bInfo.latestDate
        ]);
      });
      if (brRows.length > 0) {
        brandSheet.getRange(2, 1, brRows.length, 4).setValues(brRows);
        for (var b = 2; b <= brRows.length + 1; b++) {
          brandSheet.getRange(b, 1, 1, 4).setBackground(b % 2 === 0 ? "#EEF2FF" : "#FFFFFF");
        }
      }
      brandSheet.autoResizeColumns(1, 4);
      
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        syncedCount: data.collabs.length,
        sheetsCreated: Object.keys(monthGroups).length + 3,
        mode: "incremental_upsert"
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
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getCurrentMonthKey());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [likeFilter, setLikeFilter] = useState<'all' | 'Prince' | 'Shivani' | 'Others' | 'None'>('all');
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
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [formBasePay, setFormBasePay] = useState<number>(3000);
  const [formBonus, setFormBonus] = useState<number>(0);
  const [formSpending, setFormSpending] = useState<number>(0);
  const [formLikeHandlerType, setFormLikeHandlerType] = useState<'None' | 'Prince' | 'Shivani' | 'Other'>('None');
  const [formCustomHandlerName, setFormCustomHandlerName] = useState('');
  const [formLikeCost, setFormLikeCost] = useState<number>(0);
  const [formInvoiceSent, setFormInvoiceSent] = useState<InvoiceStatus>('No');
  const [formStatus, setFormStatus] = useState<PaymentStatus>('Pending');
  const [formPaymentDate, setFormPaymentDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().slice(0, 10);
  });
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

  // Load from local storage and default to current month
  useEffect(() => {
    if (isOpen) {
      const items = getSavedCollabs();
      setCollabs(items);
      const conf = getSyncConfig();
      setSyncConfig(conf);
      const curMonth = getCurrentMonthKey();
      setSelectedMonth(curMonth);
    }
  }, [isOpen]);

  // Derived Calculations
  const months = useMemo(() => getUniqueMonths(collabs), [collabs]);
  const monthSummary = useMemo(() => calculateMonthSummary(collabs, selectedMonth), [collabs, selectedMonth]);
  const allMonthsSummary = useMemo(() => calculateAllMonthsSummary(collabs), [collabs]);
  const monthLikeStats = useMemo(() => calculateLikeHandlersStats(collabs, selectedMonth), [collabs, selectedMonth]);
  const overallLikeStats = useMemo(() => calculateLikeHandlersStats(collabs, 'all'), [collabs]);

  // Overall totals for Analytics tab
  const overallTotals = useMemo(() => {
    const totalCollabs = allMonthsSummary.reduce((s, m) => s + m.totalCollabs, 0);
    const totalRevenue = allMonthsSummary.reduce((s, m) => s + m.totalRevenue, 0);
    const totalSpend = allMonthsSummary.reduce((s, m) => s + m.totalSpend, 0);
    const totalProfit = allMonthsSummary.reduce((s, m) => s + m.totalProfit, 0);
    const amountCollected = allMonthsSummary.reduce((s, m) => s + (m.amountCollected || 0), 0);
    const amountPending = allMonthsSummary.reduce((s, m) => s + (m.amountPending || 0), 0);
    const paidCount = allMonthsSummary.reduce((s, m) => s + (m.paidCount || 0), 0);
    const pendingCount = allMonthsSummary.reduce((s, m) => s + m.pendingCount, 0);
    const avgDealSize = totalCollabs > 0 ? totalRevenue / totalCollabs : 0;
    return {
      totalCollabs,
      totalRevenue,
      totalSpend,
      totalProfit,
      amountCollected,
      amountPending,
      paidCount,
      pendingCount,
      avgDealSize,
    };
  }, [allMonthsSummary]);

  // Filtered Collabs for Table
  const filteredCollabs = useMemo(() => {
    return collabs.filter((c) => {
      const matchMonth = selectedMonth === 'all' || c.month === selectedMonth;
      const matchSearch =
        searchQuery === '' ||
        c.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.campaign && c.campaign.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.likeHandler && c.likeHandler.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchLike =
        likeFilter === 'all' ||
        (likeFilter === 'Prince' && c.likeHandler?.toLowerCase().includes('prince')) ||
        (likeFilter === 'Shivani' && c.likeHandler?.toLowerCase().includes('shivani')) ||
        (likeFilter === 'Others' && c.likeHandler && !c.likeHandler.toLowerCase().includes('prince') && !c.likeHandler.toLowerCase().includes('shivani') && c.likeHandler.toLowerCase() !== 'none') ||
        (likeFilter === 'None' && (!c.likeHandler || c.likeHandler.toLowerCase() === 'none'));

      return matchMonth && matchSearch && matchStatus && matchLike;
    });
  }, [collabs, selectedMonth, searchQuery, statusFilter, likeFilter]);

  if (!isOpen) return null;

  // Handlers
  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormBrand('');
    setFormCampaign('');
    setFormCollabType('Fixed');
    setFormDeliverableType('Single Post');
    setFormDeliverableQty('Single');
    const todayStr = new Date().toISOString().slice(0, 10);
    setFormDate(todayStr);
    setFormBasePay(3000);
    setFormBonus(0);
    setFormSpending(0);
    setFormLikeHandlerType('None');
    setFormCustomHandlerName('');
    setFormLikeCost(0);
    setFormInvoiceSent('No');
    setFormStatus('Pending');
    
    const payD = new Date();
    payD.setDate(payD.getDate() + 15);
    setFormPaymentDate(payD.toISOString().slice(0, 10));

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

    // Parse like handler
    if (item.likeHandler && item.likeHandler.toLowerCase().includes('prince')) {
      setFormLikeHandlerType('Prince');
      setFormCustomHandlerName('');
    } else if (item.likeHandler && item.likeHandler.toLowerCase().includes('shivani')) {
      setFormLikeHandlerType('Shivani');
      setFormCustomHandlerName('');
    } else if (item.likeHandler && item.likeHandler.toLowerCase() !== 'none') {
      setFormLikeHandlerType('Other');
      setFormCustomHandlerName(item.likeHandler);
    } else {
      setFormLikeHandlerType('None');
      setFormCustomHandlerName('');
    }
    setFormLikeCost(item.likeCost !== undefined ? item.likeCost : (item.spending || 0));

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

    let finalHandler = 'None';
    if (formLikeHandlerType === 'Prince') finalHandler = 'Prince';
    else if (formLikeHandlerType === 'Shivani') finalHandler = 'Shivani';
    else if (formLikeHandlerType === 'Other') finalHandler = formCustomHandlerName.trim() || 'New Guy';

    const finalLikeCost = formLikeHandlerType !== 'None' ? Number(formLikeCost || spend) : 0;

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
              likeHandler: finalHandler,
              likeCost: finalLikeCost,
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
        likeHandler: finalHandler,
        likeCost: finalLikeCost,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      <div className="bg-[#0c0c0e] text-zinc-100 w-full max-w-6xl max-h-[92vh] rounded-2xl border border-amber-500/25 dark:border-rose-500/20 shadow-2xl shadow-rose-950/50 flex flex-col overflow-hidden my-auto transition-colors">
        
        {/* Sleek Executive Header (Obsidian & Sunset Rose/Gold) */}
        <div className="px-5 py-4 border-b border-rose-500/20 bg-gradient-to-r from-[#0c0c0e] via-[#161218] to-[#0c0c0e] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/25 via-rose-500/20 to-pink-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-sm shadow-amber-500/10">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base tracking-tight bg-gradient-to-r from-amber-200 via-rose-200 to-pink-200 bg-clip-text text-transparent">
                  Kamal - LinkedIn Collabs 2026
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 text-[11px] font-medium border border-rose-500/30">
                  Live Sheet Sync
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-normal">
                Monthly revenue tracking, brand CRM &amp; analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://docs.google.com/spreadsheets/d/1OCUbKY7KmoIlpJ6Os4sNZPhKZCl-ZfLJF4rfrtO96IQ/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Open Google Sheet in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Open Sheet</span>
            </a>

            <button
              type="button"
              onClick={handleSyncToGoogleSheet}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700/80 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span className="hidden sm:inline">Sync Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-400 hover:via-rose-400 hover:to-pink-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-950/40"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Deal</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 flex items-center justify-center transition-colors cursor-pointer ml-1"
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
                ? 'bg-rose-950/40 text-rose-300 border-rose-900/50'
                : 'bg-amber-950/40 text-amber-300 border-amber-900/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-amber-400" />
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
        <div className="px-5 py-3 border-b border-zinc-800/80 bg-[#100e14] flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Main Views (Monthly Analytics vs Month CRMs) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            {/* Monthly Analytics Tab */}
            <button
              type="button"
              onClick={() => setActiveView('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeView === 'analytics'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-current" />
              <span>Monthly Analytics</span>
            </button>

            <div className="w-[1px] h-4 bg-zinc-800 mx-1 shrink-0" />

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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md shadow-amber-950/40'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeView === 'month' && selectedMonth === 'all'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-md shadow-amber-950/40'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Right Tools: Sheet Settings Toggle */}
          <button
            type="button"
            onClick={() => setIsSyncSettingsOpen(!isSyncSettingsOpen)}
            className="text-xs font-medium text-zinc-400 hover:text-amber-300 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-800 hover:border-amber-500/30 hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-rose-400" />
            <span>Webhook Setup</span>
            {isSyncSettingsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Google Sheet Webhook Settings Drawer */}
        {isSyncSettingsOpen && (
          <div className="p-4 bg-[#141219] border-b border-zinc-800 space-y-2.5 text-xs animate-fadeIn shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-semibold text-zinc-200">
                Google Apps Script Deployment URL
              </span>
              <button
                type="button"
                onClick={handleCopyGoogleScript}
                className="px-3 py-1.5 rounded-lg bg-zinc-800 border border-zinc-700 font-medium text-xs text-zinc-300 flex items-center gap-1.5 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-amber-400" />
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
                className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 font-mono text-xs text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                type="button"
                onClick={handleSyncToGoogleSheet}
                disabled={isSyncing || !syncConfig.webhookUrl}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs shrink-0 transition-all cursor-pointer disabled:opacity-50"
              >
                Test &amp; Sync
              </button>
            </div>

            <p className="text-[11px] text-zinc-400">
              Paste the script in your Google Sheet under <b>Extensions &gt; Apps Script</b> &rarr; <b>Deploy &gt; Web app (Anyone)</b>. It will auto-create and update your <code>Monthly Analytics</code> and monthly sheets.
            </p>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5 bg-[#0c0c0e]">
          
          {/* VIEW 1: MONTHLY ANALYTICS */}
          {activeView === 'analytics' ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Financial KPI Cards (5 Sections - Sunset Gold/Rose Luxury Glow) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* 1. Total Revenue */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900/70 to-zinc-950 border border-amber-500/25 shadow-sm">
                  <span className="text-xs font-semibold text-amber-200/75">Total Revenue</span>
                  <p className="font-bold text-2xl text-amber-300 mt-1">
                    ₹{overallTotals.totalRevenue.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-amber-400/70">{overallTotals.totalCollabs} Deals Across All Months</span>
                </div>

                {/* 2. Total Spend */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-zinc-900/70 to-zinc-950 border border-rose-500/25 shadow-sm">
                  <span className="text-xs font-semibold text-rose-200/75">Total Spend</span>
                  <p className="font-bold text-2xl text-rose-400 mt-1">
                    ₹{overallTotals.totalSpend.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-rose-300/70">Production &amp; Outsource Costs</span>
                </div>

                {/* 3. Net Profit (Hero Card) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-rose-500/15 to-zinc-950 border border-amber-500/40 shadow-md shadow-rose-950/30">
                  <span className="text-xs font-bold bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent">Net Profit (Hero)</span>
                  <p className="font-extrabold text-2xl bg-gradient-to-r from-amber-200 via-rose-200 to-pink-200 bg-clip-text text-transparent mt-1">
                    ₹{overallTotals.totalProfit.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-rose-300 font-semibold">Take-Home Profit</span>
                </div>

                {/* 4. Amount Collected */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-zinc-900/70 to-zinc-950 border border-emerald-500/25 shadow-sm">
                  <span className="text-xs font-semibold text-emerald-200/75">Amount Collected</span>
                  <p className="font-bold text-2xl text-emerald-400 mt-1">
                    ₹{overallTotals.amountCollected.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-emerald-400/80 font-medium">
                    {overallTotals.paidCount} Deals Paid
                  </span>
                </div>

                {/* 5. Amount Need to be Collected */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-zinc-900/70 to-zinc-950 border border-orange-500/25 shadow-sm col-span-2 sm:col-span-1">
                  <span className="text-xs font-semibold text-orange-200/75">Amount to Collect</span>
                  <p className="font-bold text-2xl text-orange-400 mt-1">
                    ₹{overallTotals.amountPending.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-orange-400/80 font-medium">
                    {overallTotals.pendingCount} Deals Pending
                  </span>
                </div>
              </div>

              {/* Likes Management & Handlers Summary (Prince / Shivani / Others) */}
              <div className="p-4 rounded-2xl bg-[#110f16] border border-amber-500/20 space-y-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-500/25 to-rose-500/25 text-amber-300 border border-amber-500/40 flex items-center justify-center text-sm font-bold shadow-xs">
                      👑
                    </div>
                    <div>
                      <h4 className="font-bold text-xs bg-gradient-to-r from-amber-200 via-rose-200 to-pink-200 bg-clip-text text-transparent">
                        Like &amp; Engagement Handlers (All-Time Payouts)
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        {overallLikeStats.totalPostsWithLikes} Posts with Managed Likes • Total Likes Spend: <span className="text-amber-300 font-semibold">₹{overallLikeStats.totalLikesCost.toLocaleString('en-IN')}</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Prince Card */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-600/10 to-transparent border border-amber-500/35 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">👑</span>
                      <div>
                        <span className="font-bold text-xs text-amber-300">Prince</span>
                        <span className="block text-[11px] text-amber-200/70">{overallLikeStats.prince.postsCount} Posts Managed</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-amber-300">
                        ₹{overallLikeStats.prince.totalCost.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] text-amber-400/60 uppercase tracking-wider font-semibold">Payout</span>
                    </div>
                  </div>

                  {/* Shivani Card */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-500/15 via-pink-600/10 to-transparent border border-rose-500/35 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🌸</span>
                      <div>
                        <span className="font-bold text-xs text-rose-300">Shivani</span>
                        <span className="block text-[11px] text-rose-200/70">{overallLikeStats.shivani.postsCount} Posts Managed</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-rose-300">
                        ₹{overallLikeStats.shivani.totalCost.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] text-rose-400/60 uppercase tracking-wider font-semibold">Payout</span>
                    </div>
                  </div>

                  {/* Others Card */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-orange-500/15 via-zinc-800/20 to-transparent border border-orange-500/35 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">👤</span>
                      <div>
                        <span className="font-bold text-xs text-orange-300">Others / New Guy</span>
                        <span className="block text-[11px] text-orange-200/70">{overallLikeStats.others.postsCount} Posts Managed</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-orange-300">
                        ₹{overallLikeStats.others.totalCost.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] text-orange-400/60 uppercase tracking-wider font-semibold">Payout</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Analytics Table */}
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-[#100e14] shadow-sm">
                <div className="px-4 py-3 bg-[#15131b] border-b border-zinc-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-amber-400" />
                    <h3 className="font-bold text-xs tracking-wider uppercase bg-gradient-to-r from-amber-300 via-rose-300 to-pink-300 bg-clip-text text-transparent">
                      Monthly Analytics Breakdown
                    </h3>
                  </div>
                  <span className="text-[11px] text-zinc-400">
                    Auto-computed totals
                  </span>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#181520] text-zinc-400 font-semibold text-[11px] border-b border-zinc-800">
                        <th className="px-4 py-3">Month</th>
                        <th className="px-4 py-3 text-center">Deals</th>
                        <th className="px-4 py-3 text-right">Revenue</th>
                        <th className="px-4 py-3 text-right">Spend</th>
                        <th className="px-4 py-3 text-right">Net Profit</th>
                        <th className="px-4 py-3 text-right">Collected</th>
                        <th className="px-4 py-3 text-right">Pending</th>
                        <th className="px-4 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70 font-medium">
                      {allMonthsSummary.map((m) => (
                        <tr key={m.month} className="hover:bg-rose-500/5 transition-colors">
                          <td className="px-4 py-3 font-semibold text-zinc-100">
                            {m.monthName}
                          </td>
                          <td className="px-4 py-3 text-center text-zinc-300">
                            {m.totalCollabs}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-amber-300">
                            ₹{m.totalRevenue.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right text-rose-400">
                            {m.totalSpend > 0 ? `₹${m.totalSpend.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent">
                            ₹{m.totalProfit.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                            ₹{(m.amountCollected || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {m.amountPending > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30 text-[11px] font-semibold">
                                ₹{m.amountPending.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-zinc-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMonth(m.month);
                                setActiveView('month');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-gradient-to-r hover:from-amber-500 hover:to-rose-500 hover:text-slate-950 text-zinc-300 text-[11px] font-semibold transition-all cursor-pointer"
                            >
                              Open CRM &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* Total Summary Row */}
                      <tr className="bg-[#181520] font-bold text-xs border-t-2 border-amber-500/30">
                        <td className="px-4 py-3 text-amber-300">TOTAL</td>
                        <td className="px-4 py-3 text-center text-zinc-200">{overallTotals.totalCollabs}</td>
                        <td className="px-4 py-3 text-right text-amber-300">₹{overallTotals.totalRevenue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-rose-400">₹{overallTotals.totalSpend.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent">₹{overallTotals.totalProfit.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-emerald-400">₹{overallTotals.amountCollected.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-orange-400">₹{overallTotals.amountPending.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-center text-zinc-400 text-[11px]">All Months</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* VIEW 2: INDIVIDUAL MONTH CRM TABLE */
            <div className="space-y-5 animate-fadeIn">
              {/* Monthly KPI Cards (5 Sections - Sunset Rose/Gold Palette) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* 1. Revenue */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-zinc-900/70 to-zinc-950 border border-amber-500/25 shadow-sm">
                  <span className="text-xs font-semibold text-amber-200/75">Revenue ({monthSummary.monthLabel})</span>
                  <p className="font-bold text-2xl text-amber-300 mt-1">
                    ₹{monthSummary.totalRevenue.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-amber-400/70">{monthSummary.totalCollabs} Deals Recorded</span>
                </div>

                {/* 2. Spend / Expenses */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-zinc-900/70 to-zinc-950 border border-rose-500/25 shadow-sm">
                  <span className="text-xs font-semibold text-rose-200/75">Spend / Expenses</span>
                  <p className="font-bold text-2xl text-rose-400 mt-1">
                    ₹{monthSummary.totalSpend.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-rose-300/70">Outsourced &amp; Production</span>
                </div>

                {/* 3. Net Profit (Hero) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-rose-500/15 to-zinc-950 border border-amber-500/40 shadow-md shadow-rose-950/30">
                  <span className="text-xs font-bold bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent">Net Profit</span>
                  <p className="font-extrabold text-2xl bg-gradient-to-r from-amber-200 via-rose-200 to-pink-200 bg-clip-text text-transparent mt-1">
                    ₹{monthSummary.totalProfit.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-rose-300 font-semibold">
                    Margin: {monthSummary.totalRevenue > 0 ? Math.round((monthSummary.totalProfit / monthSummary.totalRevenue) * 100) : 0}%
                  </span>
                </div>

                {/* 4. Amount Collected */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-zinc-900/70 to-zinc-950 border border-emerald-500/25 shadow-sm">
                  <span className="text-xs font-semibold text-emerald-200/75">Amount Collected</span>
                  <p className="font-bold text-2xl text-emerald-400 mt-1">
                    ₹{monthSummary.amountCollected.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-emerald-400/80 font-medium">
                    {monthSummary.paidCount} Deals Paid
                  </span>
                </div>

                {/* 5. Amount Need to be Collected */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-zinc-900/70 to-zinc-950 border border-orange-500/25 shadow-sm col-span-2 sm:col-span-1">
                  <span className="text-xs font-semibold text-orange-200/75">Amount to Collect</span>
                  <p className="font-bold text-2xl text-orange-400 mt-1">
                    ₹{monthSummary.amountPending.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-orange-400/80 font-medium">
                    {monthSummary.pendingCount} Deals Pending
                  </span>
                </div>
              </div>

              {/* Likes Handlers Summary Bar & Quick-Filter Selector */}
              <div className="p-3.5 rounded-2xl bg-[#110f16] border border-amber-500/25 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-gradient-to-br from-amber-500/25 to-rose-500/25 text-amber-300 border border-amber-500/40 flex items-center justify-center text-xs shadow-xs">
                    👑
                  </div>
                  <div>
                    <span className="font-bold text-xs text-zinc-100">
                      Likes Handlers ({monthSummary.monthLabel}):
                    </span>
                    <span className="text-[11px] text-zinc-400 ml-1.5">
                      {monthLikeStats.totalPostsWithLikes} Posts with Likes • Total Payout: <span className="text-amber-300 font-semibold">₹{monthLikeStats.totalLikesCost.toLocaleString('en-IN')}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-zinc-400 mr-1">Filter:</span>
                  {/* All filter */}
                  <button
                    type="button"
                    onClick={() => setLikeFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      likeFilter === 'all'
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-xs'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    All ({monthSummary.totalCollabs})
                  </button>

                  {/* Prince chip */}
                  <button
                    type="button"
                    onClick={() => setLikeFilter(likeFilter === 'Prince' ? 'all' : 'Prince')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      likeFilter === 'Prince'
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-xs'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/35 hover:bg-amber-500/25'
                    }`}
                  >
                    <span>👑 Prince: {monthLikeStats.prince.postsCount} (₹{monthLikeStats.prince.totalCost.toLocaleString('en-IN')})</span>
                  </button>

                  {/* Shivani chip */}
                  <button
                    type="button"
                    onClick={() => setLikeFilter(likeFilter === 'Shivani' ? 'all' : 'Shivani')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                      likeFilter === 'Shivani'
                        ? 'bg-rose-500 text-slate-950 border-rose-400 shadow-xs'
                        : 'bg-rose-500/15 text-rose-300 border-rose-500/35 hover:bg-rose-500/25'
                    }`}
                  >
                    <span>🌸 Shivani: {monthLikeStats.shivani.postsCount} (₹{monthLikeStats.shivani.totalCost.toLocaleString('en-IN')})</span>
                  </button>

                  {monthLikeStats.others.postsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setLikeFilter(likeFilter === 'Others' ? 'all' : 'Others')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer ${
                        likeFilter === 'Others'
                          ? 'bg-orange-500 text-slate-950 border-orange-400 shadow-xs'
                          : 'bg-orange-500/15 text-orange-300 border-orange-500/35 hover:bg-orange-500/25'
                      }`}
                    >
                      <span>👤 Others: {monthLikeStats.others.postsCount} (₹{monthLikeStats.others.totalCost.toLocaleString('en-IN')})</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Table Toolbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search brand, campaign, notes..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-zinc-800 bg-[#121017] text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-zinc-800 bg-[#121017] text-xs text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Invoiced">Invoiced</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>

                  <select
                    value={likeFilter}
                    onChange={(e) => setLikeFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-zinc-800 bg-[#121017] text-xs text-zinc-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Handlers</option>
                    <option value="Prince">👑 Prince</option>
                    <option value="Shivani">🌸 Shivani</option>
                    <option value="Others">👤 Others / New</option>
                    <option value="None">No Likes Assigned</option>
                  </select>
                </div>
              </div>

              {/* Clean Brand Deals Table with Expandable Rows (Obsidian & Sunset Rose/Gold) */}
              <div className="rounded-2xl border border-zinc-800 overflow-hidden bg-[#100e14] shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#181520] text-zinc-400 font-semibold text-[11px] border-b border-zinc-800">
                        <th className="px-4 py-3">Brand &amp; Deliverable</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Pay Breakdown</th>
                        <th className="px-4 py-3 text-right">Total Fee</th>
                        <th className="px-4 py-3 text-right">Spend</th>
                        <th className="px-4 py-3 text-right">Net Profit</th>
                        <th className="px-4 py-3 text-center">Likes Handler</th>
                        <th className="px-4 py-3 text-center">Payment Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/70 font-medium">
                      {filteredCollabs.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-8 text-center text-xs text-zinc-500">
                            No collaborations found matching the filters. Click <b className="text-amber-300">Add Deal</b> to record a brand collaboration!
                          </td>
                        </tr>
                      ) : (
                        filteredCollabs.map((item) => {
                          const isPaid = item.status === 'Paid';
                          const totalAmt = (item.basePay || 0) + (item.bonus || 0) || item.amount || 0;
                          const net = totalAmt - (item.spending || 0);
                          const isExpanded = expandedRowId === item.id;

                          const isPrince = item.likeHandler?.toLowerCase().includes('prince');
                          const isShivani = item.likeHandler?.toLowerCase().includes('shivani');
                          const hasOtherHandler = item.likeHandler && item.likeHandler.toLowerCase() !== 'none' && !isPrince && !isShivani;

                          return (
                            <React.Fragment key={item.id}>
                              <tr
                                className={`hover:bg-rose-500/5 transition-colors ${
                                  isExpanded ? 'bg-[#181520]' : ''
                                }`}
                              >
                                {/* Brand & Deliverable */}
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                                      className="text-zinc-500 hover:text-zinc-300 cursor-pointer"
                                      title="Toggle details"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-zinc-100 text-sm">
                                          {item.brandName}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-zinc-800 text-zinc-300 border border-zinc-700">
                                          {item.deliverableType || 'Post'}
                                          {item.deliverableQty && item.deliverableQty !== 'Single' ? ` (${item.deliverableQty})` : ''}
                                        </span>
                                      </div>
                                      {item.campaign && (
                                        <p className="text-[11px] text-zinc-400 font-normal">
                                          {item.campaign}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Date */}
                                <td className="px-4 py-3.5 text-xs text-zinc-300 font-mono">
                                  {item.scheduledDate || '-'}
                                </td>

                                {/* Pay Breakdown */}
                                <td className="px-4 py-3.5 text-right text-xs">
                                  {item.bonus > 0 ? (
                                    <div className="space-y-0.5">
                                      <span className="text-zinc-200 font-medium">₹{item.basePay.toLocaleString('en-IN')}</span>
                                      <span className="block text-[10px] text-amber-400">+₹{item.bonus.toLocaleString('en-IN')} bonus</span>
                                    </div>
                                  ) : (
                                    <span className="text-zinc-300">₹{(item.basePay || item.amount).toLocaleString('en-IN')}</span>
                                  )}
                                </td>

                                {/* Total Amount */}
                                <td className="px-4 py-3.5 font-bold text-right text-sm text-amber-300">
                                  ₹{totalAmt.toLocaleString('en-IN')}
                                </td>

                                {/* Spend */}
                                <td className="px-4 py-3.5 text-right text-xs text-rose-400 font-medium">
                                  {item.spending ? `₹${item.spending.toLocaleString('en-IN')}` : '-'}
                                </td>

                                {/* Net Profit */}
                                <td className="px-4 py-3.5 font-bold text-right text-sm bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent">
                                  ₹{net.toLocaleString('en-IN')}
                                </td>

                                {/* Likes Handler */}
                                <td className="px-4 py-3.5 text-center">
                                  {isPrince ? (
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/35 inline-flex items-center gap-1 shadow-xs">
                                      <span>👑 Prince</span>
                                      {(item.likeCost || item.spending) > 0 && (
                                        <span className="text-[10px] opacity-80">(₹{(item.likeCost || item.spending).toLocaleString('en-IN')})</span>
                                      )}
                                    </span>
                                  ) : isShivani ? (
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/35 inline-flex items-center gap-1 shadow-xs">
                                      <span>🌸 Shivani</span>
                                      {(item.likeCost || item.spending) > 0 && (
                                        <span className="text-[10px] opacity-80">(₹{(item.likeCost || item.spending).toLocaleString('en-IN')})</span>
                                      )}
                                    </span>
                                  ) : hasOtherHandler ? (
                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-500/15 text-orange-300 border border-orange-500/35 inline-flex items-center gap-1 shadow-xs">
                                      <span>👤 {item.likeHandler}</span>
                                      {(item.likeCost || item.spending) > 0 && (
                                        <span className="text-[10px] opacity-80">(₹{(item.likeCost || item.spending).toLocaleString('en-IN')})</span>
                                      )}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-500 text-xs">-</span>
                                  )}
                                </td>

                                {/* Payment Status (1-Click Toggle) */}
                                <td className="px-4 py-3.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePaymentStatus(item)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                                      isPaid
                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/35 hover:bg-emerald-500/25'
                                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/35 hover:bg-amber-500/25'
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
                                        className="p-1 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition-colors"
                                        title="View Post"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(item)}
                                      className="p-1 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCollab(item.id)}
                                      className="p-1 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expandable Details Drawer */}
                              {isExpanded && (
                                <tr className="bg-[#14121a] border-b border-zinc-800">
                                  <td colSpan={9} className="px-6 py-3.5 text-xs">
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-[11px]">
                                      <div>
                                        <span className="text-zinc-500 block mb-0.5">Likes Handler</span>
                                        <span className="font-bold text-amber-300">
                                          {item.likeHandler || 'None'} {item.likeCost ? `(₹${item.likeCost})` : ''}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-zinc-500 block mb-0.5">Invoice Sent</span>
                                        <span className="font-semibold text-zinc-200">
                                          {item.invoiceSent || 'No'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-zinc-500 block mb-0.5">Payment Date</span>
                                        <span className="font-semibold text-zinc-200 font-mono">
                                          {item.paymentReceivedDate || '-'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-zinc-500 block mb-0.5">Payment Mode</span>
                                        <span className="font-semibold text-zinc-200">
                                          {item.paymentMode || 'UPI'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-zinc-500 block mb-0.5">Work Status</span>
                                        <span className="font-semibold text-zinc-200">
                                          {item.workStatus || 'Completed'}
                                        </span>
                                      </div>
                                    </div>
                                    {item.notes && (
                                      <div className="mt-2.5 pt-2.5 border-t border-zinc-800">
                                        <span className="text-zinc-500 block text-[10px] mb-0.5 font-medium">Notes &amp; Requirements</span>
                                        <p className="text-zinc-300">{item.notes}</p>
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

        {/* Clean Add / Edit Modal (Obsidian & Sunset Rose/Gold) */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-[#0e0d12] text-zinc-100 w-full max-w-lg rounded-2xl border border-amber-500/30 shadow-2xl shadow-rose-950/70 p-5 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-rose-500/20 mb-4">
                <h3 className="font-bold text-base bg-gradient-to-r from-amber-200 via-rose-200 to-pink-200 bg-clip-text text-transparent">
                  {editingItem ? 'Edit Collaboration Deal' : 'Add New Brand Deal'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCollab} className="space-y-3.5 text-xs font-medium">
                {/* Brand & Campaign */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 mb-1 font-medium">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="e.g. Morphic, Matiks..."
                      className="w-full px-3 py-2 rounded-xl border border-zinc-700/80 bg-[#17151e] text-zinc-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 mb-1 font-medium">
                      Campaign / Topic (Optional)
                    </label>
                    <input
                      type="text"
                      value={formCampaign}
                      onChange={(e) => setFormCampaign(e.target.value)}
                      placeholder="e.g. AI Carousel, Launch..."
                      className="w-full px-3 py-2 rounded-xl border border-zinc-700/80 bg-[#17151e] text-zinc-100 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                    />
                  </div>
                </div>

                {/* Deliverable & Collab Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-zinc-300 mb-1 font-medium">
                      Deliverable Format
                    </label>
                    <select
                      value={formDeliverableType}
                      onChange={(e) => setFormDeliverableType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-700/80 bg-[#17151e] text-zinc-100 focus:outline-none"
                    >
                      {DELIVERABLE_TYPES.map((d) => (
                        <option key={d} value={d} className="bg-[#17151e] text-zinc-100">{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-300 mb-1 font-medium">
                      Collab Type
                    </label>
                    <select
                      value={formCollabType}
                      onChange={(e) => setFormCollabType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-700/80 bg-[#17151e] text-zinc-100 focus:outline-none"
                    >
                      {COLLAB_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-[#17151e] text-zinc-100">{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Invoice */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-zinc-300 font-medium">
                        Post / Scheduled Date *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const today = new Date().toISOString().slice(0, 10);
                          setFormDate(today);
                          const pDate = new Date();
                          pDate.setDate(pDate.getDate() + 15);
                          setFormPaymentDate(pDate.toISOString().slice(0, 10));
                        }}
                        className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-zinc-800 text-amber-300 border border-amber-500/20 hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        Today
                      </button>
                    </div>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        setFormDate(newDate);
                        if (newDate) {
                          const d = new Date(newDate);
                          if (!isNaN(d.getTime())) {
                            d.setDate(d.getDate() + 15);
                            setFormPaymentDate(d.toISOString().slice(0, 10));
                          }
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-700/80 bg-[#17151e] text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 mb-1 font-medium">
                      Invoice Sent
                    </label>
                    <select
                      value={formInvoiceSent}
                      onChange={(e) => setFormInvoiceSent(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-zinc-700/80 bg-[#17151e] text-zinc-100 focus:outline-none"
                    >
                      <option value="No" className="bg-[#17151e]">No</option>
                      <option value="Yes" className="bg-[#17151e]">Yes</option>
                      <option value="Pending" className="bg-[#17151e]">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Likes & Engagement Management (Prince / Shivani / Others) */}
                <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-rose-500/5 to-transparent rounded-2xl border border-amber-500/30 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                      <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                      <span>Post Likes &amp; Engagement Handler</span>
                    </label>
                    <span className="text-[10px] text-zinc-400 font-normal">
                      For calculating payouts
                    </span>
                  </div>

                  {/* Handler Segmented Buttons */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'None', label: 'None' },
                      { id: 'Prince', label: '👑 Prince' },
                      { id: 'Shivani', label: '🌸 Shivani' },
                      { id: 'Other', label: '➕ Other' },
                    ].map((btn) => {
                      const isActive = formLikeHandlerType === btn.id;
                      return (
                        <button
                          key={btn.id}
                          type="button"
                          onClick={() => {
                            setFormLikeHandlerType(btn.id as any);
                            if (btn.id === 'None') {
                              setFormLikeCost(0);
                            } else if (formLikeCost === 0) {
                              setFormLikeCost(200);
                              if (formSpending === 0) setFormSpending(200);
                            }
                          }}
                          className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border cursor-pointer flex items-center justify-center gap-1 ${
                            isActive
                              ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 border-amber-400 shadow-xs'
                              : 'bg-[#181620] text-zinc-300 border-zinc-700/80 hover:bg-zinc-800'
                          }`}
                        >
                          {btn.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* If "Other" is selected, show name input */}
                  {formLikeHandlerType === 'Other' && (
                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">
                        Handler Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formCustomHandlerName}
                        onChange={(e) => setFormCustomHandlerName(e.target.value)}
                        placeholder="e.g. Rahul, Akash, Aman..."
                        className="w-full px-3 py-1.5 rounded-xl border border-zinc-700/80 bg-[#17151e] text-zinc-100 text-xs focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  )}

                  {/* Likes Management Cost / Payout */}
                  {formLikeHandlerType !== 'None' && (
                    <div className="pt-1">
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[11px] text-zinc-300 font-medium">
                          Likes Fee / Payout (₹)
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[100, 200, 600].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => {
                                setFormLikeCost(preset);
                                if (formSpending === 0 || formSpending === formLikeCost) {
                                  setFormSpending(preset);
                                }
                              }}
                              className={`px-2 py-0.5 text-[10px] font-mono rounded-lg font-bold transition-all cursor-pointer ${
                                formLikeCost === preset
                                  ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 shadow-xs'
                                  : 'bg-zinc-800 text-zinc-300 hover:bg-amber-500/20 hover:text-amber-300 border border-zinc-700'
                              }`}
                            >
                              ₹{preset}
                            </button>
                          ))}
                        </div>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={formLikeCost}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setFormLikeCost(val);
                          if (formSpending === 0 || formSpending === formLikeCost) {
                            setFormSpending(val);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 rounded-xl border border-zinc-700/80 bg-[#17151e] font-mono text-xs text-amber-300 focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Financials: Base Pay, Bonus, Spend */}
                <div className="p-3.5 bg-[#14121a] rounded-2xl border border-zinc-800 space-y-2">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                        Base Pay (₹)
                      </label>
                      <input
                        type="number"
                        value={formBasePay}
                        onChange={(e) => setFormBasePay(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-[#1b1822] font-mono text-xs text-zinc-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                        Bonus (₹)
                      </label>
                      <input
                        type="number"
                        value={formBonus}
                        onChange={(e) => setFormBonus(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-[#1b1822] font-mono text-xs text-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-zinc-400 mb-1 font-medium">
                        Spend (₹)
                      </label>
                      <input
                        type="number"
                        value={formSpending}
                        onChange={(e) => setFormSpending(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-zinc-700 bg-[#1b1822] font-mono text-xs text-rose-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 text-zinc-400 border-t border-zinc-800/80">
                    <span>Total Fee: <b className="text-amber-300">₹{(Number(formBasePay || 0) + Number(formBonus || 0)).toLocaleString('en-IN')}</b></span>
                    <span>Net Profit: <b className="bg-gradient-to-r from-amber-300 to-rose-300 bg-clip-text text-transparent font-bold">₹{(Number(formBasePay || 0) + Number(formBonus || 0) - Number(formSpending || 0)).toLocaleString('en-IN')}</b></span>
                  </div>
                </div>

                {/* Status, Payment Date, Payment Mode */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-zinc-300 mb-1 font-medium">
                      Payment Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className={`w-full px-2.5 py-2 rounded-xl border font-bold text-xs focus:outline-none transition-colors ${
                        formStatus === 'Paid'
                          ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                          : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                      }`}
                    >
                      <option value="Pending" className="bg-[#17151e] text-amber-300">⏳ Pending (No)</option>
                      <option value="Paid" className="bg-[#17151e] text-emerald-300">✅ Paid</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-zinc-300 font-medium">
                        Payment Date
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const base = formDate ? new Date(formDate) : new Date();
                          if (!isNaN(base.getTime())) {
                            base.setDate(base.getDate() + 15);
                            setFormPaymentDate(base.toISOString().slice(0, 10));
                          }
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-zinc-800 text-amber-300 border border-amber-500/25 hover:bg-zinc-700 transition-colors cursor-pointer"
                        title="Set to 15 days after post date"
                      >
                        +15d
                      </button>
                    </div>
                    <input
                      type="date"
                      value={formPaymentDate}
                      onChange={(e) => setFormPaymentDate(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-zinc-700/80 bg-[#17151e] text-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-300 mb-1 font-medium">
                      Payment Mode
                    </label>
                    <select
                      value={formPaymentMode}
                      onChange={(e) => setFormPaymentMode(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-xl border border-zinc-700/80 bg-[#17151e] text-zinc-100 focus:outline-none"
                    >
                      {PAYMENT_MODES.map((m) => (
                        <option key={m} value={m} className="bg-[#17151e]">{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Content Link */}
                <div>
                  <label className="block text-zinc-300 mb-1 font-medium">
                    LinkedIn Post URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formPostUrl}
                    onChange={(e) => setFormPostUrl(e.target.value)}
                    placeholder="https://linkedin.com/posts/..."
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700/80 bg-[#17151e] text-zinc-100 focus:outline-none"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-zinc-300 mb-1 font-medium">
                    Notes &amp; Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Deliverable details, instructions..."
                    className="w-full px-3 py-2 rounded-xl border border-zinc-700/80 bg-[#17151e] text-zinc-100 focus:outline-none resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-pink-600 hover:from-amber-400 hover:via-rose-400 hover:to-pink-500 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-rose-950/50"
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
