/**
 * Payment Gateway & Trial Provider Interface
 * Abstract provider interface decoupling the prototype's mock coin/trial mechanics
 * from any future commercial payment processor (e.g. Stripe, LemonSqueezy, Paddle).
 */

export interface TrialStatus {
  isActive: boolean;
  startDate: number;
  expiryDate: number;
  daysRemaining: number;
  totalTrialDays: number;
  planName: string;
  isDemo: true;
}

export interface CoinBalance {
  userId: string;
  demoCoins: number;
  lastUpdated: number;
  isDemo: true;
}

export type TransactionType =
  | 'INITIAL_GRANT'
  | 'DAILY_REWARD'
  | 'SPEAKER_TIP'
  | 'DEMO_TOPUP';

export interface PaymentTransaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number; // Positive for additions, negative for tips sent
  balanceAfter: number;
  timestamp: number;
  description: string;
  recipientId?: string;
  recipientName?: string;
  isDemo: true;
  status: 'completed' | 'pending' | 'failed';
}

export interface IPaymentGateway {
  readonly providerId: string;
  readonly isDemoOnly: boolean;

  /** Get the current user's 30-day trial status */
  getTrialStatus(userId: string): Promise<TrialStatus>;

  /** Get current demo coin balance */
  getBalance(userId: string): Promise<CoinBalance>;

  /** Send a demo tip to a room speaker */
  sendTip(
    senderId: string,
    recipientId: string,
    recipientName: string,
    amount: number,
    note?: string
  ): Promise<PaymentTransaction>;

  /** Claim daily demo rewards (+25 coins) */
  claimDailyReward(userId: string): Promise<PaymentTransaction>;

  /** Claim a free demo top-up pack (+100 coins) */
  requestDemoTopup(userId: string, amount?: number): Promise<PaymentTransaction>;

  /** Retrieve the user's sample transaction history */
  getTransactionHistory(userId: string): Promise<PaymentTransaction[]>;
}
