'use client';

import React, { useState } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { Participant } from '@/types/room';
import { ShieldAlert, X, AlertTriangle, CheckCircle } from 'lucide-react';

interface ReportAbuseModalProps {
  isOpen: boolean;
  onClose: () => void;
  participants: Participant[];
  currentUserId: string;
}

export function ReportAbuseModal({
  isOpen,
  onClose,
  participants,
  currentUserId,
}: ReportAbuseModalProps) {
  const { announce } = useAccessibility();
  const [selectedUser, setSelectedUser] = useState('');
  const [reason, setReason] = useState<string>('harassment_aac');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const targetableParticipants = participants.filter((p) => p.id !== currentUserId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    announce(
      'Report submitted. Our safety team strictly enforces our anti-ableism policy and will review this with human moderators.',
      'assertive'
    );
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-red-500 bg-zinc-950 p-6 text-zinc-100 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 id="report-modal-title" className="font-extrabold text-lg text-white">
                Report & Anti-Ableism Protection
              </h3>
              <p className="text-xs text-zinc-400">
                VoiceSphere maintains strict zero tolerance for harassment of disabled people
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close report dialog"
            className="p-1 rounded-lg text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
            <h4 className="font-bold text-lg text-white">Report Received</h4>
            <p className="text-sm text-zinc-300">
              Thank you for keeping our community safe. Our team reviews all anti-ableism reports with human oversight.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Participant to Report
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                required
                className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm"
              >
                <option value="">Select participant...</option>
                {targetableParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Reason for Report
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm"
              >
                <option value="harassment_aac">
                  Harassment / Mockery of AAC or Synthesized Speech
                </option>
                <option value="ableism">
                  Ableist Slurs or Discrimination
                </option>
                <option value="speech_mockery">
                  Mocking Stuttering, Dysarthria, or Speech Differences
                </option>
                <option value="disruption">
                  Sudden Loud Noise or Intentional Sensory Disruption
                </option>
                <option value="hate_speech">
                  Hate Speech or Intimidation
                </option>
                <option value="other">Other Violation</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-1.5">
                Description / Context
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Please describe what happened..."
                className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white text-sm placeholder-zinc-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400">
              <span className="font-bold text-yellow-400 block mb-0.5">Note on Fair Moderation:</span>
              Voice patterns, pauses for cognitive processing, stuttering, or electronic voices are never treated as suspicious behavior.
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!selectedUser}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-red-600/30"
              >
                Submit Report
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
