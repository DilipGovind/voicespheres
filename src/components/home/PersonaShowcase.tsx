'use client';

import React from 'react';
import { useAuth } from '@/lib/auth-context';
import { SEED_DEMO_USERS } from '@/lib/auth-store';
import { Sparkles, User, Sliders, Check, ArrowRight } from 'lucide-react';

export function PersonaShowcase() {
  const { user, demoLogin } = useAuth();

  return (
    <section aria-labelledby="personas-heading" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold uppercase tracking-wider">
              Diverse Community Voices
            </span>
            <span className="text-xs text-zinc-400">• 1-Click Instant Persona Testing</span>
          </div>
          <h2 id="personas-heading" className="text-xl sm:text-2xl font-black text-white mt-1">
            Experience VoiceSphere Through Diverse Lenses
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400">
            Click any community persona to immediately sign in and experience their customized accessibility setup, AAC voice tools, and active rooms.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {SEED_DEMO_USERS.map((demo) => {
          const isActive = user?.id === demo.id;

          return (
            <div
              key={demo.id}
              className={`relative rounded-2xl border p-4 flex flex-col justify-between transition group ${
                isActive
                  ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/10 ring-2 ring-yellow-400/30'
                  : 'border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 hover:border-zinc-700'
              }`}
            >
              <div className="space-y-3">
                {/* Avatar & Badges */}
                <div className="flex items-start justify-between">
                  <span className="text-3xl p-2 rounded-2xl bg-zinc-800 border border-zinc-700/60 shadow-inner">
                    {demo.avatar}
                  </span>
                  <div className="flex flex-col items-end space-y-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                      {demo.role}
                    </span>
                    {demo.isAacUser && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                        AAC User
                      </span>
                    )}
                  </div>
                </div>

                {/* Name & Handle */}
                <div>
                  <h3 className="font-extrabold text-sm text-white group-hover:text-yellow-300 transition">
                    {demo.displayName}
                  </h3>
                  <div className="flex items-center space-x-1.5 text-xs text-zinc-400 font-mono mt-0.5">
                    <span>@{demo.username}</span>
                    {demo.pronouns && <span>• ({demo.pronouns})</span>}
                  </div>
                </div>

                {/* Bio */}
                <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed">
                  {demo.bio}
                </p>

                {/* Preset Tag */}
                <div className="pt-1">
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400 text-[10px] font-medium border border-zinc-700">
                    <Sliders className="w-3 h-3 text-yellow-400" />
                    <span className="truncate max-w-[140px]">{demo.preferredPreset || 'Preset'}</span>
                  </span>
                </div>
              </div>

              {/* Login Button */}
              <div className="pt-4 mt-2 border-t border-zinc-800/80">
                {isActive ? (
                  <div className="w-full py-2 rounded-xl bg-yellow-400 text-black text-xs font-black flex items-center justify-center space-x-1.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Active Session</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => demoLogin(demo)}
                    className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-zinc-700 group-hover:border-zinc-500"
                  >
                    <span>Sign In as {demo.displayName.split(' ')[0]}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
