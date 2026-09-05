export type CollabType =
  | 'Fixed'
  | 'Bonus'
  | 'Performance'
  | 'Barter'
  | 'Retainer'
  | 'Other';

export type DeliverableType =
  | 'Carousel'
  | 'Single Post'
  | 'Repost'
  | 'Video / Reel'
  | 'Newsletter'
  | 'Bundle'
  | 'Other';

export type PaymentStatus = 'Paid' | 'Pending' | 'Invoiced' | 'Cancelled';
export type InvoiceStatus = 'Yes' | 'No' | 'Pending';
export type WorkStatus = 'Completed' | 'In Progress' | 'Scheduled' | 'Draft';
export type PaymentMode = 'UPI' | 'Bank Transfer' | 'Stripe' | 'PayPal' | 'Other';
export type Currency = 'INR' | 'USD';

export interface CollabItem {
  id: string;
  month: string; // "YYYY-MM", e.g., "2026-07"
  brandName: string;
  campaign?: string;
  collabType: CollabType;
  deliverableType: DeliverableType;
  deliverableQty?: string; // e.g., "Single", "2"
  scheduledDate: string; // "YYYY-MM-DD" or "DD-MM-YYYY"
  basePay: number;
  bonus: number;
  amount: number; // Total Amount = basePay + bonus
  spending: number; // Spend
  netProfit: number; // amount - spending
  invoiceSent: InvoiceStatus;
  status: PaymentStatus;
  paymentReceivedDate?: string; // "YYYY-MM-DD" or "DD-MM-YYYY"
  paymentMode?: PaymentMode;
  workStatus: WorkStatus;
  postUrl?: string;
  notes?: string;
  currency: Currency;
  createdAt: string;
  updatedAt: string;
}

export interface CollabMonthSummary {
  month: string; // "YYYY-MM" or "July"
  monthName: string; // e.g. "July", "August"
  monthLabel: string; // "July 2026"
  totalCollabs: number;
  totalRevenue: number;
  totalSpend: number;
  totalProfit: number;
  pendingCount: number;
  avgDealSize: number;
  currency: Currency;
}

export interface GoogleSheetSyncConfig {
  webhookUrl: string;
  sheetName?: string;
  lastSyncedAt?: string;
  autoSync: boolean;
}
