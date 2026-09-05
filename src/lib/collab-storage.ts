import { CollabItem, CollabMonthSummary, GoogleSheetSyncConfig } from './collab-types';

const COLLABS_STORAGE_KEY = 'kamal_linkedin_collabs_v2';
const SYNC_CONFIG_STORAGE_KEY = 'kamal_collab_sync_config_v1';

export const INITIAL_COLLABS: CollabItem[] = [
  // --- July 2026 ---
  {
    id: 'collab_july_1',
    month: '2026-07',
    brandName: 'Morphic',
    campaign: 'AI Carousal',
    collabType: 'Fixed',
    deliverableType: 'Carousel',
    deliverableQty: 'Single',
    scheduledDate: '2026-06-27',
    basePay: 2000,
    bonus: 0,
    amount: 2000,
    spending: 300,
    netProfit: 1700,
    invoiceSent: 'No',
    status: 'Paid',
    paymentReceivedDate: '2026-07-17',
    paymentMode: 'Bank Transfer',
    workStatus: 'Completed',
    postUrl: 'https://www.linkedin.com/posts/kamalsharma',
    notes: 'AI Carousel intro + feature breakdown',
    currency: 'INR',
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-17T00:00:00.000Z',
  },
  {
    id: 'collab_july_2',
    month: '2026-07',
    brandName: 'Matiks',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-07-11',
    basePay: 7000,
    bonus: 6000,
    amount: 13000,
    spending: 0,
    netProfit: 13000,
    invoiceSent: 'Yes',
    status: 'Paid',
    paymentReceivedDate: '2026-07-11',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-07-05T00:00:00.000Z',
    updatedAt: '2026-07-11T00:00:00.000Z',
  },
  {
    id: 'collab_july_3',
    month: '2026-07',
    brandName: 'Igate',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-07-13',
    basePay: 1500,
    bonus: 0,
    amount: 1500,
    spending: 300,
    netProfit: 1200,
    invoiceSent: 'Yes',
    status: 'Paid',
    paymentReceivedDate: '2026-07-22',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-07-10T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
  },
  {
    id: 'collab_july_4',
    month: '2026-07',
    brandName: 'Smart Skale',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Carousel',
    deliverableQty: '2',
    scheduledDate: '2026-07-17',
    basePay: 1200,
    bonus: 0,
    amount: 1200,
    spending: 0,
    netProfit: 1200,
    invoiceSent: 'Yes',
    status: 'Paid',
    paymentReceivedDate: '2026-07-22',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-07-15T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
  },
  {
    id: 'collab_july_5',
    month: '2026-07',
    brandName: 'Matiks',
    campaign: '',
    collabType: 'Bonus',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-07-18',
    basePay: 0,
    bonus: 6000,
    amount: 6000,
    spending: 0,
    netProfit: 6000,
    invoiceSent: 'Yes',
    status: 'Paid',
    paymentReceivedDate: '2026-07-18',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-07-18T00:00:00.000Z',
    updatedAt: '2026-07-18T00:00:00.000Z',
  },
  {
    id: 'collab_july_6',
    month: '2026-07',
    brandName: 'Artha',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Carousel',
    deliverableQty: 'Single',
    scheduledDate: '2026-07-31',
    basePay: 13400,
    bonus: 0,
    amount: 13400,
    spending: 0,
    netProfit: 13400,
    invoiceSent: 'Yes',
    status: 'Paid',
    paymentReceivedDate: '2026-07-31',
    paymentMode: 'Bank Transfer',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-07-20T00:00:00.000Z',
    updatedAt: '2026-07-31T00:00:00.000Z',
  },
  {
    id: 'collab_july_7',
    month: '2026-07',
    brandName: 'Gooseworks',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Carousel',
    deliverableQty: 'Single',
    scheduledDate: '2026-07-22',
    basePay: 4940,
    bonus: 0,
    amount: 4940,
    spending: 600,
    netProfit: 4340,
    invoiceSent: 'Yes',
    status: 'Paid',
    paymentReceivedDate: '2026-07-22',
    paymentMode: 'Bank Transfer',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-07-20T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
  },
  {
    id: 'collab_july_8',
    month: '2026-07',
    brandName: 'Igate',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-07-23',
    basePay: 1500,
    bonus: 0,
    amount: 1500,
    spending: 300,
    netProfit: 1200,
    invoiceSent: 'Yes',
    status: 'Paid',
    paymentReceivedDate: '2026-07-23',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-07-20T00:00:00.000Z',
    updatedAt: '2026-07-23T00:00:00.000Z',
  },
  {
    id: 'collab_july_9',
    month: '2026-07',
    brandName: 'Matiks',
    campaign: '',
    collabType: 'Bonus',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-07-25',
    basePay: 0,
    bonus: 6000,
    amount: 6000,
    spending: 0,
    netProfit: 6000,
    invoiceSent: 'Yes',
    status: 'Paid',
    paymentReceivedDate: '2026-07-25',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-07-25T00:00:00.000Z',
    updatedAt: '2026-07-25T00:00:00.000Z',
  },
  {
    id: 'collab_july_10',
    month: '2026-07',
    brandName: 'SMFG',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Repost',
    deliverableQty: 'Single',
    scheduledDate: '2026-07-25',
    basePay: 1800,
    bonus: 0,
    amount: 1800,
    spending: 250,
    netProfit: 1550,
    invoiceSent: 'Yes',
    status: 'Pending',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-07-25T00:00:00.000Z',
    updatedAt: '2026-07-25T00:00:00.000Z',
  },
  {
    id: 'collab_july_11',
    month: '2026-07',
    brandName: 'Anna',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-07-29',
    basePay: 1500,
    bonus: 0,
    amount: 1500,
    spending: 100,
    netProfit: 1400,
    invoiceSent: 'Yes',
    status: 'Pending',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-07-28T00:00:00.000Z',
    updatedAt: '2026-07-28T00:00:00.000Z',
  },

  // --- August 2026 ---
  {
    id: 'collab_aug_1',
    month: '2026-08',
    brandName: 'Matiks',
    campaign: '',
    collabType: 'Bonus',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-08-01',
    basePay: 0,
    bonus: 3000,
    amount: 3000,
    spending: 0,
    netProfit: 3000,
    invoiceSent: 'Yes',
    status: 'Paid',
    paymentReceivedDate: '2026-08-01',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'collab_aug_2',
    month: '2026-08',
    brandName: 'Noise AI',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-08-05',
    basePay: 6500,
    bonus: 0,
    amount: 6500,
    spending: 350,
    netProfit: 6150,
    invoiceSent: 'Yes',
    status: 'Paid',
    paymentReceivedDate: '2026-08-05',
    paymentMode: 'Bank Transfer',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-08-04T00:00:00.000Z',
    updatedAt: '2026-08-05T00:00:00.000Z',
  },
  {
    id: 'collab_aug_3',
    month: '2026-08',
    brandName: 'SimpleURL',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-08-07',
    basePay: 2500,
    bonus: 0,
    amount: 2500,
    spending: 0,
    netProfit: 2500,
    invoiceSent: 'Yes',
    status: 'Pending',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-08-05T00:00:00.000Z',
    updatedAt: '2026-08-07T00:00:00.000Z',
  },
  {
    id: 'collab_aug_4',
    month: '2026-08',
    brandName: 'SMFG',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Repost',
    deliverableQty: 'Single',
    scheduledDate: '2026-08-15',
    basePay: 3000,
    bonus: 0,
    amount: 3000,
    spending: 300,
    netProfit: 2700,
    invoiceSent: 'Yes',
    status: 'Pending',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-08-12T00:00:00.000Z',
    updatedAt: '2026-08-15T00:00:00.000Z',
  },
  {
    id: 'collab_aug_5',
    month: '2026-08',
    brandName: 'SimpleURL',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-08-20',
    basePay: 2500,
    bonus: 0,
    amount: 2500,
    spending: 290,
    netProfit: 2210,
    invoiceSent: 'Yes',
    status: 'Pending',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-08-18T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
  },
  {
    id: 'collab_aug_6',
    month: '2026-08',
    brandName: 'IGP',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-08-20',
    basePay: 3500,
    bonus: 0,
    amount: 3500,
    spending: 460,
    netProfit: 3040,
    invoiceSent: 'Yes',
    status: 'Paid',
    paymentReceivedDate: '2026-08-20',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-08-19T00:00:00.000Z',
    updatedAt: '2026-08-20T00:00:00.000Z',
  },
  {
    id: 'collab_aug_7',
    month: '2026-08',
    brandName: 'Artha',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-08-31',
    basePay: 13000,
    bonus: 0,
    amount: 13000,
    spending: 0,
    netProfit: 13000,
    invoiceSent: 'Yes',
    status: 'Pending',
    paymentMode: 'Bank Transfer',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-08-25T00:00:00.000Z',
    updatedAt: '2026-08-31T00:00:00.000Z',
  },

  // --- September 2026 ---
  {
    id: 'collab_sep_1',
    month: '2026-09',
    brandName: 'Noise AI',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-09-04',
    basePay: 1000,
    bonus: 0,
    amount: 1000,
    spending: 60,
    netProfit: 940,
    invoiceSent: 'Yes',
    status: 'Paid',
    paymentReceivedDate: '2026-09-04',
    paymentMode: 'UPI',
    workStatus: 'Completed',
    currency: 'INR',
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-04T00:00:00.000Z',
  },
  {
    id: 'collab_sep_2',
    month: '2026-09',
    brandName: 'SimpleURL',
    campaign: '',
    collabType: 'Fixed',
    deliverableType: 'Single Post',
    deliverableQty: 'Single',
    scheduledDate: '2026-09-07',
    basePay: 2500,
    bonus: 0,
    amount: 2500,
    spending: 0,
    netProfit: 2500,
    invoiceSent: 'Yes',
    status: 'Pending',
    paymentMode: 'UPI',
    workStatus: 'Scheduled',
    currency: 'INR',
    createdAt: '2026-09-02T00:00:00.000Z',
    updatedAt: '2026-09-02T00:00:00.000Z',
  },
];

export function getSavedCollabs(): CollabItem[] {
  if (typeof window === 'undefined') return INITIAL_COLLABS;
  try {
    const raw = localStorage.getItem(COLLABS_STORAGE_KEY);
    if (!raw) {
      saveCollabs(INITIAL_COLLABS);
      return INITIAL_COLLABS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_COLLABS;
  } catch {
    return INITIAL_COLLABS;
  }
}

export function saveCollabs(items: CollabItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(COLLABS_STORAGE_KEY, JSON.stringify(items));
  } catch (err) {
    console.error('Failed to save collabs to localStorage:', err);
  }
}

export function getSyncConfig(): GoogleSheetSyncConfig {
  if (typeof window === 'undefined') {
    return { webhookUrl: '', autoSync: false };
  }
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_STORAGE_KEY);
    if (!raw) return { webhookUrl: '', autoSync: false };
    return JSON.parse(raw);
  } catch {
    return { webhookUrl: '', autoSync: false };
  }
}

export function saveSyncConfig(config: GoogleSheetSyncConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SYNC_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save sync config:', err);
  }
}

export function formatMonthLabel(monthKey: string): string {
  if (!monthKey || monthKey === 'all') return 'All Time';
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export function getMonthName(monthKey: string): string {
  if (!monthKey || monthKey === 'all') return 'All';
  const [year, month] = monthKey.split('-');
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long' });
}

export function getUniqueMonths(items: CollabItem[]): string[] {
  const months = new Set<string>();
  const currentMonth = '2026-09';
  months.add(currentMonth);

  for (const item of items) {
    if (item.month) months.add(item.month);
  }

  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

export function calculateMonthSummary(items: CollabItem[], monthFilter: string): CollabMonthSummary {
  const filtered = monthFilter === 'all' ? items : items.filter((i) => i.month === monthFilter);

  let totalRevenue = 0;
  let totalSpend = 0;
  let pendingCount = 0;

  for (const item of filtered) {
    if (item.status !== 'Cancelled') {
      const itemAmount = (item.basePay || 0) + (item.bonus || 0) || item.amount || 0;
      totalRevenue += itemAmount;
      totalSpend += item.spending || 0;

      if (item.status === 'Pending' || item.status === 'Invoiced') {
        pendingCount += 1;
      }
    }
  }

  const totalProfit = totalRevenue - totalSpend;
  const avgDealSize = filtered.length > 0 ? totalRevenue / filtered.length : 0;

  return {
    month: monthFilter,
    monthName: getMonthName(monthFilter),
    monthLabel: formatMonthLabel(monthFilter),
    totalCollabs: filtered.length,
    totalRevenue,
    totalSpend,
    totalProfit,
    pendingCount,
    avgDealSize,
    currency: 'INR',
  };
}

export function calculateAllMonthsSummary(items: CollabItem[]): CollabMonthSummary[] {
  const months = getUniqueMonths(items).filter((m) => m !== 'all').sort();
  return months.map((m) => calculateMonthSummary(items, m));
}

