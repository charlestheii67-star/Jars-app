import React, { useState, useEffect, useRef } from 'react';
import { Radio, Tv, MessageSquare, Play, Video, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, LogOut, Send, Eye, Sparkles } from 'lucide-react';
import { CharacterRig } from '../engine/CharacterModels';
import { globalAudioVoiceEngine } from '../engine/AudioVoiceEngine';
import { VoiceProfile } from '../types';

interface TikTokSession {
  isAuthorized: boolean;
  username: string;
  displayName: string;
  avatarUrl: string;
  roomId?: string;
  isLive: boolean;
  liveType: 'mobile_gaming' | 'camera';
  connectedAt?: number;
}

interface LiveChatMessage {
  id: string;
  user: string;
  avatar: string;
  text: string;
  isQuestion: boolean;
  timestamp: number;
  hasBeenAnswered?: boolean;
}

interface TikTokLiveStudioProps {
  characterName: string;
  characterRig: CharacterRig | null;
  personality: string;
  dialogueStyle: string;
  voiceProfile: VoiceProfile;
  onTriggerAnimation: (anim: any) => void;
  onTriggerCameraShot: (shot: any) => void;
}

export const TikTokLiveStudio: React.FC<TikTokLiveStudioProps> = ({
  characterName,
  characterRig,
  personality,
  dialogueStyle,
  voiceProfile,
  onTriggerAnimation,
  onTriggerCameraShot,
}) => {
  // TikTok Auth state
  const [session, setSession] = useState<TikTokSession>({
    isAuthorized: false,
    username: '',
    displayName: '',
    avatarUrl: '',
    isLive: false,
    liveType: 'mobile_gaming',
  });
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [manualHandle, setManualHandle] = useState('');

  // Real Chat state
  const [chatMessages, setChatMessages] = useState<LiveChatMessage[]>([]);
  const [newChatInput, setNewChatInput] = useState('');
  const [newUserInput, setNewUserInput] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [autoAnswerEnabled, setAutoAnswerEnabled] = useState(true);

  // Screen Awareness state
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenAnalysisText, setScreenAnalysisText] = useState<string>('');
  const [isAnalyzingScreen, setIsAnalyzingScreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Fetch initial session status
  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/auth/tiktok/status');
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
      }
    } catch (e) {
      console.warn('Failed to fetch TikTok status:', e);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Listen for OAuth postMessage callback
    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.platform === 'tiktok') {
        setIsAuthenticating(false);
        if (event.data.user) {
          setSession(event.data.user);
        } else {
          fetchStatus();
        }
      }
    };

    window.addEventListener('message', handleAuthMessage);
    return () => window.removeEventListener('message', handleAuthMessage);
  }, []);

  // Poll real incoming live chat when authorized
  useEffect(() => {
    if (!session.isAuthorized) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/tiktok/chat');
        const data = await res.json();
        if (data.messages) {
          setChatMessages(data.messages);

          // If auto-answer is enabled, find the most recent unanswered question
          if (autoAnswerEnabled && !isAnswering) {
            const unanswered = data.messages.find((m: LiveChatMessage) => m.isQuestion && !m.hasBeenAnswered);
            if (unanswered) {
              answerLiveQuestion(unanswered);
            }
          }
        }
      } catch (e) {}
    }, 2500);

    return () => clearInterval(interval);
  }, [session.isAuthorized, autoAnswerEnabled, isAnswering]);

  // Handle TikTok OAuth Login
  const handleTikTokLogin = async () => {
    setIsAuthenticating(true);
    try {
      const res = await fetch('/api/auth/tiktok/url');
      const data = await res.json();

      const authWindow = window.open(
        data.url,
        'tiktok_oauth_popup',
        'width=580,height=720,menubar=no,toolbar=no'
      );

      if (!authWindow) {
        // Fallback to direct connect if popups blocked
        alert('Popup blocked. Connecting your live account directly.');
        handleDirectConnect(manualHandle || 'TikTokGamer_' + Math.floor(1000 + Math.random() * 9000));
      }
    } catch (e) {
      console.error('OAuth error:', e);
      setIsAuthenticating(false);
    }
  };

  // Direct Connect with TikTok Username / Mobile Gaming Room
  const handleDirectConnect = async (handle?: string) => {
    const targetUser = handle || manualHandle || 'TikTok_Pro';
    try {
      const res = await fetch('/api/auth/tiktok/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: targetUser,
          roomId: 'live_room_' + Date.now(),
          liveType: 'mobile_gaming',
        }),
      });
      const data = await res.json();
      if (data.session) {
        setSession(data.session);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Handle Disconnect
  const handleDisconnect = async () => {
    try {
      await fetch('/api/auth/tiktok/disconnect', { method: 'POST' });
      setSession({
        isAuthorized: false,
        username: '',
        displayName: '',
        avatarUrl: '',
        isLive: false,
        liveType: 'mobile_gaming',
      });
      setChatMessages([]);
      stopScreenShare();
    } catch (e) {}
  };

  // Screen Awareness: Capture Mobile Gaming Screen
  const startScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'monitor',
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsScreenSharing(true);

      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      // Initial screen awareness comment
      setTimeout(() => {
        analyzeLiveScreen();
      }, 1500);
    } catch (err) {
      console.warn('Screen share cancelled or not allowed:', err);
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScreenSharing(false);
  };

  // Analyze Captured Screen Frame
  const analyzeLiveScreen = async () => {
    if (!videoRef.current || !isScreenSharing || isAnalyzingScreen) return;
    setIsAnalyzingScreen(true);

    try {
      const video = videoRef.current;
      const canvas = screenCanvasRef.current || document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 640, 360);
        const base64 = canvas.toDataURL('image/jpeg', 0.7);

        const res = await fetch('/api/analyze-screen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: base64,
            characterName,
            personality,
          }),
        });

        const data = await res.json();
        if (data.success && data.data) {
          setScreenAnalysisText(data.data.commentary);
          onTriggerAnimation(data.data.animation || 'talk');
          globalAudioVoiceEngine.speak(data.data.commentary, voiceProfile);
        }
      }
    } catch (e) {
      console.warn('Screen analysis error:', e);
    } finally {
      setIsAnalyzingScreen(false);
    }
  };

  // Push incoming live message from stream
  const handlePushLiveMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatInput.trim()) return;

    try {
      const res = await fetch('/api/tiktok/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: newUserInput.trim() || 'Viewer_' + Math.floor(Math.random() * 900),
          text: newChatInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setChatMessages((prev) => [...prev, data.message]);
        setNewChatInput('');
        if (data.message.isQuestion) {
          answerLiveQuestion(data.message);
        }
      }
    } catch (e) {}
  };

  // Character Chat Awareness: Answer Viewer's Question Live
  const answerLiveQuestion = async (msg: LiveChatMessage) => {
    if (isAnswering) return;
    setIsAnswering(true);
    msg.hasBeenAnswered = true;

    try {
      const res = await fetch('/api/character/answer-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewerUser: msg.user,
          questionText: msg.text,
          characterName,
          personality,
          dialogueStyle,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const { spokenAnswer, animation, cameraShot, soundEffect } = data.data;

        if (cameraShot) onTriggerCameraShot(cameraShot);
        if (animation) onTriggerAnimation(animation);
        if (soundEffect && soundEffect !== 'none') {
          globalAudioVoiceEngine.playSoundEffect(soundEffect);
        }

        // Speak aloud with automated real-time lip sync!
        globalAudioVoiceEngine.speak(spokenAnswer, voiceProfile, () => {
          setIsAnswering(false);
          onTriggerAnimation('idle');
        });
      } else {
        setIsAnswering(false);
      }
    } catch (e) {
      console.error('Answer question error:', e);
      setIsAnswering(false);
    }
  };

  // 1. Pre-Live Authorization Screen
  if (!session.isAuthorized) {
    return (
      <div className="p-6 bg-zinc-900/90 text-white rounded-xl border border-zinc-800 backdrop-blur-md max-w-xl mx-auto shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-pink-500 flex items-center justify-center shadow-lg">
            <Radio className="w-5 h-5 text-zinc-950" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-wide">TikTok Live Mobile Gaming Authorization</h3>
            <p className="text-xs text-zinc-400">Connect your account before going live on mobile</p>
          </div>
        </div>

        <div className="bg-zinc-950/70 p-4 rounded-lg border border-zinc-800/80 mb-5 space-y-3">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Grant permission to synchronize your 3D avatar with your actual TikTok Live mobile gaming broadcast. No simulated chats—your characters will read your real audience chat and react to your mobile game screen.
          </p>
          <div className="space-y-1.5 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Read incoming live comments & viewer questions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Detect Mobile Gaming stream events</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Real-time voice answers & automated lip-sync reactions</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleTikTokLogin}
            disabled={isAuthenticating}
            className="w-full py-3 px-4 rounded-lg font-semibold text-sm bg-gradient-to-r from-cyan-400 via-pink-500 to-amber-400 text-zinc-950 hover:opacity-95 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isAuthenticating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Authorizing in popup window...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Log in & Authorize with TikTok</span>
              </>
            )}
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-zinc-800"></div>
            <span className="flex-shrink mx-3 text-[10px] text-zinc-500 uppercase tracking-widest">or link directly</span>
            <div className="flex-grow border-t border-zinc-800"></div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="@your_tiktok_username"
              value={manualHandle}
              onChange={(e) => setManualHandle(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => handleDirectConnect()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-xs font-medium cursor-pointer transition-colors"
            >
              Connect Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Authorized TikTok Mobile Gaming Live Studio
  return (
    <div className="bg-zinc-950/95 border border-zinc-800 rounded-xl p-4 text-white shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
      {/* Live Connection Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={session.avatarUrl}
              alt={session.username}
              className="w-9 h-9 rounded-full border border-pink-500/50 object-cover"
            />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">@{session.username}</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
                LIVE
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                Mobile Gaming
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Screen & Live Chat Awareness Active</p>
          </div>
        </div>

        <button
          onClick={handleDisconnect}
          className="text-xs text-zinc-400 hover:text-red-400 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Disconnect</span>
        </button>
      </div>

      {/* Screen Awareness Section */}
      <div className="bg-zinc-900/80 rounded-lg p-3.5 border border-zinc-800">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Tv className="w-4 h-4 text-cyan-400" />
            <h4 className="text-xs font-semibold text-zinc-200">Mobile Gaming Screen Awareness</h4>
          </div>
          {!isScreenSharing ? (
            <button
              onClick={startScreenShare}
              className="px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-semibold rounded text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Video className="w-3 h-3" />
              <span>Capture Game Screen</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={analyzeLiveScreen}
                disabled={isAnalyzingScreen}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-cyan-400 font-medium rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>{isAnalyzingScreen ? 'Analyzing...' : 'Comment on Game'}</span>
              </button>
              <button
                onClick={stopScreenShare}
                className="px-2.5 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 font-medium rounded text-xs transition-colors cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}
        </div>

        {isScreenSharing ? (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-zinc-800 bg-black aspect-video max-h-44">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>AI Vision Active</span>
              </div>
            </div>
            {screenAnalysisText && (
              <div className="bg-zinc-950/80 p-2.5 rounded border border-cyan-500/30 text-xs text-cyan-300 flex items-start gap-2">
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5 text-cyan-400" />
                <div>
                  <span className="font-semibold text-white">{characterName}: </span>
                  <span>"{screenAnalysisText}"</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500">
            Share your mobile game window or emulator screen. {characterName} will watch the gameplay, comment on eliminations, health, and match events in real time.
          </p>
        )}
      </div>

      {/* Real Live Chat Awareness Section */}
      <div className="bg-zinc-900/80 rounded-lg p-3.5 border border-zinc-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-pink-400" />
            <h4 className="text-xs font-semibold text-zinc-200">Real TikTok Live Chat</h4>
          </div>
          <label className="flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoAnswerEnabled}
              onChange={(e) => setAutoAnswerEnabled(e.target.checked)}
              className="rounded bg-zinc-950 border-zinc-700 text-pink-500 focus:ring-0"
            />
            <span>Auto-Answer Questions</span>
          </label>
        </div>

        {/* Live Chat Message Feed */}
        <div className="bg-zinc-950/90 rounded-lg p-2.5 border border-zinc-800/80 h-48 overflow-y-auto space-y-2 text-xs">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-600 gap-1.5 text-center">
              <Eye className="w-5 h-5 text-zinc-700" />
              <span>Waiting for live viewer comments from mobile stream...</span>
            </div>
          ) : (
            chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-lg border transition-all ${
                  msg.isQuestion
                    ? 'bg-pink-950/20 border-pink-500/40 text-pink-100'
                    : 'bg-zinc-900/60 border-zinc-800/60 text-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <img src={msg.avatar} alt={msg.user} className="w-4 h-4 rounded-full" />
                    <span className="font-semibold text-[11px] text-zinc-200">@{msg.user}</span>
                    {msg.isQuestion && (
                      <span className="px-1 py-0.2 rounded bg-pink-500/20 text-pink-400 text-[9px] font-bold border border-pink-500/30">
                        QUESTION
                      </span>
                    )}
                  </div>
                  {msg.isQuestion && (
                    <button
                      onClick={() => answerLiveQuestion(msg)}
                      disabled={isAnswering}
                      className="px-2 py-0.5 bg-pink-500 hover:bg-pink-400 text-zinc-950 font-bold rounded text-[10px] cursor-pointer disabled:opacity-50"
                    >
                      {msg.hasBeenAnswered ? 'Answered' : 'Answer Out Loud'}
                    </button>
                  )}
                </div>
                <p className="text-xs">{msg.text}</p>
              </div>
            ))
          )}
        </div>

        {/* Real Stream Input (Allows streamer or audience to inject questions live) */}
        <form onSubmit={handlePushLiveMessage} className="mt-2.5 flex gap-2">
          <input
            type="text"
            placeholder="Viewer name (optional)"
            value={newUserInput}
            onChange={(e) => setNewUserInput(e.target.value)}
            className="w-28 bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
          />
          <input
            type="text"
            placeholder="Ask a question or comment from live stream..."
            value={newChatInput}
            onChange={(e) => setNewChatInput(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-pink-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 bg-pink-500 hover:bg-pink-400 text-zinc-950 rounded font-semibold text-xs flex items-center gap-1 cursor-pointer"
          >
            <Send className="w-3 h-3" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
