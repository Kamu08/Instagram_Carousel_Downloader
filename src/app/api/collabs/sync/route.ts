import { NextRequest, NextResponse } from 'next/server';
import { CollabItem } from '@/lib/collab-types';

export async function POST(req: NextRequest) {
  try {
    const { webhookUrl, collabs, monthFilter } = await req.json();

    if (!webhookUrl || typeof webhookUrl !== 'string' || !webhookUrl.startsWith('http')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a valid Google Apps Script Webhook URL in Collab Sync Settings.',
        },
        { status: 400 }
      );
    }

    const items: CollabItem[] = Array.isArray(collabs) ? collabs : [];

    // Group collabs by month
    const monthsMap: { [monthKey: string]: CollabItem[] } = {};
    for (const item of items) {
      const m = item.month || 'Other';
      if (!monthsMap[m]) monthsMap[m] = [];
      monthsMap[m].push(item);
    }

    // Compute monthly analytics summary
    const monthlyAnalytics = Object.keys(monthsMap).sort().map((mKey) => {
      const mItems = monthsMap[mKey];
      const revenue = mItems.reduce((sum, c) => sum + (c.amount || (c.basePay || 0) + (c.bonus || 0)), 0);
      const spend = mItems.reduce((sum, c) => sum + (c.spending || 0), 0);
      const profit = revenue - spend;
      const pendingCount = mItems.filter((c) => c.status === 'Pending' || c.status === 'Invoiced').length;
      const avgDealSize = mItems.length > 0 ? revenue / mItems.length : 0;
      
      const [year, monthNum] = mKey.split('-');
      const monthName = year && monthNum 
        ? new Date(Number(year), Number(monthNum) - 1, 1).toLocaleDateString('en-US', { month: 'long' })
        : mKey;

      return {
        monthKey: mKey,
        monthName,
        collaborations: mItems.length,
        revenue,
        spend,
        profit,
        pending: pendingCount,
        avgDealSize,
      };
    });

    // Send payload to Google Apps Script Webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      redirect: 'follow',
      body: JSON.stringify({
        action: 'sync_collabs',
        timestamp: new Date().toISOString(),
        monthFilter: monthFilter || 'all',
        totalItems: items.length,
        monthlyAnalytics,
        collabs: items.map((c) => ({
          ID: c.id,
          MonthKey: c.month,
          Brand: c.brandName,
          Campaign: c.campaign || '',
          CollaborationType: c.collabType || 'Fixed',
          DeliverableType: c.deliverableType || 'Single Post',
          Deliverable: c.deliverableQty || 'Single',
          PostedDate: c.scheduledDate || '',
          BasePay: c.basePay || 0,
          Bonus: c.bonus || 0,
          TotalAmount: (c.basePay || 0) + (c.bonus || 0) || c.amount || 0,
          Spend: c.spending || 0,
          NetProfit: ((c.basePay || 0) + (c.bonus || 0) || c.amount || 0) - (c.spending || 0),
          InvoiceSent: c.invoiceSent || 'Yes',
          PaymentStatus: c.status || 'Pending',
          PaymentDate: c.paymentReceivedDate || '',
          Status: c.workStatus || 'Completed',
          ContentLink: c.postUrl || '',
          Notes: c.notes || '',
          LastUpdated: c.updatedAt || new Date().toISOString(),
        })),
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        {
          success: false,
          error: `Google Sheet Webhook returned status ${response.status}: ${errText.slice(0, 150)}`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      syncedCount: items.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Google Sheet Sync Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to sync with Google Sheet.',
      },
      { status: 500 }
    );
  }
}
