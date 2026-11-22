'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, Sliders } from 'lucide-react';

interface Props {
  children: ReactNode;
  roomName?: string;
  onLeaveRoom?: () => void;
  onOpenAccessibility?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class VoiceRoomErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[VoiceRoomErrorBoundary] Uncaught exception in voice stage:', error, errorInfo);
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="glass-panel max-w-lg w-full p-6 sm:p-8 rounded-3xl border border-rose-500/30 text-center space-y-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 text-xs font-bold uppercase tracking-wider">
                Voice Room Session Recovery
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Audio Stage Encountered a Problem
              </h2>
              <p className="text-sm text-zinc-300 leading-relaxed">
                The voice stage for <span className="font-bold text-white">{this.props.roomName || 'this room'}</span> experienced an unexpected device audio or network exception. You can rejoin with safe settings or return to the room lobby.
              </p>
              {this.state.error?.message && (
                <p className="text-xs font-mono text-rose-300/80 bg-rose-950/40 p-2.5 rounded-xl border border-rose-500/20 text-left overflow-x-auto max-h-24">
                  {this.state.error.message}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="btn-glow-primary flex items-center space-x-2 px-5 py-3 rounded-2xl font-bold text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Rejoin Voice Stage</span>
              </button>

              {this.props.onLeaveRoom && (
                <button
                  type="button"
                  onClick={this.props.onLeaveRoom}
                  className="btn-glass flex items-center space-x-2 px-4 py-3 rounded-2xl font-bold text-sm text-zinc-300"
                >
                  <Home className="w-4 h-4" />
                  <span>Return to Lobby</span>
                </button>
              )}

              {this.props.onOpenAccessibility && (
                <button
                  type="button"
                  onClick={this.props.onOpenAccessibility}
                  className="btn-glass flex items-center space-x-2 px-4 py-3 rounded-2xl font-bold text-sm text-yellow-300 border-yellow-500/30"
                >
                  <Sliders className="w-4 h-4 text-yellow-400" />
                  <span>Accessibility Settings</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
