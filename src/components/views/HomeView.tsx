import React, { useState, useEffect, useRef } from 'react';
import { Search, Volume2, VolumeX, Ticket as TicketIcon, Zap, Star, BarChart3, ChevronRight, Clock, Radio, Play, Pause, X, ShieldCheck, Gift } from 'lucide-react';
import { Ticket, Artist, Category, PlatformNotice, User } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface HomeViewProps {
  tickets: Ticket[];
  artists: Artist[];
  categories: Category[];
  notices: PlatformNotice[];
  user: User | null;
  onSelectTicket: (ticket: Ticket) => void;
  onPlayTrack: (ticket: Ticket) => void;
  onNavigateTab: (tab: any) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  tickets = [],
  notices = [],
  onSelectTicket,
  onNavigateTab
}) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [utcCountdown, setUtcCountdown] = useState('');
  const [voiceLoop, setVoiceLoop] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const safeTickets = tickets || [];

  // Live 24-hour UTC countdown timer (continuous 24-hour cycle)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0));
      const diffMs = nextUtc.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      setUtcCountdown(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Voice Announcement Play/Stop function using Web Speech API
  const handleToggleVoice = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device/browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    // Play a modern notification chime using Web Audio API before speaking
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.36);
      }
    } catch {}

    const textToSpeak = notices[0]?.content ||
      'Official HBO JAMBASE announcement: USDT TRC20 and BEP20 crypto recharge channels are active. Minimum recharge is $10.00 USDT. Daily Grab income is active. All member earnings are exclusively generated through the Grab feature.';

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      if (voiceLoop) {
        setTimeout(() => {
          if (voiceLoop) {
            window.speechSynthesis.speak(utterance);
          } else {
            setIsSpeaking(false);
          }
        }, 3000);
      } else {
        setIsSpeaking(false);
      }
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Stop voice on component unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Filter tickets by category and search term
  const filteredTickets = safeTickets.filter(ticket => {
    const matchesCat =
      selectedCategory === 'all' ||
      ticket.category?.toLowerCase() === selectedCategory.toLowerCase() ||
      (selectedCategory === 'concert' && (ticket.category?.toLowerCase().includes('concert') || ticket.category?.toLowerCase() === 'concert')) ||
      (selectedCategory === 'festival' && ticket.category?.toLowerCase().includes('festival')) ||
      (selectedCategory === 'live-show' && (ticket.category?.toLowerCase().includes('live') || ticket.category?.toLowerCase() === 'live show'));

    const matchesSearch =
      !searchQuery ||
      (ticket.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.artist || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.venue || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.location || '').toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCat && matchesSearch;
  });

  // Filter categories matching the exact flex tabs
  const categoriesList = [
    { id: 'all', name: 'All Events', slug: 'all' },
    { id: 'music', name: 'Music', slug: 'music' },
    { id: 'concert', name: 'Concerts', slug: 'concert' },
    { id: 'festival', name: 'Festivals', slug: 'festival' },
    { id: 'live-show', name: 'Live Shows', slug: 'live-show' }
  ];

  return (
    <div id="home-view-container" className="pb-28 space-y-3.5">
      {/* 1. HERO SHOWCASE CARD (Matching Reference Image) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#2b080b] via-[#1a0507] to-[#0a0203] border border-[#E5A93C]/40 p-4 sm:p-5 shadow-2xl shadow-black/90">
        {/* Stage lighting background with crowd */}
        <div
          className="absolute inset-0 opacity-30 bg-cover bg-center pointer-events-none mix-blend-screen"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&auto=format&fit=crop&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/80 pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Stylized Red Ribbon HBO Logo & Main Brand Title */}
          <div className="text-center pt-1">
            <div className="flex justify-center mb-1">
              <svg className="w-11 h-9 text-red-600 drop-shadow-[0_2px_10px_rgba(220,38,38,0.8)]" viewBox="0 0 44 36" fill="currentColor">
                <path d="M12 2L26 16L19 23L5 9L12 2Z" fill="#DC2626" />
                <path d="M22 12L36 26L29 33L15 19L22 12Z" fill="#EF4444" />
              </svg>
            </div>

            <div className="inline-flex items-baseline justify-center tracking-tight">
              <span className="font-black text-3xl sm:text-4xl text-red-600 drop-shadow-[0_2px_12px_rgba(220,38,38,0.6)]">
                HBO
              </span>
              <span className="font-black text-3xl sm:text-4xl text-[#E5A93C] tracking-wide ml-2 drop-shadow-[0_2px_12px_rgba(229,169,60,0.5)]">
                JAMBASE
              </span>
            </div>

            <div className="flex items-center justify-center gap-2 my-1">
              <div className="h-[1px] w-14 bg-gradient-to-r from-transparent to-[#E5A93C]"></div>
              <span className="font-extrabold text-[10px] tracking-[0.3em] text-[#E5A93C]">
                MUSIC
              </span>
              <div className="h-[1px] w-14 bg-gradient-to-l from-transparent to-[#E5A93C]"></div>
            </div>

            <p className="text-center font-bold text-xs sm:text-sm text-white tracking-[0.18em] mt-2">
              LIVE TOURS • CONCERTS • FESTIVALS
            </p>
          </div>

          {/* 3 Circular Feature Pillars in a Row */}
          <div className="grid grid-cols-3 gap-2 pt-4 mt-2 border-t border-white/10">
            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#800f1c] to-[#3a060a] border border-[#E5A93C]/60 flex items-center justify-center shadow-lg shadow-black/60 mb-1.5">
                <TicketIcon size={18} className="text-[#E5A93C]" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">World Stadium Tours</span>
              <span className="text-[11px] text-[#E5A93C] mt-0.5">Top Events</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#800f1c] to-[#3a060a] border border-[#E5A93C]/60 flex items-center justify-center shadow-lg shadow-black/60 mb-1.5">
                <Star size={18} className="text-[#E5A93C]" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">Live Concerts</span>
              <span className="text-[11px] text-[#E5A93C] mt-0.5">Global Artists</span>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#800f1c] to-[#3a060a] border border-[#E5A93C]/60 flex items-center justify-center shadow-lg shadow-black/60 mb-1.5">
                <BarChart3 size={18} className="text-[#E5A93C]" />
              </div>
              <span className="text-xs font-bold text-white leading-tight">Daily Opportunities</span>
              <span className="text-[11px] text-[#E5A93C] mt-0.5">Grow With Us</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. VALUE / FEATURE STRIP (1-Min Fast Settle | Ticket Yield | Daily Tickets | Explore Tickets) */}
      <div className="rounded-2xl bg-[#0c0507] border border-neutral-800/90 p-3 sm:p-3.5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <Zap size={22} className="text-red-600 fill-red-600 shrink-0" />
          <div>
            <div className="text-sm font-black text-white leading-none">1-Min</div>
            <div className="text-[11px] text-neutral-400 mt-1">Fast Settle</div>
          </div>
        </div>

        <div className="border-l border-neutral-800/80 pl-3 sm:pl-4">
          <div className="text-sm font-black text-[#E5A93C] leading-none">1.9% – 5.0%</div>
          <div className="text-[11px] text-neutral-400 mt-1">Ticket Yield</div>
        </div>

        <div className="border-l border-neutral-800/80 pl-3 sm:pl-4">
          <div className="text-sm font-black text-[#E5A93C] leading-none">Multiple</div>
          <div className="text-[11px] text-neutral-400 mt-1">Daily Tickets</div>
        </div>

        <button
          onClick={() => {
            const el = document.getElementById('popular-events-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#991b1b] to-[#7f1d1d] hover:from-[#b91c1c] hover:to-[#991b1b] text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-950/50 active:scale-95 transition-all"
        >
          <TicketIcon size={13} className="text-[#E5A93C]" />
          <span className="whitespace-nowrap">Explore Tickets</span>
        </button>
      </div>

      {/* 3. CONTINUOUS 24-HOUR ANNOUNCEMENT & VOICE NOTIFICATION BAR */}
      <div
        onClick={() => setShowNoticeModal(true)}
        className="rounded-2xl bg-[#0e0608] border border-neutral-800/90 hover:border-red-900/60 p-2.5 sm:p-3 flex items-center justify-between cursor-pointer transition-all shadow-md group relative overflow-hidden"
      >
        {/* Left Side: Voice Icon with Broadcast Pulse + 'notify:' label */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            title={isSpeaking ? "Pause Voice Broadcast" : "Listen to 24-Hour Voice Announcement"}
            onClick={handleToggleVoice}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isSpeaking
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/50 animate-pulse'
                : 'bg-neutral-900 hover:bg-neutral-800 text-red-500 border border-neutral-800'
            }`}
          >
            {isSpeaking ? <Volume2 size={16} className="animate-bounce" /> : <Volume2 size={16} />}
          </button>
          <span className="text-red-500 font-extrabold text-xs tracking-wide uppercase">notify:</span>
        </div>

        {/* Center: Running Marquee Text running continuously */}
        <div className="flex-1 overflow-hidden mx-2.5 relative">
          <div className="whitespace-nowrap text-xs text-neutral-200 font-medium inline-block animate-marquee">
            📢 {notices[0]?.title || 'USDT TRC20 & BEP20 Official Crypto Recharge Active'} •
            🌟 Exclusive VIP Income: Earn 1.9% to 6.0% Daily Compound Yield Exclusively via Grab •
            💳 Instant Crypto Withdrawals (5% Fee) • 24/7 VIP Support • Reset at 00:00 UTC
          </div>
        </div>

        {/* Right Side: 24h Live Broadcast Indicator & Timer */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/60 border border-red-800/60 text-[10px] text-amber-300 font-mono font-bold">
            <Radio size={11} className="text-red-400 animate-pulse" />
            <span>24h Live • {utcCountdown}</span>
          </div>
          <ChevronRight size={16} className="text-neutral-500 group-hover:text-neutral-300 transition-colors" />
        </div>
      </div>

      {/* 4. SEARCH BAR */}
      <div className="relative rounded-2xl bg-[#0e0608] border border-neutral-800/90 overflow-hidden shadow-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search tickets, artists, venues..."
          className="w-full bg-transparent pl-11 pr-4 py-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-red-600 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-white"
          >
            Clear
          </button>
        )}
      </div>

      {/* 5. CATEGORY FILTER BUTTONS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categoriesList.map((cat) => {
          const isActive = selectedCategory === cat.slug;
          return (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-4 py-2 rounded-full text-xs whitespace-nowrap font-bold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#6b0f1a] to-[#450a11] text-white border border-red-600 shadow-sm shadow-red-950/40'
                  : 'bg-[#0e0608] text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* 6. POPULAR EVENTS SECTION */}
      <div id="popular-events-section" className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">Popular Events</h3>
            <span className="px-2 py-0.5 rounded-full bg-[#0e0608] border border-neutral-800 text-[11px] text-neutral-400">
              {filteredTickets.length} events
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="text-xs font-bold text-red-600 hover:text-red-500 flex items-center gap-0.5 transition-colors"
          >
            <span>More</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Event Cards (Horizontal Scrolling Grid matching reference flex) */}
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none snap-x">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              id={`ticket-card-${ticket.id}`}
              className="w-[162px] sm:w-[178px] shrink-0 snap-start rounded-2xl bg-[#0e0608] border border-neutral-800/90 hover:border-red-900/60 overflow-hidden flex flex-col transition-all duration-200 shadow-md"
            >
              {/* Event Image */}
              <div className="relative aspect-square w-full bg-neutral-900 overflow-hidden">
                <img
                  src={ticket.image}
                  alt={ticket.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {/* Voucher Badge on Top Right */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm border border-[#E5A93C]/60 text-[#E5A93C] text-[10px] font-bold">
                  Voucher:{ticket.voucherQty}
                </div>
              </div>

              {/* Event Details Content */}
              <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white truncate leading-tight">
                    {ticket.name}
                  </h4>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {ticket.artist}
                  </p>
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">
                    Voucher:{ticket.voucherQty}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-red-600">
                    ${ticket.price.toLocaleString()} USDT
                  </span>
                </div>

                {/* Event Details Button (Viewing Only - No Purchase Option) */}
                <button
                  onClick={() => onSelectTicket(ticket)}
                  className="mt-2.5 w-full py-1.5 sm:py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1 transition-all active:scale-95"
                >
                  <TicketIcon size={12} className="text-[#E5A93C]" />
                  <span>Event Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 24-HOUR OFFICIAL ANNOUNCEMENT & VOICE BROADCAST MODAL */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#160c0e] border border-[#3d181c] rounded-3xl p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <h3 className="text-sm font-extrabold text-white">24-Hour Voice Announcement</h3>
              </div>
              <button
                onClick={() => setShowNoticeModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {/* 24h Cycle Timer & Status Banner */}
            <div className="p-3 rounded-2xl bg-gradient-to-r from-red-950/40 to-black border border-red-800/40 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-neutral-300">
                <Radio size={16} className="text-red-400 animate-pulse" />
                <span>Broadcasting for 24 Hours</span>
              </div>
              <span className="font-mono font-bold text-amber-300 bg-black/60 px-2.5 py-1 rounded-lg border border-neutral-800">
                Resets in: {utcCountdown}
              </span>
            </div>

            {/* Main Announcement Content */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto p-1 text-xs leading-relaxed text-neutral-300">
              <h4 className="font-bold text-white text-sm">
                {notices[0]?.title || 'USDT TRC20 & BEP20 Official Crypto Recharge Active'}
              </h4>
              <p className="text-neutral-400">
                {notices[0]?.content || 'Members can recharge their accounts directly in USDT via TRC20 or BEP20 crypto transfer. Minimum recharge is $10.00 USDT. Fast admin verification upon TxID submission.'}
              </p>

              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1">
                <span className="font-bold text-[#E5A93C] flex items-center gap-1">
                  <Gift size={13} /> Member Income Rules:
                </span>
                <p className="text-[11px] text-neutral-400">
                  Ticket purchase is closed. The only way to earn member income is through the <strong>Grab</strong> feature. Maintain account balance at or above $10.00 USDT to generate daily VIP dividends.
                </p>
              </div>
            </div>

            {/* Voice Broadcast Controls */}
            <div className="pt-2 border-t border-neutral-800 space-y-2">
              <button
                onClick={() => handleToggleVoice()}
                className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all ${
                  isSpeaking
                    ? 'bg-red-700 hover:bg-red-800 text-white animate-pulse shadow-red-700/40'
                    : 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white shadow-red-950/50'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <Pause size={15} />
                    <span>Pause Voice Broadcast</span>
                  </>
                ) : (
                  <>
                    <Play size={15} />
                    <span>Play Audible Announcement (Speech)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400">
                <span>Continuous 24h Loop:</span>
                <button
                  type="button"
                  onClick={() => setVoiceLoop(!voiceLoop)}
                  className={`px-3 py-1 rounded-full font-bold transition-colors ${
                    voiceLoop
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {voiceLoop ? 'Loop Enabled' : 'Single Play'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
