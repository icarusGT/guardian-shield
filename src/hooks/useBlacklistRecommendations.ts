import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BlacklistRecommendation {
  recipientAccount: string;
  complaintCount: number;
  totalReportedAmount: number;
  confirmedFraudCases: number;
  reasons: string[];
  isAlreadyBlacklisted: boolean;
}

interface Thresholds {
  minComplaints: number;
  highAmountThreshold: number;
}

const DEFAULT_THRESHOLDS: Thresholds = {
  minComplaints: 3,
  highAmountThreshold: 500000,
};

export function getStoredThresholds(): Thresholds {
  try {
    const stored = localStorage.getItem('blacklist_thresholds');
    if (stored) return { ...DEFAULT_THRESHOLDS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_THRESHOLDS;
}

export function setStoredThresholds(t: Thresholds) {
  localStorage.setItem('blacklist_thresholds', JSON.stringify(t));
}

/**
 * Evaluate a single recipient against blacklist recommendation rules.
 */
export function useBlacklistRecommendation(recipientAccount: string | null | undefined) {
  const [recommendation, setRecommendation] = useState<BlacklistRecommendation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!recipientAccount) {
      setRecommendation(null);
      return;
    }
    evaluate(recipientAccount);
  }, [recipientAccount]);

  const evaluate = async (recipient: string) => {
    setLoading(true);
    const thresholds = getStoredThresholds();

    // 1. Count distinct customers who reported this recipient
    const { data: txnData } = await supabase
      .from('transactions')
      .select('customer_id, txn_amount')
      .eq('recipient_account', recipient);

    const uniqueCustomers = new Set(txnData?.map(t => t.customer_id) || []);
    const complaintCount = uniqueCustomers.size;
    const totalAmount = txnData?.reduce((sum, t) => sum + Number(t.txn_amount), 0) || 0;

    // 2. Check confirmed fraud cases linked to this recipient's transactions
    const txnIds = txnData?.map(t => t.customer_id) || [];
    // Get case_transactions for these transactions
    const { data: ctData } = await supabase
      .from('transactions')
      .select('txn_id')
      .eq('recipient_account', recipient);
    
    let confirmedFraudCount = 0;
    if (ctData && ctData.length > 0) {
      const tIds = ctData.map(t => t.txn_id);
      const { data: caseTxns } = await supabase
        .from('case_transactions')
        .select('case_id')
        .in('txn_id', tIds);
      
      if (caseTxns && caseTxns.length > 0) {
        const caseIds = [...new Set(caseTxns.map(ct => ct.case_id))];
        const { data: decisions } = await supabase
          .from('case_decisions')
          .select('case_id, category')
          .in('case_id', caseIds)
          .eq('category', 'FRAUD_CONFIRMED');
        confirmedFraudCount = decisions?.length || 0;
      }
    }

    // 3. Check if already blacklisted
    const { data: blData } = await supabase
      .from('blacklisted_recipients')
      .select('id')
      .eq('recipient_value', recipient)
      .maybeSingle();

    // Build reasons
    const reasons: string[] = [];
    if (complaintCount >= thresholds.minComplaints) {
      reasons.push(`High Complaint Risk (${complaintCount} complaints from different users)`);
    }
    if (totalAmount >= thresholds.highAmountThreshold) {
      reasons.push(`High Financial Risk (৳${totalAmount.toLocaleString()} BDT total reported)`);
    }
    if (confirmedFraudCount > 0) {
      reasons.push(`Confirmed Fraud Signal (${confirmedFraudCount} confirmed fraud case${confirmedFraudCount > 1 ? 's' : ''})`);
    }

    if (reasons.length > 0) {
      setRecommendation({
        recipientAccount: recipient,
        complaintCount,
        totalReportedAmount: totalAmount,
        confirmedFraudCases: confirmedFraudCount,
        reasons,
        isAlreadyBlacklisted: !!blData,
      });
    } else {
      setRecommendation(null);
    }
    setLoading(false);
  };

  const refresh = () => {
    if (recipientAccount) evaluate(recipientAccount);
  };

  return { recommendation, loading, refresh };
}

/**
 * Fetch all recipients that meet blacklist criteria (for the Blacklist page).
 */
export function useAllBlacklistRecommendations() {
  const [recommendations, setRecommendations] = useState<BlacklistRecommendation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    const thresholds = getStoredThresholds();

    // Get all transactions grouped by recipient_account
    const { data: txnData } = await supabase
      .from('transactions')
      .select('txn_id, customer_id, txn_amount, recipient_account')
      .not('recipient_account', 'is', null);

    if (!txnData || txnData.length === 0) {
      setRecommendations([]);
      setLoading(false);
      return;
    }

    // Group by recipient
    const recipientMap = new Map<string, { customers: Set<number>; totalAmount: number; txnIds: number[] }>();
    for (const t of txnData) {
      if (!t.recipient_account) continue;
      const entry = recipientMap.get(t.recipient_account) || { customers: new Set(), totalAmount: 0, txnIds: [] };
      entry.customers.add(t.customer_id);
      entry.totalAmount += Number(t.txn_amount);
      entry.txnIds.push(t.txn_id);
      recipientMap.set(t.recipient_account, entry);
    }

    // Get all blacklisted
    const { data: blData } = await supabase.from('blacklisted_recipients').select('recipient_value');
    const blacklistedSet = new Set(blData?.map(b => b.recipient_value) || []);

    // Get all case_transactions for fraud confirmation check
    const allTxnIds = txnData.map(t => t.txn_id);
    const { data: caseTxns } = await supabase
      .from('case_transactions')
      .select('case_id, txn_id')
      .in('txn_id', allTxnIds);

    const caseIds = [...new Set(caseTxns?.map(ct => ct.case_id) || [])];
    let confirmedCaseIds = new Set<number>();
    if (caseIds.length > 0) {
      const { data: decisions } = await supabase
        .from('case_decisions')
        .select('case_id')
        .in('case_id', caseIds)
        .eq('category', 'FRAUD_CONFIRMED');
      confirmedCaseIds = new Set(decisions?.map(d => d.case_id) || []);
    }

    // Build a txnId -> caseId map
    const txnToCases = new Map<number, number[]>();
    for (const ct of (caseTxns || [])) {
      const arr = txnToCases.get(ct.txn_id) || [];
      arr.push(ct.case_id);
      txnToCases.set(ct.txn_id, arr);
    }

    const results: BlacklistRecommendation[] = [];
    for (const [recipient, data] of recipientMap) {
      const complaintCount = data.customers.size;
      const totalAmount = data.totalAmount;
      
      // Count confirmed fraud cases linked to this recipient's txns
      const linkedCaseIds = new Set<number>();
      for (const txnId of data.txnIds) {
        for (const caseId of (txnToCases.get(txnId) || [])) {
          linkedCaseIds.add(caseId);
        }
      }
      const confirmedCount = [...linkedCaseIds].filter(id => confirmedCaseIds.has(id)).length;

      const reasons: string[] = [];
      if (complaintCount >= thresholds.minComplaints) {
        reasons.push(`High Complaint Risk (${complaintCount} complaints)`);
      }
      if (totalAmount >= thresholds.highAmountThreshold) {
        reasons.push(`High Financial Risk (৳${totalAmount.toLocaleString()} BDT)`);
      }
      if (confirmedCount > 0) {
        reasons.push(`Confirmed Fraud Signal (${confirmedCount} case${confirmedCount > 1 ? 's' : ''})`);
      }

      if (reasons.length > 0) {
        results.push({
          recipientAccount: recipient,
          complaintCount,
          totalReportedAmount: totalAmount,
          confirmedFraudCases: confirmedCount,
          reasons,
          isAlreadyBlacklisted: blacklistedSet.has(recipient),
        });
      }
    }

    // Sort by number of reasons, then by total amount
    results.sort((a, b) => b.reasons.length - a.reasons.length || b.totalReportedAmount - a.totalReportedAmount);
    setRecommendations(results);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  return { recommendations, loading, refresh: fetchAll };
}
