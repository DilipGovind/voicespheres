/**
 * Mock Payment Gateway & Demo Trial Implementation
 * Complies with strict testing guidelines:
 * - 0% real money, 0 credit card inputs, 0 payment gateways.
 * - 100% demo data, clearly watermarked for testing worldwide.
 */

import {
  IPaymentGateway,
  TrialStatus,
  CoinBalance,
  PaymentTransaction,
} from './payment-gateway.interface';

const TRIAL_DAYS = 30;
const INITIAL_COINS = 150;
const STORAGE_PREFIX = 'voicesphere_mock_pay_';

// In-memory store fallback when localStorage is unavailable (Node / SSR / Vitest)
const memoryStore = new Map<string, string>();

function getItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return localStorage.getItem(key);
  }
  return memoryStore.get(key) || null;
}

function setItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(key, value);
  } else {
    memoryStore.set(key, value);
  }
}

export class MockPaymentGateway implements IPaymentGateway {
  public readonly providerId = 'mock_demo_provider';
  public readonly isDemoOnly = true;

  private getStorageKey(userId: string, suffix: string): string {
    return `${STORAGE_PREFIX}${userId}_${suffix}`;
  }

  public async getTrialStatus(userId: string): Promise<TrialStatus> {
    const key = this.getStorageKey(userId, 'trial_start');
    let startTimestamp = getItem(key);

    if (!startTimestamp) {
      startTimestamp = Date.now().toString();
      setItem(key, startTimestamp);
    }

    const start = parseInt(startTimestamp, 10);
    const trialDurationMs = TRIAL_DAYS * 24 * 60 * 60 * 1000;
    const expiry = start + trialDurationMs;
    const now = Date.now();
    const msRemaining = Math.max(0, expiry - now);
    const daysRemaining = Math.ceil(msRemaining / (24 * 60 * 60 * 1000));

    return {
      isActive: daysRemaining > 0,
      startDate: start,
      expiryDate: expiry,
      daysRemaining,
      totalTrialDays: TRIAL_DAYS,
      planName: 'Inclusive Voice Global Trial (Demo)',
      isDemo: true,
    };
  }

  public async getBalance(userId: string): Promise<CoinBalance> {
    const key = this.getStorageKey(userId, 'balance');
    const existing = getItem(key);

    if (existing === null) {
      // First visit: grant initial demo coin balance
      setItem(key, INITIAL_COINS.toString());

      // Create initial grant transaction
      const initialTx: PaymentTransaction = {
        id: 'tx_init_' + Math.random().toString(36).substring(2, 9),
        userId,
        type: 'INITIAL_GRANT',
        amount: INITIAL_COINS,
        balanceAfter: INITIAL_COINS,
        timestamp: Date.now(),
        description: 'Welcome Bonus: 150 Free Demo Coins granted for prototype testing',
        isDemo: true,
        status: 'completed',
      };
      this.saveTransaction(userId, initialTx);

      return {
        userId,
        demoCoins: INITIAL_COINS,
        lastUpdated: Date.now(),
        isDemo: true,
      };
    }

    return {
      userId,
      demoCoins: parseInt(existing, 10),
      lastUpdated: Date.now(),
      isDemo: true,
    };
  }

  public async sendTip(
    senderId: string,
    recipientId: string,
    recipientName: string,
    amount: number,
    note?: string
  ): Promise<PaymentTransaction> {
    const currentBalance = await this.getBalance(senderId);

    if (currentBalance.demoCoins < amount) {
      throw new Error(`Insufficient demo coin balance (Have ${currentBalance.demoCoins}, need ${amount})`);
    }

    const newBalance = currentBalance.demoCoins - amount;
    setItem(this.getStorageKey(senderId, 'balance'), newBalance.toString());

    const tx: PaymentTransaction = {
      id: 'tx_tip_' + Math.random().toString(36).substring(2, 9),
      userId: senderId,
      type: 'SPEAKER_TIP',
      amount: -amount,
      balanceAfter: newBalance,
      timestamp: Date.now(),
      description: `Sent demo tip of ${amount} coins to speaker ${recipientName}${note ? ` ("${note}")` : ''}`,
      recipientId,
      recipientName,
      isDemo: true,
      status: 'completed',
    };

    this.saveTransaction(senderId, tx);
    return tx;
  }

  public async claimDailyReward(userId: string): Promise<PaymentTransaction> {
    const currentBalance = await this.getBalance(userId);
    const rewardAmount = 25;
    const newBalance = currentBalance.demoCoins + rewardAmount;

    setItem(this.getStorageKey(userId, 'balance'), newBalance.toString());

    const tx: PaymentTransaction = {
      id: 'tx_reward_' + Math.random().toString(36).substring(2, 9),
      userId,
      type: 'DAILY_REWARD',
      amount: rewardAmount,
      balanceAfter: newBalance,
      timestamp: Date.now(),
      description: `Daily Demo Testing Bonus (+${rewardAmount} demo coins)`,
      isDemo: true,
      status: 'completed',
    };

    this.saveTransaction(userId, tx);
    return tx;
  }

  public async requestDemoTopup(userId: string, amount = 100): Promise<PaymentTransaction> {
    const currentBalance = await this.getBalance(userId);
    const newBalance = currentBalance.demoCoins + amount;

    setItem(this.getStorageKey(userId, 'balance'), newBalance.toString());

    const tx: PaymentTransaction = {
      id: 'tx_topup_' + Math.random().toString(36).substring(2, 9),
      userId,
      type: 'DEMO_TOPUP',
      amount,
      balanceAfter: newBalance,
      timestamp: Date.now(),
      description: `Free Demo Top-Up (+${amount} demo coins for room testing)`,
      isDemo: true,
      status: 'completed',
    };

    this.saveTransaction(userId, tx);
    return tx;
  }

  public async getTransactionHistory(userId: string): Promise<PaymentTransaction[]> {
    const key = this.getStorageKey(userId, 'history');
    const existing = getItem(key);
    if (!existing) return [];

    try {
      const parsed: PaymentTransaction[] = JSON.parse(existing);
      return parsed.sort((a, b) => b.timestamp - a.timestamp);
    } catch {
      return [];
    }
  }

  private saveTransaction(userId: string, tx: PaymentTransaction) {
    const key = this.getStorageKey(userId, 'history');
    const existing = getItem(key);
    let list: PaymentTransaction[] = [];

    if (existing) {
      try {
        list = JSON.parse(existing);
      } catch {}
    }

    list.unshift(tx);
    if (list.length > 50) list = list.slice(0, 50);

    setItem(key, JSON.stringify(list));
  }
}

export const mockPaymentGateway = new MockPaymentGateway();
