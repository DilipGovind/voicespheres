import { describe, it, expect } from 'vitest';
import { MockPaymentGateway } from '../src/lib/payments/mock-payment-gateway';

describe('Demo 30-Day Trial & Coin Gateway', () => {
  it('initializes a 30-day active trial for users', async () => {
    const gateway = new MockPaymentGateway();
    const trial = await gateway.getTrialStatus('test_user_trial');

    expect(trial.isActive).toBe(true);
    expect(trial.daysRemaining).toBeLessThanOrEqual(30);
    expect(trial.totalTrialDays).toBe(30);
    expect(trial.isDemo).toBe(true);
  });

  it('provides starting demo coin balance of 150 coins', async () => {
    const gateway = new MockPaymentGateway();
    const balance = await gateway.getBalance('test_user_coins_1');

    expect(balance.demoCoins).toBe(150);
    expect(balance.isDemo).toBe(true);
  });

  it('allows claiming daily demo rewards (+25 coins)', async () => {
    const gateway = new MockPaymentGateway();
    const initial = await gateway.getBalance('test_user_reward');
    const tx = await gateway.claimDailyReward('test_user_reward');

    expect(tx.type).toBe('DAILY_REWARD');
    expect(tx.amount).toBe(25);
    expect(tx.balanceAfter).toBe(initial.demoCoins + 25);
    expect(tx.isDemo).toBe(true);
  });

  it('allows sending demo tips to speakers', async () => {
    const gateway = new MockPaymentGateway();
    const senderId = 'test_user_sender';
    await gateway.getBalance(senderId); // Initialize

    const tx = await gateway.sendTip(
      senderId,
      'test_user_speaker',
      'Speaker Bob',
      10,
      'Great talk!'
    );

    expect(tx.type).toBe('SPEAKER_TIP');
    expect(tx.amount).toBe(-10);
    expect(tx.recipientId).toBe('test_user_speaker');
    expect(tx.recipientName).toBe('Speaker Bob');
    expect(tx.isDemo).toBe(true);
    expect(tx.status).toBe('completed');
  });

  it('maintains a sample transaction history with demo flags', async () => {
    const gateway = new MockPaymentGateway();
    const userId = 'test_user_history';
    await gateway.getBalance(userId);
    await gateway.claimDailyReward(userId);

    const history = await gateway.getTransactionHistory(userId);
    expect(history.length).toBeGreaterThan(0);
    expect(history.every((h) => h.isDemo === true)).toBe(true);
  });
});
