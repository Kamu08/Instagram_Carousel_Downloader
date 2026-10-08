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
  Zap,
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
  const [selectedCollabIds, setSelectedCollabIds] = useState<string[]>([]);

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
  const [formLikePaymentStatus, setFormLikePaymentStatus] = useState<'Paid' | 'Pending'>('Pending');
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

  const isAllFilteredSelected =
    filteredCollabs.length > 0 &&
    filteredCollabs.every((item) => selectedCollabIds.includes(item.id));

  const handleToggleSelectAll = () => {
    if (isAllFilteredSelected) {
      const filteredSet = new Set(filteredCollabs.map((c) => c.id));
      setSelectedCollabIds(selectedCollabIds.filter((id) => !filteredSet.has(id)));
    } else {
      const newSelected = new Set([...selectedCollabIds, ...filteredCollabs.map((c) => c.id)]);
      setSelectedCollabIds(Array.from(newSelected));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedCollabIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

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
    setFormLikePaymentStatus('Pending');
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
    setFormLikePaymentStatus(item.likePaymentStatus || 'Pending');

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
    const finalLikePaymentStatus = formLikeHandlerType !== 'None' ? formLikePaymentStatus : undefined;

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
              likePaymentStatus: finalLikePaymentStatus,
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
        likePaymentStatus: finalLikePaymentStatus,
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

  const handleToggleLikePaymentStatus = (item: CollabItem) => {
    const nextStatus: 'Paid' | 'Pending' = item.likePaymentStatus === 'Paid' ? 'Pending' : 'Paid';
    const updated = collabs.map((c) =>
      c.id === item.id
        ? {
            ...c,
            likePaymentStatus: nextStatus,
            updatedAt: new Date().toISOString(),
          }
        : c
    );
    setCollabs(updated);
    saveCollabs(updated);
  };

  // Settle specific or all handler payouts
  // Settle Likes Payouts for Prince, Shivani, Others, or All
  const handleSettleHandlerPayouts = (handlerTarget: 'Prince' | 'Shivani' | 'Others' | 'All', targetMonth = 'all') => {
    let count = 0;
    const updated = collabs.map((c) => {
      const matchMonth = targetMonth === 'all' || c.month === targetMonth;
      if (!matchMonth || !c.likeHandler || c.likeHandler.toLowerCase() === 'none') {
        return c;
      }
      const isPrince = c.likeHandler.toLowerCase().includes('prince');
      const isShivani = c.likeHandler.toLowerCase().includes('shivani');
      const isOther = !isPrince && !isShivani;

      const matchesHandler =
        handlerTarget === 'All' ||
        (handlerTarget === 'Prince' && isPrince) ||
        (handlerTarget === 'Shivani' && isShivani) ||
        (handlerTarget === 'Others' && isOther);

      if (matchesHandler && c.likePaymentStatus !== 'Paid') {
        count++;
        return {
          ...c,
          likePaymentStatus: 'Paid' as const,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });

    setCollabs(updated);
    saveCollabs(updated);
    const targetLabel = handlerTarget === 'All' ? 'All Handlers (Prince & Shivani)' : handlerTarget;
    setSyncStatusMsg({
      text: `✓ 1-Click Settled: ${targetLabel} pending likes amount is now ₹0 (Paid for ${count} posts)!`,
      isError: false,
    });
  };

  // 1-Click Settle Selected Collabs (Batch for Likes or Deal Status)
  const handleSettleSelectedCollabs = (type: 'likes' | 'deals' = 'likes') => {
    if (selectedCollabIds.length === 0) return;
    const todayStr = new Date().toISOString().slice(0, 10);
    const selectedSet = new Set(selectedCollabIds);
    let count = 0;

    const updated = collabs.map((c) => {
      if (!selectedSet.has(c.id)) return c;
      count++;
      const nextStatus = type === 'deals' ? ('Paid' as PaymentStatus) : c.status;
      const nextLikeStatus =
        type === 'likes' && c.likeHandler && c.likeHandler.toLowerCase() !== 'none'
          ? ('Paid' as const)
          : c.likePaymentStatus;

      return {
        ...c,
        status: nextStatus,
        paymentReceivedDate: nextStatus === 'Paid' ? (c.paymentReceivedDate || todayStr) : c.paymentReceivedDate,
        likePaymentStatus: nextLikeStatus,
        updatedAt: new Date().toISOString(),
      };
    });

    setCollabs(updated);
    saveCollabs(updated);
    setSelectedCollabIds([]);
    setSyncStatusMsg({
      text: type === 'likes'
        ? `⚡ Settled likes payouts for ${count} selected collabs to ₹0!`
        : `✓ Marked ${count} selected brand deals as Paid!`,
      isError: false,
    });
  };

  // Delete Selected Collabs (Batch)
  const handleDeleteSelected = () => {
    if (selectedCollabIds.length === 0) return;
    if (confirm(`Delete ${selectedCollabIds.length} selected collaboration records?`)) {
      const selectedSet = new Set(selectedCollabIds);
      const updated = collabs.filter((c) => !selectedSet.has(c.id));
      setCollabs(updated);
      saveCollabs(updated);
      setSelectedCollabIds([]);
      setSyncStatusMsg({
        text: `Deleted ${selectedCollabIds.length} records.`,
        isError: false,
      });
    }
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
      <div className="bg-[#0f1117] text-slate-100 w-full max-w-6xl max-h-[92vh] rounded-2xl border border-slate-800 shadow-2xl shadow-slate-950/80 flex flex-col overflow-hidden my-auto transition-colors">
        
        {/* Modern Minimal Slate & Deep Cyan Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-[#121520] text-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-sm">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base tracking-tight text-slate-100">
                  Kamal - LinkedIn Collabs 2026
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 text-[11px] font-medium border border-cyan-500/30">
                  Live Sheet Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 font-normal">
                Monthly revenue tracking, brand CRM &amp; analytics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://docs.google.com/spreadsheets/d/1OCUbKY7KmoIlpJ6Os4sNZPhKZCl-ZfLJF4rfrtO96IQ/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Open Google Sheet in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Open Sheet</span>
            </a>

            <button
              type="button"
              onClick={handleSyncToGoogleSheet}
              disabled={isSyncing}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
              )}
              <span className="hidden sm:inline">Sync Sheet</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-cyan-950/40"
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
                ? 'bg-rose-950/40 text-rose-300 border-rose-900/50'
                : 'bg-cyan-950/40 text-cyan-300 border-cyan-900/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400" />
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
        <div className="px-5 py-3 border-b border-slate-800/80 bg-[#121520] flex flex-wrap items-center justify-between gap-3 shrink-0">
          
          {/* Main Views (Monthly Analytics vs Month CRMs) */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-full">
            {/* Monthly Analytics Tab */}
            <button
              type="button"
              onClick={() => setActiveView('analytics')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                activeView === 'analytics'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-950/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-current" />
              <span>Monthly Analytics</span>
            </button>

            <div className="w-[1px] h-4 bg-slate-800 mx-1 shrink-0" />

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
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-950/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
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
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-950/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Right Tools: Sheet Settings Toggle */}
          <button
            type="button"
            onClick={() => setIsSyncSettingsOpen(!isSyncSettingsOpen)}
            className="text-xs font-medium text-slate-400 hover:text-cyan-300 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Webhook Setup</span>
            {isSyncSettingsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Google Sheet Webhook Settings Drawer */}
        {isSyncSettingsOpen && (
          <div className="p-4 bg-[#141824] border-b border-slate-800 space-y-2.5 text-xs animate-fadeIn shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-semibold text-slate-200">
                Google Apps Script Deployment URL
              </span>
              <button
                type="button"
                onClick={handleCopyGoogleScript}
                className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 font-medium text-xs text-slate-300 flex items-center gap-1.5 hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5 text-cyan-400" />
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
                className="flex-1 px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 font-mono text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={handleSyncToGoogleSheet}
                disabled={isSyncing || !syncConfig.webhookUrl}
                className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0 transition-all cursor-pointer disabled:opacity-50"
              >
                Test &amp; Sync
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Paste the script in your Google Sheet under <b>Extensions &gt; Apps Script</b> &rarr; <b>Deploy &gt; Web app (Anyone)</b>. It will auto-create and update your <code>Monthly Analytics</code> and monthly sheets.
            </p>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-5 bg-[#0f1117]">
          
          {/* VIEW 1: MONTHLY ANALYTICS */}
          {activeView === 'analytics' ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Financial KPI Cards (5 Sections - Clean Slate & Steel Cyan) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* 1. Total Revenue */}
                <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Total Revenue</span>
                  <p className="font-bold text-2xl text-cyan-400 mt-1 font-mono">
                    ₹{overallTotals.totalRevenue.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-slate-500">{overallTotals.totalCollabs} Deals Across All Months</span>
                </div>

                {/* 2. Total Spend */}
                <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Total Spend</span>
                  <p className="font-bold text-2xl text-slate-300 mt-1 font-mono">
                    ₹{overallTotals.totalSpend.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-slate-500">Production &amp; Outsource Costs</span>
                </div>

                {/* 3. Net Profit (Hero Card) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/30 via-[#161c2c] to-[#121520] border border-cyan-500/35 shadow-sm">
                  <span className="text-xs font-bold text-cyan-300">Net Profit (Hero)</span>
                  <p className="font-extrabold text-2xl text-cyan-300 mt-1 font-mono">
                    ₹{overallTotals.totalProfit.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-cyan-400/80 font-medium">Take-Home Profit</span>
                </div>

                {/* 4. Amount Collected */}
                <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Amount Collected</span>
                  <p className="font-bold text-2xl text-emerald-400 mt-1 font-mono">
                    ₹{overallTotals.amountCollected.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-emerald-400/80 font-medium">
                    {overallTotals.paidCount} Deals Paid
                  </span>
                </div>

                {/* 5. Amount Need to be Collected */}
                <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 shadow-sm col-span-2 sm:col-span-1">
                  <span className="text-xs font-semibold text-slate-400">Amount to Collect</span>
                  <p className="font-bold text-2xl text-amber-400 mt-1 font-mono">
                    ₹{overallTotals.amountPending.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-amber-400/80 font-medium">
                    {overallTotals.pendingCount} Deals Pending
                  </span>
                </div>
              </div>

              {/* Likes Management & Handlers Summary (Prince / Shivani / Others) */}
              <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 space-y-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-sm font-bold shadow-xs">
                      👑
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-200">
                        Like &amp; Engagement Handlers (All-Time Payouts)
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {overallLikeStats.totalPostsWithLikes} Posts with Managed Likes • Total Likes Cost:{' '}
                        <span className="text-slate-200 font-semibold font-mono">₹{overallLikeStats.totalLikesCost.toLocaleString('en-IN')}</span>
                        {' '}• Total Pending Due:{' '}
                        {overallLikeStats.totalLikesPending > 0 ? (
                          <span className="text-amber-400 font-bold font-mono">₹{overallLikeStats.totalLikesPending.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">₹0 (All Paid)</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {overallLikeStats.totalLikesPending > 0 && (
                      <button
                        type="button"
                        onClick={() => handleSettleHandlerPayouts('All', 'all')}
                        className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-cyan-950/40 transition-all cursor-pointer self-start sm:self-auto"
                        title="1-Click: Clear all pending likes across all months to ₹0"
                      >
                        <Zap className="w-3.5 h-3.5 fill-current" />
                        <span>⚡ Settle All Likes (₹{overallLikeStats.totalLikesPending.toLocaleString('en-IN')} &rarr; ₹0)</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Prince Card */}
                  <div className="p-3.5 rounded-xl bg-[#181d2c] border border-cyan-500/30 flex flex-col justify-between gap-2.5 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">👑</span>
                        <div>
                          <span className="font-bold text-xs text-cyan-300 block">Prince</span>
                          <span className="text-[11px] text-slate-400">
                            {overallLikeStats.prince.postsCount} Posts ({overallLikeStats.prince.paidPostsCount} Paid, {overallLikeStats.prince.pendingPostsCount} Due)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {overallLikeStats.prince.pendingCost > 0 ? (
                          <div>
                            <span className="font-extrabold text-base text-cyan-300 font-mono block">
                              ₹{overallLikeStats.prince.pendingCost.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-cyan-400/80 font-bold uppercase tracking-wider">Due to Pay</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-xs text-emerald-400 flex items-center justify-end gap-1">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>₹0 Due</span>
                            </span>
                            <span className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider">Settled</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Total Billed: <b className="text-slate-200 font-mono">₹{overallLikeStats.prince.totalCost.toLocaleString('en-IN')}</b></span>
                      {overallLikeStats.prince.pendingCost > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleSettleHandlerPayouts('Prince', 'all')}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-[10px] font-semibold">✓ Paid in Full</span>
                      )}
                    </div>
                  </div>

                  {/* Shivani Card */}
                  <div className="p-3.5 rounded-xl bg-[#181d2c] border border-indigo-500/30 flex flex-col justify-between gap-2.5 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌸</span>
                        <div>
                          <span className="font-bold text-xs text-indigo-300 block">Shivani</span>
                          <span className="text-[11px] text-slate-400">
                            {overallLikeStats.shivani.postsCount} Posts ({overallLikeStats.shivani.paidPostsCount} Paid, {overallLikeStats.shivani.pendingPostsCount} Due)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {overallLikeStats.shivani.pendingCost > 0 ? (
                          <div>
                            <span className="font-extrabold text-base text-indigo-300 font-mono block">
                              ₹{overallLikeStats.shivani.pendingCost.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-indigo-400/80 font-bold uppercase tracking-wider">Due to Pay</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-xs text-emerald-400 flex items-center justify-end gap-1">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>₹0 Due</span>
                            </span>
                            <span className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider">Settled</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Total Billed: <b className="text-slate-200 font-mono">₹{overallLikeStats.shivani.totalCost.toLocaleString('en-IN')}</b></span>
                      {overallLikeStats.shivani.pendingCost > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleSettleHandlerPayouts('Shivani', 'all')}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-[10px] font-semibold">✓ Paid in Full</span>
                      )}
                    </div>
                  </div>

                  {/* Others Card */}
                  <div className="p-3.5 rounded-xl bg-[#181d2c] border border-slate-700 flex flex-col justify-between gap-2.5 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">👤</span>
                        <div>
                          <span className="font-bold text-xs text-slate-300 block">Others / New Guy</span>
                          <span className="text-[11px] text-slate-400">
                            {overallLikeStats.others.postsCount} Posts ({overallLikeStats.others.paidPostsCount} Paid, {overallLikeStats.others.pendingPostsCount} Due)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {overallLikeStats.others.pendingCost > 0 ? (
                          <div>
                            <span className="font-extrabold text-base text-slate-200 font-mono block">
                              ₹{overallLikeStats.others.pendingCost.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Due to Pay</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-xs text-emerald-400 flex items-center justify-end gap-1">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>₹0 Due</span>
                            </span>
                            <span className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider">Settled</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Total Billed: <b className="text-slate-200 font-mono">₹{overallLikeStats.others.totalCost.toLocaleString('en-IN')}</b></span>
                      {overallLikeStats.others.pendingCost > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleSettleHandlerPayouts('Others', 'all')}
                          className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-[10px] font-semibold">✓ Paid in Full</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Clean Analytics Table */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#141824] shadow-sm">
                <div className="px-4 py-3 bg-[#10131d] border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-cyan-400" />
                    <h3 className="font-bold text-xs tracking-wider uppercase text-slate-200">
                      Monthly Analytics Breakdown
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Auto-computed totals
                  </span>
                </div>

                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#10131d] text-slate-400 font-semibold text-[11px] border-b border-slate-800">
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
                    <tbody className="divide-y divide-slate-800/80 font-medium">
                      {allMonthsSummary.map((m) => (
                        <tr key={m.month} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-100">
                            {m.monthName}
                          </td>
                          <td className="px-4 py-3 text-center text-slate-300">
                            {m.totalCollabs}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-cyan-400 font-mono">
                            ₹{m.totalRevenue.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-300 font-mono">
                            {m.totalSpend > 0 ? `₹${m.totalSpend.toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-cyan-300 font-mono">
                            ₹{m.totalProfit.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-emerald-400 font-mono">
                            ₹{(m.amountCollected || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {m.amountPending > 0 ? (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-semibold font-mono">
                                ₹{m.amountPending.toLocaleString('en-IN')}
                              </span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMonth(m.month);
                                setActiveView('month');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-300 text-[11px] font-semibold transition-all cursor-pointer"
                            >
                              Open CRM &rarr;
                            </button>
                          </td>
                        </tr>
                      ))}

                      {/* Total Summary Row */}
                      <tr className="bg-[#10131d] font-bold text-xs border-t-2 border-slate-700">
                        <td className="px-4 py-3 text-cyan-400">TOTAL</td>
                        <td className="px-4 py-3 text-center text-slate-200">{overallTotals.totalCollabs}</td>
                        <td className="px-4 py-3 text-right text-cyan-400 font-mono">₹{overallTotals.totalRevenue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-slate-300 font-mono">₹{overallTotals.totalSpend.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-cyan-300 font-mono">₹{overallTotals.totalProfit.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-emerald-400 font-mono">₹{overallTotals.amountCollected.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-right text-amber-400 font-mono">₹{overallTotals.amountPending.toLocaleString('en-IN')}</td>
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
              {/* Monthly KPI Cards (5 Sections - Clean Slate & Steel Cyan) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {/* 1. Revenue */}
                <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Revenue ({monthSummary.monthLabel})</span>
                  <p className="font-bold text-2xl text-cyan-400 mt-1 font-mono">
                    ₹{monthSummary.totalRevenue.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-slate-500">{monthSummary.totalCollabs} Deals Recorded</span>
                </div>

                {/* 2. Spend / Expenses */}
                <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Spend / Expenses</span>
                  <p className="font-bold text-2xl text-slate-300 mt-1 font-mono">
                    ₹{monthSummary.totalSpend.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-slate-500">Outsourced &amp; Production</span>
                </div>

                {/* 3. Net Profit (Hero) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/30 via-[#161c2c] to-[#121520] border border-cyan-500/35 shadow-sm">
                  <span className="text-xs font-bold text-cyan-300">Net Profit</span>
                  <p className="font-extrabold text-2xl text-cyan-300 mt-1 font-mono">
                    ₹{monthSummary.totalProfit.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-cyan-400/80 font-medium">
                    Margin: {monthSummary.totalRevenue > 0 ? Math.round((monthSummary.totalProfit / monthSummary.totalRevenue) * 100) : 0}%
                  </span>
                </div>

                {/* 4. Amount Collected */}
                <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 shadow-sm">
                  <span className="text-xs font-semibold text-slate-400">Amount Collected</span>
                  <p className="font-bold text-2xl text-emerald-400 mt-1 font-mono">
                    ₹{monthSummary.amountCollected.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-emerald-400/80 font-medium">
                    {monthSummary.paidCount} Deals Paid
                  </span>
                </div>

                {/* 5. Amount Need to be Collected */}
                <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 shadow-sm col-span-2 sm:col-span-1">
                  <span className="text-xs font-semibold text-slate-400">Amount to Collect</span>
                  <p className="font-bold text-2xl text-amber-400 mt-1 font-mono">
                    ₹{monthSummary.amountPending.toLocaleString('en-IN')}
                  </p>
                  <span className="text-[11px] text-amber-400/80 font-medium">
                    {monthSummary.pendingCount} Deals Pending
                  </span>
                </div>
              </div>

              {/* Likes & Engagement Handlers: Prince & Shivani Payout System */}
              <div className="p-4 rounded-2xl bg-[#141824] border border-slate-800 space-y-3.5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-sm font-bold shadow-xs">
                      👑
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-100 flex items-center gap-2">
                        <span>Likes &amp; Engagement Handlers ({monthSummary.monthLabel})</span>
                        {monthLikeStats.totalLikesPending > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold font-mono">
                            ₹{monthLikeStats.totalLikesPending.toLocaleString('en-IN')} Pending to Pay
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                            ✓ ₹0 Due (All Paid)
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {monthLikeStats.totalPostsWithLikes} Posts with Likes • Total Cost: <span className="text-slate-200 font-semibold font-mono">₹{monthLikeStats.totalLikesCost.toLocaleString('en-IN')}</span> • Paid: <span className="text-emerald-400 font-mono">₹{monthLikeStats.totalLikesPaid.toLocaleString('en-IN')}</span>
                      </p>
                    </div>
                  </div>

                  {/* 1-Click Settle All Likes (Prince + Shivani) */}
                  {monthLikeStats.totalLikesPending > 0 ? (
                    <button
                      type="button"
                      onClick={() => handleSettleHandlerPayouts('All', selectedMonth)}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-cyan-950/40 transition-all cursor-pointer self-start sm:self-auto"
                      title="1-Click: Mark all pending likes for Prince and Shivani as Paid (resets pending to ₹0)"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>⚡ Settle All Likes (₹{monthLikeStats.totalLikesPending.toLocaleString('en-IN')} &rarr; ₹0)</span>
                    </button>
                  ) : (
                    <div className="px-3 py-1 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>All Likes Paid (₹0 Pending)</span>
                    </div>
                  )}
                </div>

                {/* 3 Dedicated Handler Cards: Prince, Shivani, Others */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Prince Card */}
                  <div className="p-3.5 rounded-xl bg-[#181d2c] border border-cyan-500/30 flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">👑</span>
                        <div>
                          <span className="font-bold text-xs text-cyan-300 block">Prince</span>
                          <span className="text-[11px] text-slate-400">
                            {monthLikeStats.prince.postsCount} Posts ({monthLikeStats.prince.paidPostsCount} Paid, {monthLikeStats.prince.pendingPostsCount} Due)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {monthLikeStats.prince.pendingCost > 0 ? (
                          <div>
                            <span className="font-extrabold text-base text-cyan-300 font-mono block">
                              ₹{monthLikeStats.prince.pendingCost.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Pending</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-xs text-emerald-400 flex items-center justify-end gap-1">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>₹0 Due</span>
                            </span>
                            <span className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider">Settled</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Total: <b className="text-slate-200 font-mono">₹{monthLikeStats.prince.totalCost.toLocaleString('en-IN')}</b></span>
                      {monthLikeStats.prince.pendingCost > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleSettleHandlerPayouts('Prince', selectedMonth)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          title="Click to clear Prince pending likes to ₹0"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Pay Prince (₹{monthLikeStats.prince.pendingCost.toLocaleString('en-IN')})</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Paid &amp; Clear</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Shivani Card */}
                  <div className="p-3.5 rounded-xl bg-[#181d2c] border border-indigo-500/30 flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🌸</span>
                        <div>
                          <span className="font-bold text-xs text-indigo-300 block">Shivani</span>
                          <span className="text-[11px] text-slate-400">
                            {monthLikeStats.shivani.postsCount} Posts ({monthLikeStats.shivani.paidPostsCount} Paid, {monthLikeStats.shivani.pendingPostsCount} Due)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {monthLikeStats.shivani.pendingCost > 0 ? (
                          <div>
                            <span className="font-extrabold text-base text-indigo-300 font-mono block">
                              ₹{monthLikeStats.shivani.pendingCost.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Pending</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-xs text-emerald-400 flex items-center justify-end gap-1">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>₹0 Due</span>
                            </span>
                            <span className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider">Settled</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Total: <b className="text-slate-200 font-mono">₹{monthLikeStats.shivani.totalCost.toLocaleString('en-IN')}</b></span>
                      {monthLikeStats.shivani.pendingCost > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleSettleHandlerPayouts('Shivani', selectedMonth)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          title="Click to clear Shivani pending likes to ₹0"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Pay Shivani (₹{monthLikeStats.shivani.pendingCost.toLocaleString('en-IN')})</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Paid &amp; Clear</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Others Card */}
                  <div className="p-3.5 rounded-xl bg-[#181d2c] border border-slate-700 flex flex-col justify-between gap-3 shadow-xs">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">👤</span>
                        <div>
                          <span className="font-bold text-xs text-slate-200 block">Others / New</span>
                          <span className="text-[11px] text-slate-400">
                            {monthLikeStats.others.postsCount} Posts ({monthLikeStats.others.paidPostsCount} Paid, {monthLikeStats.others.pendingPostsCount} Due)
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {monthLikeStats.others.pendingCost > 0 ? (
                          <div>
                            <span className="font-extrabold text-base text-slate-200 font-mono block">
                              ₹{monthLikeStats.others.pendingCost.toLocaleString('en-IN')}
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Pending</span>
                          </div>
                        ) : (
                          <div>
                            <span className="font-bold text-xs text-emerald-400 flex items-center justify-end gap-1">
                              <Check className="w-3 h-3 stroke-[2.5]" />
                              <span>₹0 Due</span>
                            </span>
                            <span className="text-[10px] text-emerald-400/70 font-semibold uppercase tracking-wider">Settled</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Total: <b className="text-slate-200 font-mono">₹{monthLikeStats.others.totalCost.toLocaleString('en-IN')}</b></span>
                      {monthLikeStats.others.pendingCost > 0 ? (
                        <button
                          type="button"
                          onClick={() => handleSettleHandlerPayouts('Others', selectedMonth)}
                          className="px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                          title="Click to clear Others pending likes to ₹0"
                        >
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Pay Others (₹{monthLikeStats.others.pendingCost.toLocaleString('en-IN')})</span>
                        </button>
                      ) : (
                        <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[2.5]" />
                          <span>Paid &amp; Clear</span>
                        </span>
                      )}
                    </div>
                  </div>
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
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-800 bg-[#121520] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl border border-slate-800 bg-[#121520] text-xs text-slate-200 focus:outline-none cursor-pointer"
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
                    className="px-3 py-2 rounded-xl border border-slate-800 bg-[#121520] text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="all">All Handlers</option>
                    <option value="Prince">👑 Prince</option>
                    <option value="Shivani">🌸 Shivani</option>
                    <option value="Others">👤 Others / New</option>
                    <option value="None">No Likes Assigned</option>
                  </select>
                </div>
              </div>

              {/* Clean Brand Deals Table with Expandable Rows & Checkboxes */}
              <div className="rounded-2xl border border-slate-800 overflow-hidden bg-[#141824] shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#10131d] text-slate-400 font-semibold text-[11px] border-b border-slate-800">
                        <th className="w-10 px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={isAllFilteredSelected}
                            onChange={handleToggleSelectAll}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 cursor-pointer"
                            title="Select / Deselect all visible deals"
                          />
                        </th>
                        <th className="px-4 py-3">Brand &amp; Deliverable</th>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3 text-right">Pay Breakdown</th>
                        <th className="px-4 py-3 text-right">Total Fee</th>
                        <th className="px-4 py-3 text-right">Spend</th>
                        <th className="px-4 py-3 text-right">Net Profit</th>
                        <th className="px-4 py-3 text-center">Likes Handler &amp; Payout</th>
                        <th className="px-4 py-3 text-center">Payment Status</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-medium">
                      {filteredCollabs.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-xs text-slate-500">
                            No collaborations found matching the filters. Click <b className="text-cyan-400">Add Deal</b> to record a brand collaboration!
                          </td>
                        </tr>
                      ) : (
                        filteredCollabs.map((item) => {
                          const isPaid = item.status === 'Paid';
                          const totalAmt = (item.basePay || 0) + (item.bonus || 0) || item.amount || 0;
                          const net = totalAmt - (item.spending || 0);
                          const isExpanded = expandedRowId === item.id;
                          const isSelected = selectedCollabIds.includes(item.id);

                          const isPrince = item.likeHandler?.toLowerCase().includes('prince');
                          const isShivani = item.likeHandler?.toLowerCase().includes('shivani');
                          const hasOtherHandler = item.likeHandler && item.likeHandler.toLowerCase() !== 'none' && !isPrince && !isShivani;
                          const hasHandler = isPrince || isShivani || hasOtherHandler;
                          const isHandlerPaid = item.likePaymentStatus === 'Paid';
                          const itemLikeCost = item.likeCost !== undefined ? item.likeCost : (item.spending || 0);

                          return (
                            <React.Fragment key={item.id}>
                              <tr
                                className={`hover:bg-slate-800/40 transition-colors ${
                                  isSelected ? 'bg-cyan-950/20' : isExpanded ? 'bg-[#181d2c]' : ''
                                }`}
                              >
                                {/* Checkbox */}
                                <td className="px-3 py-3.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectRow(item.id)}
                                    className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 cursor-pointer"
                                  />
                                </td>

                                {/* Brand & Deliverable */}
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setExpandedRowId(isExpanded ? null : item.id)}
                                      className="text-slate-500 hover:text-slate-300 cursor-pointer"
                                      title="Toggle details"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-slate-100 text-sm">
                                          {item.brandName}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                          {item.deliverableType || 'Post'}
                                          {item.deliverableQty && item.deliverableQty !== 'Single' ? ` (${item.deliverableQty})` : ''}
                                        </span>
                                      </div>
                                      {item.campaign && (
                                        <p className="text-[11px] text-slate-400 font-normal">
                                          {item.campaign}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Date */}
                                <td className="px-4 py-3.5 text-xs text-slate-300 font-mono">
                                  {item.scheduledDate || '-'}
                                </td>

                                {/* Pay Breakdown */}
                                <td className="px-4 py-3.5 text-right text-xs">
                                  {item.bonus > 0 ? (
                                    <div className="space-y-0.5">
                                      <span className="text-slate-200 font-medium">₹{item.basePay.toLocaleString('en-IN')}</span>
                                      <span className="block text-[10px] text-cyan-400">+₹{item.bonus.toLocaleString('en-IN')} bonus</span>
                                    </div>
                                  ) : (
                                    <span className="text-slate-300 font-mono">₹{(item.basePay || item.amount).toLocaleString('en-IN')}</span>
                                  )}
                                </td>

                                {/* Total Amount */}
                                <td className="px-4 py-3.5 font-bold text-right text-sm text-cyan-400 font-mono">
                                  ₹{totalAmt.toLocaleString('en-IN')}
                                </td>

                                {/* Spend */}
                                <td className="px-4 py-3.5 text-right text-xs text-slate-300 font-mono">
                                  {item.spending ? `₹${item.spending.toLocaleString('en-IN')}` : '-'}
                                </td>

                                {/* Net Profit */}
                                <td className="px-4 py-3.5 font-bold text-right text-sm text-cyan-300 font-mono">
                                  ₹{net.toLocaleString('en-IN')}
                                </td>

                                {/* Likes Handler & Payout (1-Click Payout Toggle) */}
                                <td className="px-4 py-3.5 text-center">
                                  {hasHandler ? (
                                    <div className="flex flex-col items-center gap-1">
                                      {/* Handler Tag */}
                                      {isPrince ? (
                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 inline-flex items-center gap-1 shadow-xs">
                                          👑 Prince
                                        </span>
                                      ) : isShivani ? (
                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 inline-flex items-center gap-1 shadow-xs">
                                          🌸 Shivani
                                        </span>
                                      ) : (
                                        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 inline-flex items-center gap-1 shadow-xs">
                                          👤 {item.likeHandler}
                                        </span>
                                      )}

                                      {/* 1-Tap Payout Toggle Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleToggleLikePaymentStatus(item)}
                                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                                          isHandlerPaid
                                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                                            : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                                        }`}
                                        title="Click to toggle handler payout (Paid / Due)"
                                      >
                                        {isHandlerPaid ? (
                                          <>
                                            <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                                            <span>Paid ₹{itemLikeCost.toLocaleString('en-IN')}</span>
                                          </>
                                        ) : (
                                          <>
                                            <Clock className="w-2.5 h-2.5" />
                                            <span className="font-bold">Due: ₹{itemLikeCost.toLocaleString('en-IN')}</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 text-xs">-</span>
                                  )}
                                </td>

                                {/* Payment Status (1-Click Toggle) */}
                                <td className="px-4 py-3.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePaymentStatus(item)}
                                    className={`px-2.5 py-1 rounded-full text-[11px] font-semibold inline-flex items-center gap-1 transition-all cursor-pointer shadow-xs ${
                                      isPaid
                                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
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
                                        className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                                        title="View Post"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEdit(item)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800 transition-colors cursor-pointer"
                                      title="Edit"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteCollab(item.id)}
                                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                                      title="Delete"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>

                              {/* Expandable Details Drawer */}
                              {isExpanded && (
                                <tr className="bg-[#121622] border-b border-slate-800">
                                  <td colSpan={10} className="px-6 py-3.5 text-xs">
                                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-4 text-[11px]">
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">Likes Handler</span>
                                        <span className="font-bold text-cyan-300">
                                          {item.likeHandler || 'None'} {item.likeCost ? `(₹${item.likeCost})` : ''}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">Handler Payout</span>
                                        {hasHandler ? (
                                          <button
                                            type="button"
                                            onClick={() => handleToggleLikePaymentStatus(item)}
                                            className={`px-2 py-0.5 rounded-md font-semibold text-[10px] inline-flex items-center gap-1 cursor-pointer transition-all ${
                                              isHandlerPaid
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                            }`}
                                            title="Click to toggle"
                                          >
                                            {isHandlerPaid ? '✅ Paid (Clear)' : '⏳ Due (To Pay)'}
                                          </button>
                                        ) : (
                                          <span className="text-slate-500">-</span>
                                        )}
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">Invoice Sent</span>
                                        <span className="font-semibold text-slate-200">
                                          {item.invoiceSent || 'No'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">Payment Date</span>
                                        <span className="font-semibold text-slate-200 font-mono">
                                          {item.paymentReceivedDate || '-'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">Payment Mode</span>
                                        <span className="font-semibold text-slate-200">
                                          {item.paymentMode || 'UPI'}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 block mb-0.5">Work Status</span>
                                        <span className="font-semibold text-slate-200">
                                          {item.workStatus || 'Completed'}
                                        </span>
                                      </div>
                                    </div>
                                    {item.notes && (
                                      <div className="mt-2.5 pt-2.5 border-t border-slate-800">
                                        <span className="text-slate-500 block text-[10px] mb-0.5 font-medium">Notes &amp; Requirements</span>
                                        <p className="text-slate-300">{item.notes}</p>
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

              {/* Sticky Batch Multi-Select Action Bar */}
              {selectedCollabIds.length > 0 && (
                <div className="sticky bottom-2 z-30 p-3 rounded-2xl bg-[#141928] border border-cyan-500/40 shadow-2xl shadow-slate-950/90 flex flex-wrap items-center justify-between gap-2.5 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs text-slate-200">
                    <span className="px-2.5 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs shadow-xs">
                      {selectedCollabIds.length} Selected
                    </span>
                    <span className="text-slate-300 font-medium hidden sm:inline">Batch Actions:</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleSettleSelectedCollabs('likes')}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-cyan-950/40 transition-all cursor-pointer"
                      title="Settle like handler payouts to ₹0 for selected"
                    >
                      <Zap className="w-3.5 h-3.5 fill-current" />
                      <span>⚡ Settle Likes (Selected &rarr; ₹0)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSettleSelectedCollabs('likes')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Settle Likes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSettleSelectedCollabs('deals')}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Deals Paid</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteSelected}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedCollabIds([])}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs transition-colors cursor-pointer"
                    >
                      Deselect
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Clean Add / Edit Modal (Modern Minimal Slate & Deep Cyan) */}
        {isFormOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-fadeIn">
            <div className="bg-[#141824] text-slate-100 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl shadow-slate-950/90 p-5 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <h3 className="font-bold text-base text-slate-100">
                  {editingItem ? 'Edit Collaboration Deal' : 'Add New Brand Deal'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCollab} className="space-y-3.5 text-xs font-medium">
                {/* Brand & Campaign */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">
                      Brand Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formBrand}
                      onChange={(e) => setFormBrand(e.target.value)}
                      placeholder="e.g. Morphic, Matiks..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0f1117] text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">
                      Campaign / Topic (Optional)
                    </label>
                    <input
                      type="text"
                      value={formCampaign}
                      onChange={(e) => setFormCampaign(e.target.value)}
                      placeholder="e.g. AI Carousel, Launch..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0f1117] text-slate-100 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Deliverable & Collab Type */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">
                      Deliverable Format
                    </label>
                    <select
                      value={formDeliverableType}
                      onChange={(e) => setFormDeliverableType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0f1117] text-slate-100 focus:outline-none"
                    >
                      {DELIVERABLE_TYPES.map((d) => (
                        <option key={d} value={d} className="bg-[#0f1117] text-slate-100">{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">
                      Collab Type
                    </label>
                    <select
                      value={formCollabType}
                      onChange={(e) => setFormCollabType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0f1117] text-slate-100 focus:outline-none"
                    >
                      {COLLAB_TYPES.map((t) => (
                        <option key={t} value={t} className="bg-[#0f1117] text-slate-100">{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Date & Invoice */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-300 font-medium">
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
                        className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-cyan-300 border border-cyan-500/20 hover:bg-slate-700 transition-colors cursor-pointer"
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0f1117] text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">
                      Invoice Sent
                    </label>
                    <select
                      value={formInvoiceSent}
                      onChange={(e) => setFormInvoiceSent(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0f1117] text-slate-100 focus:outline-none"
                    >
                      <option value="No" className="bg-[#0f1117]">No</option>
                      <option value="Yes" className="bg-[#0f1117]">Yes</option>
                      <option value="Pending" className="bg-[#0f1117]">Pending</option>
                    </select>
                  </div>
                </div>

                {/* Likes & Engagement Management (Prince / Shivani / Others) */}
                <div className="p-3.5 bg-[#0f1117] rounded-2xl border border-slate-700 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-bold text-cyan-300">
                      <Heart className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
                      <span>Post Likes &amp; Engagement Handler</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal">
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
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                              : 'bg-[#141824] text-slate-300 border-slate-700 hover:bg-slate-800'
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
                      <label className="block text-[10px] text-slate-400 mb-1">
                        Handler Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formCustomHandlerName}
                        onChange={(e) => setFormCustomHandlerName(e.target.value)}
                        placeholder="e.g. Rahul, Akash, Aman..."
                        className="w-full px-3 py-1.5 rounded-xl border border-slate-700 bg-[#141824] text-slate-100 text-xs focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  )}

                  {/* Likes Management Cost / Payout & Payout Status */}
                  {formLikeHandlerType !== 'None' && (
                    <div className="pt-1 space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] text-slate-300 font-medium">
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
                                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
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
                          className="w-full px-2.5 py-1.5 rounded-xl border border-slate-700 bg-[#141824] font-mono text-xs text-cyan-300 focus:outline-none"
                        />
                      </div>

                      {/* Handler Payout Status: Paid vs Pending */}
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-1 font-medium">
                          Handler Payout Status
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormLikePaymentStatus('Pending')}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                              formLikePaymentStatus === 'Pending'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400 shadow-xs'
                                : 'bg-[#141824] text-slate-400 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>⏳ Pending (To Pay)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormLikePaymentStatus('Paid')}
                            className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 ${
                              formLikePaymentStatus === 'Paid'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-xs'
                                : 'bg-[#141824] text-slate-400 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>✅ Paid (Settled)</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Financials: Base Pay, Bonus, Spend */}
                <div className="p-3.5 bg-[#0f1117] rounded-2xl border border-slate-700 space-y-2">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                        Base Pay (₹)
                      </label>
                      <input
                        type="number"
                        value={formBasePay}
                        onChange={(e) => setFormBasePay(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#141824] font-mono text-xs text-slate-100 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                        Bonus (₹)
                      </label>
                      <input
                        type="number"
                        value={formBonus}
                        onChange={(e) => setFormBonus(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#141824] font-mono text-xs text-cyan-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1 font-medium">
                        Spend (₹)
                      </label>
                      <input
                        type="number"
                        value={formSpending}
                        onChange={(e) => setFormSpending(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-700 bg-[#141824] font-mono text-xs text-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1.5 text-slate-400 border-t border-slate-800">
                    <span>Total Fee: <b className="text-cyan-400 font-mono">₹{(Number(formBasePay || 0) + Number(formBonus || 0)).toLocaleString('en-IN')}</b></span>
                    <span>Net Profit: <b className="text-cyan-300 font-mono font-bold">₹{(Number(formBasePay || 0) + Number(formBonus || 0) - Number(formSpending || 0)).toLocaleString('en-IN')}</b></span>
                  </div>
                </div>

                {/* Status, Payment Date, Payment Mode */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">
                      Payment Status
                    </label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className={`w-full px-2.5 py-2 rounded-xl border font-bold text-xs focus:outline-none transition-colors ${
                        formStatus === 'Paid'
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                          : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                      }`}
                    >
                      <option value="Pending" className="bg-[#0f1117] text-amber-300">⏳ Pending (No)</option>
                      <option value="Paid" className="bg-[#0f1117] text-emerald-300">✅ Paid</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-slate-300 font-medium">
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
                        className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-cyan-300 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
                        title="Set to 15 days after post date"
                      >
                        +15d
                      </button>
                    </div>
                    <input
                      type="date"
                      value={formPaymentDate}
                      onChange={(e) => setFormPaymentDate(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-700 bg-[#0f1117] text-slate-100 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 mb-1 font-medium">
                      Payment Mode
                    </label>
                    <select
                      value={formPaymentMode}
                      onChange={(e) => setFormPaymentMode(e.target.value as any)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-700 bg-[#0f1117] text-slate-100 focus:outline-none"
                    >
                      {PAYMENT_MODES.map((m) => (
                        <option key={m} value={m} className="bg-[#0f1117]">{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Content Link */}
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    LinkedIn Post URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={formPostUrl}
                    onChange={(e) => setFormPostUrl(e.target.value)}
                    placeholder="https://linkedin.com/posts/..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0f1117] text-slate-100 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">
                    Notes &amp; Requirements
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Deliverable details, instructions..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-700 bg-[#0f1117] text-slate-100 focus:outline-none focus:border-cyan-400 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-sm shadow-cyan-950/40"
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
