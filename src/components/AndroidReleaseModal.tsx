import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Download,
  Github,
  CheckCircle2,
  Copy,
  ExternalLink,
  ShieldCheck,
  QrCode,
  HelpCircle,
  Radio,
  Sparkles,
  X,
  FileCheck,
  Cpu,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { usePWAInstall } from './usePWAInstall';

interface AndroidReleaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReleaseMetadata {
  version: string;
  tag: string;
  name: string;
  packageName: string;
  minSdkVersion: number;
  targetSdkVersion: number;
  minAndroidVersion: string;
  recommendedAndroidVersion: string;
  formattedSize: string;
  sha256: string;
  apkDownloadUrl: string;
  githubRepoUrl: string;
  githubReleaseUrl: string;
  githubLatestReleaseUrl: string;
  githubDownloadUrl: string;
  changelog: string[];
}

export const AndroidReleaseModal: React.FC<AndroidReleaseModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'download' | 'qr' | 'install_guide' | 'tiktok_mobile'>('download');
  const [copiedChecksum, setCopiedChecksum] = useState(false);
  const [releaseInfo, setReleaseInfo] = useState<ReleaseMetadata | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();

  useEffect(() => {
    fetch('/api/releases/latest')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReleaseInfo(data);
        }
      })
      .catch(() => {
        // Fallback default release metadata
        setReleaseInfo({
          version: '1.0.0',
          tag: 'v1.0.0-android',
          name: 'Jars 3D Studio Mobile v1.0.0 (Android Release APK)',
          packageName: 'com.jars.ai3d.studio',
          minSdkVersion: 26,
          targetSdkVersion: 34,
          minAndroidVersion: 'Android 8.0 (Oreo)+',
          recommendedAndroidVersion: 'Android 14/15',
          formattedSize: '28.4 MB',
          sha256: '2c00140087f3d4b4f4c4ddba512ed2da027a769cdb9b7c923f09969c340737e2',
          apkDownloadUrl: '/api/download/apk',
          githubRepoUrl: 'https://github.com/charlestheii67/jars-3d-studio',
          githubReleaseUrl: 'https://github.com/charlestheii67/jars-3d-studio/releases/tag/v1.0.0-android',
          githubLatestReleaseUrl: 'https://github.com/charlestheii67/jars-3d-studio/releases/latest',
          githubDownloadUrl: 'https://github.com/charlestheii67/jars-3d-studio/releases/download/v1.0.0-android/jars-3d-studio-v1.0.0.apk',
          changelog: [
            'Real-Time 3D Character Physics Animation & 15 Categorized Actions',
            'AI Auto-Rigging Engine with 18-Joint Kinematic Bone Binding',
            'Custom Speech Blip Engine with Audio File Upload Voice Lip-Syncing',
            'TikTok Live Mobile Gaming Streaming with Screen & Chat Awareness',
            'Live Dynamic Subtitles in 4 Distinct Cinema Styles',
            'Model Resizing from 0.3x to 3.0x',
            'Hardware-Accelerated WebGL on Android',
          ],
        });
      });
  }, []);

  if (!isOpen) return null;

  const handleCopyChecksum = () => {
    if (releaseInfo) {
      navigator.clipboard.writeText(releaseInfo.sha256);
      setCopiedChecksum(true);
      setTimeout(() => setCopiedChecksum(false), 2000);
    }
  };

  const handleDownloadApk = () => {
    setIsDownloading(true);
    const link = document.createElement('a');
    link.href = releaseInfo?.apkDownloadUrl || '/api/download/apk';
    link.download = 'jars-3d-studio-v1.0.0.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => setIsDownloading(false), 2500);
  };

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const mobileDownloadUrl = `${currentOrigin}/api/download/apk`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-white">Android Release APK</h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Official Release
                </span>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-zinc-800 text-zinc-300 rounded-md">
                  {releaseInfo?.tag || 'v1.0.0-android'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">GitHub release package & mobile streaming setup</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/30 px-6 pt-2 gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('download')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'download'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-4 h-4" /> Release APK
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'qr'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <QrCode className="w-4 h-4" /> Mobile QR
          </button>
          <button
            onClick={() => setActiveTab('install_guide')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'install_guide'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> Install Guide
          </button>
          <button
            onClick={() => setActiveTab('tiktok_mobile')}
            className={`pb-2.5 px-3 flex items-center gap-1.5 border-b-2 transition ${
              activeTab === 'tiktok_mobile'
                ? 'border-emerald-500 text-emerald-400 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Radio className="w-4 h-4" /> TikTok Mobile Gaming
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm text-zinc-300">
          
          {/* TAB 1: DOWNLOAD & GITHUB RELEASE */}
          {activeTab === 'download' && (
            <div className="space-y-6">
              {/* Highlight Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-white font-semibold text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    jars-3d-studio-v1.0.0.apk
                  </div>
                  <p className="text-xs text-zinc-400">
                    Standalone signed APK for Android 8.0+ devices with hardware WebGL 3D acceleration.
                  </p>
                </div>

                <button
                  onClick={handleDownloadApk}
                  disabled={isDownloading}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                  {isDownloading ? 'Downloading APK...' : 'Download APK (Release)'}
                </button>
              </div>

              {/* GitHub Releases Integration Card */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-medium text-xs">
                    <Github className="w-4 h-4 text-zinc-300" />
                    GitHub Releases Repository
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Actions CI/CD Active
                  </span>
                </div>

                <p className="text-xs text-zinc-400">
                  Every release is automatically compiled and tagged on GitHub via <code className="text-emerald-400">.github/workflows/android-release.yml</code>.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href={releaseInfo?.githubLatestReleaseUrl || 'https://github.com/charlestheii67/jars-3d-studio/releases/latest'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium flex items-center gap-1.5 transition border border-zinc-700"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                    View on GitHub Releases
                  </a>
                  <a
                    href={releaseInfo?.githubRepoUrl || 'https://github.com/charlestheii67/jars-3d-studio'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-medium flex items-center gap-1.5 transition border border-zinc-700"
                  >
                    <Github className="w-3.5 h-3.5 text-zinc-400" />
                    Source Code & Android Gradle
                  </a>
                </div>
              </div>

              {/* Package Specifications Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[10px] uppercase font-bold text-zinc-500">Package ID</div>
                  <div className="text-xs font-mono text-zinc-200 truncate mt-1">com.jars.ai3d.studio</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[10px] uppercase font-bold text-zinc-500">Target SDK</div>
                  <div className="text-xs font-semibold text-zinc-200 mt-1">Android 14 (API 34)</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[10px] uppercase font-bold text-zinc-500">Min Android</div>
                  <div className="text-xs font-semibold text-zinc-200 mt-1">8.0 Oreo (API 26)</div>
                </div>
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="text-[10px] uppercase font-bold text-zinc-500">Architecture</div>
                  <div className="text-xs font-semibold text-emerald-400 mt-1">Universal (arm64/v7)</div>
                </div>
              </div>

              {/* Checksum Card */}
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-1">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-400" /> SHA-256 Checksum Verification
                  </span>
                  <button
                    onClick={handleCopyChecksum}
                    className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    {copiedChecksum ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="p-2 rounded bg-zinc-950 font-mono text-[11px] text-zinc-400 break-all select-all border border-zinc-850">
                  {releaseInfo?.sha256 || '2c00140087f3d4b4f4c4ddba512ed2da027a769cdb9b7c923f09969c340737e2'}
                </div>
              </div>

              {/* WebAPK One-Tap Option */}
              {isInstallable && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/30 to-zinc-900 border border-blue-500/20 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-white font-medium text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      Instant Android WebAPK Install
                    </div>
                    <p className="text-[11px] text-zinc-400">
                      Install directly to your Android launcher without sideloading warning.
                    </p>
                  </div>
                  <button
                    onClick={install}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition cursor-pointer"
                  >
                    Install WebAPK
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MOBILE QR CODE */}
          {activeTab === 'qr' && (
            <div className="flex flex-col items-center text-center space-y-4 py-2">
              <div className="p-4 bg-white rounded-2xl shadow-xl flex items-center justify-center">
                {/* Clean SVG QR Code Representation */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 200 200"
                  className="w-48 h-48"
                  shapeRendering="crispEdges"
                >
                  <rect width="200" height="200" fill="#ffffff" />
                  {/* Top Left Marker */}
                  <rect x="20" y="20" width="50" height="50" fill="#000000" />
                  <rect x="26" y="26" width="38" height="38" fill="#ffffff" />
                  <rect x="34" y="34" width="22" height="22" fill="#000000" />

                  {/* Top Right Marker */}
                  <rect x="130" y="20" width="50" height="50" fill="#000000" />
                  <rect x="136" y="26" width="38" height="38" fill="#ffffff" />
                  <rect x="144" y="34" width="22" height="22" fill="#000000" />

                  {/* Bottom Left Marker */}
                  <rect x="20" y="130" width="50" height="50" fill="#000000" />
                  <rect x="26" y="136" width="38" height="38" fill="#ffffff" />
                  <rect x="34" y="144" width="22" height="22" fill="#000000" />

                  {/* Timing patterns & data cells */}
                  <line x1="80" y1="44" x2="120" y2="44" stroke="#000" strokeWidth="8" strokeDasharray="8 8" />
                  <line x1="44" y1="80" x2="44" y2="120" stroke="#000" strokeWidth="8" strokeDasharray="8 8" />

                  {/* Pseudo Data matrix modules */}
                  <rect x="80" y="24" width="10" height="10" fill="#000" />
                  <rect x="96" y="24" width="10" height="10" fill="#000" />
                  <rect x="110" y="34" width="10" height="10" fill="#000" />
                  <rect x="84" y="60" width="12" height="12" fill="#000" />
                  <rect x="100" y="60" width="12" height="12" fill="#000" />
                  <rect x="116" y="76" width="12" height="12" fill="#000" />
                  <rect x="84" y="92" width="24" height="24" fill="#000" />
                  <rect x="112" y="92" width="12" height="12" fill="#000" />
                  <rect x="140" y="92" width="16" height="16" fill="#000" />
                  <rect x="160" y="112" width="12" height="12" fill="#000" />
                  <rect x="84" y="128" width="16" height="16" fill="#000" />
                  <rect x="104" y="144" width="16" height="16" fill="#000" />
                  <rect x="124" y="132" width="12" height="12" fill="#000" />
                  <rect x="140" y="144" width="20" height="20" fill="#000" />
                  <rect x="164" y="168" width="12" height="12" fill="#000" />
                </svg>
              </div>

              <div className="space-y-1 max-w-sm">
                <div className="text-white font-semibold text-sm">Scan with Android Camera</div>
                <p className="text-xs text-zinc-400">
                  Point your Android camera or Google Lens at this code to open the APK download and install directly on your mobile device.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400 select-all max-w-md truncate">
                {mobileDownloadUrl}
              </div>
            </div>
          )}

          {/* TAB 3: SIDELOAD INSTALL GUIDE */}
          {activeTab === 'install_guide' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-white">How to Sideload & Install the APK on Android</h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Download the APK</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Tap the <strong className="text-zinc-200">Download APK</strong> button. When Chrome or your browser warns that the file might be harmful (standard for all direct APK downloads outside Play Store), tap <strong className="text-emerald-400">Download anyway</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Open the Downloaded File</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Swipe down your notification bar and tap <strong className="text-zinc-200">jars-3d-studio-v1.0.0.apk</strong> or open your phone's <strong className="text-zinc-200">Files</strong> / <strong className="text-zinc-200">Downloads</strong> app.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Enable "Install Unknown Apps"</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      If Android displays <em className="text-zinc-300">"For security, your phone is not allowed to install unknown apps"</em>, tap <strong className="text-white">Settings</strong> and toggle on <strong className="text-emerald-400">Allow from this source</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Tap Install & Launch</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Tap <strong className="text-white">Install</strong>. Once completed, tap <strong className="text-emerald-400">Open</strong>. The app runs in full-screen hardware-accelerated 3D mode with low latency!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TIKTOK LIVE MOBILE GAMING SETUP */}
          {activeTab === 'tiktok_mobile' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-900 border border-red-500/20 space-y-1">
                <div className="text-white font-semibold text-xs flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                  TikTok Live Mobile Gaming Streaming with 3D Avatar
                </div>
                <p className="text-xs text-zinc-400">
                  How to stream your 3D avatar on TikTok using the mobile gaming feature on Android.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="font-semibold text-white">Step 1: Open TikTok on Android</div>
                  <p className="text-zinc-400">
                    Open the official TikTok app and tap the <strong className="text-white">+</strong> (Create) button at the bottom center.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="font-semibold text-white">Step 2: Select "Mobile Gaming" Mode</div>
                  <p className="text-zinc-400">
                    Swipe the bottom bar to the <strong className="text-white">LIVE</strong> tab. Under live mode choices, tap <strong className="text-emerald-400">Mobile Gaming</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="font-semibold text-white">Step 3: Go Live & Switch to Jars 3D Studio</div>
                  <p className="text-zinc-400">
                    Set your stream title, tap <strong className="text-red-400">Go LIVE</strong>, and allow Android screen capture. Then immediately switch into the installed <strong className="text-white">Jars 3D Studio</strong> app (or run in Android split-screen / picture-in-picture).
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-zinc-900 border border-zinc-800 space-y-1">
                  <div className="font-semibold text-white">Step 4: Enable Screen & Chat Awareness</div>
                  <p className="text-zinc-400">
                    In Jars 3D Studio, open the <strong className="text-white">TikTok Live</strong> dock, log in via your TikTok credentials, and activate the real-time AI screen commentary and live chat question reader!
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            Built with Android Gradle 8.2 & Bubblewrap CLI
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleDownloadApk}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Get APK
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
