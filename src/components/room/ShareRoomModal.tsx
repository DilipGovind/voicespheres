'use client';

import React, { useState, useEffect } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { Room } from '@/types/room';
import {
  Share2,
  Copy,
  Check,
  X,
  QrCode,
  Link as LinkIcon,
  MessageSquare,
  Subtitles,
  Sparkles,
} from 'lucide-react';

interface ShareRoomModalProps {
  room: Room | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ShareRoomModal({ room, isOpen, onClose }: ShareRoomModalProps) {
  const { announce } = useAccessibility();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInviteText, setCopiedInviteText] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  if (!isOpen || !room) return null;

  const shareUrl = `${origin}/?room=${encodeURIComponent(room.id)}`;

  const formattedInvite = `Join our accessible voice room on VoiceSphere: "${room.name}"\n` +
    `Topic: ${room.topic}\n` +
    `Accessibility: ${room.accessibilityFeatures.captionsAvailable ? '✓ Live Captions ' : ''}${room.accessibilityFeatures.aacSupport ? '✓ AAC Welcomed ' : ''}${room.accessibilityFeatures.lowStimulation ? '✓ Low Stimulation' : ''}\n` +
    `Link: ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      announce('Room invite link copied to clipboard.', 'polite');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      announce('Failed to copy automatically. Please copy the URL from the text box.', 'assertive');
    }
  };

  const handleCopyInviteText = async () => {
    try {
      await navigator.clipboard.writeText(formattedInvite);
      setCopiedInviteText(true);
      announce('Full accessible invitation text copied to clipboard.', 'polite');
      setTimeout(() => setCopiedInviteText(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `VoiceSphere: ${room.name}`,
          text: `Join our accessible voice room "${room.name}" on VoiceSphere. Live captions & AAC friendly.`,
          url: shareUrl,
        });
        announce('Share dialog opened successfully.', 'polite');
      } catch (err) {
        // User cancelled share or error
      }
    } else {
      handleCopyLink();
    }
  };

  // Simple clean SVG QR Code representation (Pattern representation for quick visual scanning)
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative w-full max-w-lg rounded-3xl border-2 border-yellow-400 bg-zinc-950 p-6 sm:p-7 text-zinc-100 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5 rtl:space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-yellow-400 text-black">
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 id="share-modal-title" className="text-lg font-black text-white">
                Share Room Invite Link
              </h2>
              <p className="text-xs text-zinc-400">
                Anyone with this link can join this inclusive conversation directly
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close share dialog"
            className="p-1.5 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Info Preview */}
        <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
          <span className="font-extrabold text-sm text-yellow-300 block">
            {room.name}
          </span>
          <p className="text-xs text-zinc-300 line-clamp-2">
            {room.topic}
          </p>
        </div>

        {/* Direct Link Input + Copy Button */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Direct Shareable URL
          </label>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="relative flex-1">
              <input
                type="text"
                readOnly
                value={shareUrl}
                aria-label="Room share URL"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-mono text-xs focus:border-yellow-400 truncate select-all"
              />
            </div>
            <button
              type="button"
              onClick={handleCopyLink}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-1.5 border transition ${
                copiedLink
                  ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
                  : 'bg-yellow-400 text-black hover:bg-yellow-300 border-yellow-300'
              }`}
            >
              {copiedLink ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
            </button>
          </div>
        </div>

        {/* Formatted Accessible Invitation Text */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider">
              Accessible Invitation Message
            </label>
            <button
              type="button"
              onClick={handleCopyInviteText}
              className="text-xs text-yellow-400 hover:underline font-semibold flex items-center space-x-1"
            >
              {copiedInviteText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedInviteText ? 'Message Copied!' : 'Copy Full Message'}</span>
            </button>
          </div>
          <textarea
            readOnly
            rows={3}
            value={formattedInvite}
            className="w-full p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 text-xs font-medium resize-none select-all leading-relaxed"
          />
        </div>

        {/* QR Code and Mobile Web Share */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 rounded-2xl bg-zinc-900/50 border border-zinc-800 gap-3">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-14 h-14 bg-white rounded-xl p-1 flex items-center justify-center shrink-0">
              <img
                src={qrSvgUrl}
                alt={`QR code to join ${room.name}`}
                className="w-full h-full object-contain"
                loading="lazy"
              />
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                QR Code For Mobile Devices
              </span>
              <span className="text-[11px] text-zinc-400">
                Scan with camera or assistive switch pointer
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold border border-zinc-700 flex items-center justify-center space-x-1.5 transition"
          >
            <Share2 className="w-4 h-4 text-blue-400" />
            <span>Device Share...</span>
          </button>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
