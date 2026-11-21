'use client';

import React, { useState, useEffect } from 'react';
import {
  TrialStatus,
  CoinBalance,
  PaymentTransaction,
} from '@/lib/payments/payment-gateway.interface';
import { mockPaymentGateway } from '@/lib/payments/mock-payment-gateway';
import { useAccessibility } from '@/lib/accessibility-context';
import {
  Coins,
  Calendar,
  Gift,
  PlusCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle,
  Send,
} from 'lucide-react';

interface TrialAndCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
}

export function TrialAndCoinsModal({
  isOpen,
  onClose,
  userId,
  userName,
}: TrialAndCoinsModalProps) {
  const { announce } = useAccessibility();
  const [trial, setTrial] = useState<TrialStatus | null>(null);
  const [balance, setBalance] = useState<CoinBalance | null>(null);
  const [history, setHistory] = useState<PaymentTransaction[]>([]);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    try {
      const [tStatus, cBalance, txHistory] = await Promise.all([
        mockPaymentGateway.getTrialStatus(userId),
        mockPaymentGateway.getBalance(userId),
        mockPaymentGateway.getTransactionHistory(userId),
      ]);
      setTrial(tStatus);
      setBalance(cBalance);
      setHistory(txHistory);
    } catch (e) {
      console.error('Error loading payment demo data:', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const handleClaimDaily = async () => {
    setIsLoading(true);
    try {
      const tx = await mockPaymentGateway.claimDailyReward(userId);
      setFeedbackMsg(`Success! Claimed +25 Demo Coins.`);
      announce('Claimed 25 demo coins reward', 'polite');
      await loadData();
    } catch (err: any) {
      setFeedbackMsg(err.message || 'Failed to claim reward');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopup = async (amount: number) => {
    setIsLoading(true);
    try {
      const tx = await mockPaymentGateway.requestDemoTopup(userId, amount);
      setFeedbackMsg(`Success! Added +${amount} Demo Coins (Free Demo Top-Up).`);
      announce(`Added ${amount} demo coins to balance`, 'polite');
      await loadData();
    } catch (err: any) {
      setFeedbackMsg(err.message || 'Failed to add demo coins');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-coins-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-zinc-900 border-2 border-zinc-700 w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative text-zinc-100 max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close trial and coins dialog"
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white transition focus-visible:ring-2 focus-visible:ring-yellow-400"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="space-y-2 pr-8">
          <div className="flex items-center space-x-2 text-yellow-400">
            <Coins className="w-7 h-7" />
            <span className="text-xs font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-yellow-400/20 border border-yellow-400/40">
              Demo Simulation Only
            </span>
          </div>
          <h2 id="trial-coins-title" className="text-2xl font-black text-white">
            30-Day Trial & Demo Coins
          </h2>
          <p className="text-sm text-zinc-400">
            Test audio room appreciation and community tipping with zero cost or credit cards.
          </p>
        </div>

        {/* Strict Demo Disclaimer Banner */}
        <div
          role="note"
          aria-label="Demo Testing Notice"
          className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-start space-x-3 text-amber-200"
        >
          <AlertTriangle className="w-6 h-6 flex-shrink-0 text-amber-400 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-bold uppercase tracking-wider text-amber-300">
              Zero Real Payments • Safe Testing Environment
            </p>
            <p className="text-zinc-300">
              All balances, trial periods, and transactions below are simulated test data. No credit cards, UPI, or real-money gateways are connected. Payment infrastructure is decoupled behind an abstract provider interface.
            </p>
          </div>
        </div>

        {feedbackMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Trial Status Card */}
          <div className="p-5 rounded-2xl bg-zinc-800/80 border border-zinc-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>Trial Period</span>
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                Active
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black text-white">
                {trial ? trial.daysRemaining : 30}{' '}
                <span className="text-base font-normal text-zinc-400">days left</span>
              </div>
              <p className="text-xs text-zinc-400">
                Full access to all voice rooms, accessibility tools, and LiveKit SFU.
              </p>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-zinc-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{
                  width: `${trial ? Math.max(5, (trial.daysRemaining / trial.totalTrialDays) * 100) : 100}%`,
                }}
              />
            </div>
          </div>

          {/* Demo Coin Balance Card */}
          <div className="p-5 rounded-2xl bg-zinc-800/80 border border-zinc-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span>Demo Coins</span>
              </span>
              <span className="text-xs text-yellow-400 font-bold">
                [TEST BALANCE]
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-3xl font-black text-yellow-400 flex items-center space-x-2">
                <span>{balance ? balance.demoCoins : 150}</span>
                <span className="text-sm font-semibold text-zinc-400">Coins</span>
              </div>
              <p className="text-xs text-zinc-400">
                Use to test speaker tips, reactions, and peer recognition.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2 pt-1">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleClaimDaily}
                className="flex-1 py-1.5 px-3 rounded-xl bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-300 text-xs font-bold transition flex items-center justify-center space-x-1 disabled:opacity-50"
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Daily +25</span>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleTopup(100)}
                className="flex-1 py-1.5 px-3 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/40 text-blue-300 text-xs font-bold transition flex items-center justify-center space-x-1 disabled:opacity-50"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Top-up +100</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sample Transaction History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-200 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-zinc-400" />
              <span>Sample Demo Transaction Ledger</span>
            </h3>
            <span className="text-xs text-zinc-500">
              {history.length} transactions recorded
            </span>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Transaction Ledger"
            className="space-y-2 max-h-48 overflow-y-auto pr-1 border border-zinc-800 rounded-2xl p-2 bg-zinc-950/60"
          >
            {history.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-500">
                No demo transactions yet. Claim your daily bonus above to see live ledger entries.
              </div>
            ) : (
              history.map((tx) => (
                <div
                  key={tx.id}
                  className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-zinc-200 flex items-center space-x-2">
                      <span>{tx.description}</span>
                    </div>
                    <div className="text-[11px] text-zinc-500 flex items-center space-x-2">
                      <span>{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span className="text-amber-400/90 font-mono text-[10px]">DEMO DATA</span>
                    </div>
                  </div>

                  <div
                    className={`font-mono font-bold text-sm ${
                      tx.amount > 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm transition focus-visible:ring-2 focus-visible:ring-yellow-400"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
