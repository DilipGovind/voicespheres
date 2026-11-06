'use client';

import React, { useState } from 'react';
import { useAccessibility } from '@/lib/accessibility-context';
import { useI18n } from '@/lib/i18n-context';
import { Room, RoomCategory, ROOM_CATEGORIES_INFO } from '@/types/room';
import { SUPPORTED_LOCALES, SupportedLocale } from '@/types/i18n';
import {
  Search,
  SlidersHorizontal,
  Users,
  Radio,
  Subtitles,
  MessageSquare,
  Sparkles,
  Volume2,
  Lock,
  ArrowRight,
  Filter,
  Share2,
  RefreshCw,
  Globe,
} from 'lucide-react';

interface RoomDiscoveryProps {
  rooms: Room[];
  onSelectRoom: (room: Room) => void;
  onCreateRoom: () => void;
  onShareRoom?: (room: Room) => void;
  onRefreshRooms?: () => void;
  isRefreshing?: boolean;
}

export function RoomDiscovery({
  rooms,
  onSelectRoom,
  onCreateRoom,
  onShareRoom,
  onRefreshRooms,
  isRefreshing = false,
}: RoomDiscoveryProps) {
  const { settings } = useAccessibility();
  const { t } = useI18n();

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [filterCaptionsOnly, setFilterCaptionsOnly] = useState(false);
  const [filterAacOnly, setFilterAacOnly] = useState(false);
  const [filterLowStimOnly, setFilterLowStimOnly] = useState(false);
  const [filterStructuredOnly, setFilterStructuredOnly] = useState(false);

  // Filter logic
  const filteredRooms = rooms.filter((r) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.name.toLowerCase().includes(q);
      const matchTopic = r.topic.toLowerCase().includes(q);
      const matchCat = r.category.toLowerCase().includes(q);
      if (!matchName && !matchTopic && !matchCat) return false;
    }

    // Category
    if (selectedCategory !== 'all' && r.category !== selectedCategory) return false;

    // Language
    if (selectedLanguage !== 'all' && r.language !== selectedLanguage) return false;

    // Accessibility feature flags
    if (filterCaptionsOnly && !r.accessibilityFeatures.captionsAvailable) return false;
    if (filterAacOnly && !r.accessibilityFeatures.aacSupport) return false;
    if (filterLowStimOnly && !r.accessibilityFeatures.lowStimulation) return false;
    if (filterStructuredOnly && !r.accessibilityFeatures.structuredDiscussion) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search & Top Action Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={settings.simpleLanguageMode ? 'Search rooms...' : t('searchRooms')}
            aria-label="Search rooms by topic or disability category"
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-zinc-900 border-2 border-zinc-700 text-white placeholder-zinc-500 font-medium text-sm focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20"
          />
        </div>

        {/* Category Dropdown, Language Filter, & Quick Actions */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            aria-label="Filter rooms by inclusive community category"
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs sm:text-sm font-semibold"
          >
            <option value="all">🌐 All Inclusive Communities</option>
            {Object.entries(ROOM_CATEGORIES_INFO).map(([key, info]) => (
              <option key={key} value={key}>
                {info.emoji} {info.label}
              </option>
            ))}
          </select>

          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            aria-label="Filter rooms by language"
            className="px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs sm:text-sm font-semibold"
          >
            <option value="all">All Languages</option>
            {Object.entries(SUPPORTED_LOCALES).map(([code, info]) => (
              <option key={code} value={code}>
                {info.nativeName} ({info.code.toUpperCase()})
              </option>
            ))}
          </select>

          {onRefreshRooms && (
            <button
              type="button"
              onClick={onRefreshRooms}
              disabled={isRefreshing}
              aria-label="Refresh community rooms from server"
              title="Refresh room list"
              className="flex items-center space-x-1 px-3 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs sm:text-sm font-semibold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-yellow-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          )}

          <button
            type="button"
            onClick={onCreateRoom}
            aria-label="Create a new accessible voice room"
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>+ Create Room</span>
          </button>
        </div>
      </div>

      {/* Accessibility Feature Filter Badges */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-zinc-400 font-bold flex items-center space-x-1 uppercase tracking-wider text-[11px] whitespace-nowrap">
          <Filter className="w-3.5 h-3.5" />
          <span>A11Y Badges:</span>
        </span>

        <button
          type="button"
          onClick={() => setFilterCaptionsOnly(!filterCaptionsOnly)}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 border transition whitespace-nowrap ${
            filterCaptionsOnly
              ? 'bg-cyan-500 text-black border-cyan-400 shadow-md'
              : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white'
          }`}
        >
          <Subtitles className="w-3.5 h-3.5" />
          <span>Live Captions Only</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterAacOnly(!filterAacOnly)}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 border transition whitespace-nowrap ${
            filterAacOnly
              ? 'bg-emerald-500 text-black border-emerald-400 shadow-md'
              : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>AAC Welcomed Only</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterLowStimOnly(!filterLowStimOnly)}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 border transition whitespace-nowrap ${
            filterLowStimOnly
              ? 'bg-zinc-200 text-black border-white shadow-md'
              : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Low Stimulation</span>
        </button>

        <button
          type="button"
          onClick={() => setFilterStructuredOnly(!filterStructuredOnly)}
          className={`px-3 py-1.5 rounded-xl font-bold flex items-center space-x-1.5 border transition whitespace-nowrap ${
            filterStructuredOnly
              ? 'bg-blue-500 text-white border-blue-400 shadow-md'
              : 'bg-zinc-900 text-zinc-300 border-zinc-700 hover:text-white'
          }`}
        >
          <span>Structured Flow</span>
        </button>
      </div>

      {/* Discovery Counter Bar */}
      <div className="flex items-center justify-between text-xs text-zinc-400 pt-1">
        <span className="font-semibold">
          Showing {filteredRooms.length} accessible {filteredRooms.length === 1 ? 'room' : 'rooms'} across all platforms
        </span>
        <span className="flex items-center space-x-1.5 text-emerald-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Live Synchronized</span>
        </span>
      </div>

      {/* Room Grid */}
      <div
        role="region"
        aria-label="Available Accessible Voice Rooms"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {filteredRooms.length === 0 ? (
          <div className="col-span-full py-16 text-center rounded-3xl border-2 border-dashed border-zinc-800 bg-zinc-950/50 p-8 space-y-4">
            <Radio className="w-12 h-12 text-zinc-600 mx-auto" />
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-white">No Matching Rooms Found</h3>
              <p className="text-sm text-zinc-400">
                Try loosening your filters or create the first inclusive room for this topic.
              </p>
            </div>
            <button
              onClick={onCreateRoom}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transition"
            >
              Create New Room
            </button>
          </div>
        ) : (
          filteredRooms.map((room) => {
            const catInfo = ROOM_CATEGORIES_INFO[room.category] || ROOM_CATEGORIES_INFO.general;
            const speakerCount = room.participants.filter((p) => p.role !== 'listener').length;

            return (
              <div
                key={room.id}
                role="article"
                aria-label={`Room: ${room.name}`}
                className="group relative flex flex-col justify-between rounded-3xl border-2 border-zinc-800 bg-zinc-900/60 p-5 hover:border-zinc-600 transition-all shadow-lg hover:shadow-2xl"
              >
                {/* Header Category and Status */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-xs font-semibold text-zinc-300 flex items-center space-x-1">
                      <span>{catInfo.emoji}</span>
                      <span>{catInfo.label}</span>
                    </span>

                    <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Live</span>
                    </span>
                  </div>

                  <h3 className="font-black text-lg text-white group-hover:text-yellow-400 transition-colors line-clamp-1 mb-1">
                    {room.name}
                  </h3>
                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed mb-4">
                    {room.topic}
                  </p>
                </div>

                {/* Accessibility Feature Badges */}
                <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
                  {room.accessibilityFeatures.captionsAvailable && (
                    <span
                      title="Live Speech Captions Available"
                      className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold uppercase flex items-center space-x-1"
                    >
                      <Subtitles className="w-3 h-3" />
                      <span>Captions</span>
                    </span>
                  )}

                  {room.accessibilityFeatures.aacSupport && (
                    <span
                      title="AAC & Synthesized Speech Welcomed"
                      className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase flex items-center space-x-1"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>AAC</span>
                    </span>
                  )}

                  {room.accessibilityFeatures.lowStimulation && (
                    <span
                      title="Low Stimulation & Sensory Friendly"
                      className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-bold uppercase flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Low Stim</span>
                    </span>
                  )}

                  <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 text-[10px] font-bold uppercase">
                    {room.language.toUpperCase()}
                  </span>
                </div>

                {/* Footer: Participants and Join Action */}
                <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
                  <div className="flex items-center space-x-2 text-xs text-zinc-400">
                    <Users className="w-4 h-4" />
                    {!settings.hideParticipantCounts ? (
                      <span>{room.participants.length} total ({speakerCount} on mic)</span>
                    ) : (
                      <span>Active Community</span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {onShareRoom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onShareRoom(room);
                        }}
                        aria-label={`Share link for room: ${room.name}`}
                        className="p-2 rounded-xl border border-zinc-700 bg-zinc-800 text-zinc-300 hover:text-yellow-400 hover:border-yellow-400/50 transition"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSelectRoom(room)}
                      aria-label={`Join room: ${room.name}`}
                      className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-yellow-400 text-black hover:bg-yellow-300 font-bold text-xs shadow-md transition"
                    >
                      <span>Join Preview</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
