import React, { useState } from 'react';
import { Search, Volume2, Music, Ticket as TicketIcon, Sparkles, ChevronRight, Play, Award, Zap } from 'lucide-react';
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
  artists = [],
  categories = [],
  notices = [],
  user,
  onSelectTicket,
  onPlayTrack,
  onNavigateTab
}) => {
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArtist, setSelectedArtist] = useState<string | null>(null);

  const safeTickets = tickets || [];

  // Filter tickets
  const filteredTickets = safeTickets.filter(ticket => {
    const matchesCat = selectedCategory === 'all' || ticket.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      (ticket.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.artist || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.venue || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ticket.location || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArtist = !selectedArtist || (ticket.artist || '').toLowerCase().includes(selectedArtist.toLowerCase());
    return matchesCat && matchesSearch && matchesArtist;
  });

  const popularTickets = filteredTickets.filter(t => t.isPopular || true);

  return (
    <div id="home-view-container" className="pb-28 space-y-5">
      {/* 1. JAMBASE OFFICIAL CONCERT & TOUR FLEX SHOWCASE (Home Page Top Showcase) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#071d13] via-[#0b1219] to-[#08090d] border border-[#00D26A]/40 p-4 sm:p-5 shadow-2xl shadow-black/80">
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none mix-blend-luminosity"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80')` }}
        />
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#00D26A]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Header Tag */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00D26A] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00D26A]"></span>
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#00D26A] flex items-center gap-1.5">
                <Sparkles size={12} /> JAMBASE VIP CONCERT PASS
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#00D26A]/15 border border-[#00D26A]/30 text-[#00D26A] text-[10px] font-bold">
              LIVE TOURS 2026
            </span>
          </div>

          {/* Main Headline */}
          <div>
            <h2 className="text-lg font-black text-white tracking-tight leading-tight">
              World Stadium Tours & Live Festival Yields
            </h2>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              Hold authentic concert tickets and earn daily returns backed by live global music event revenues.
            </p>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-black/50 border border-neutral-800 text-center">
              <div className="text-[#00D26A] text-xs font-black">1-Min</div>
              <div className="text-[10px] text-neutral-400 font-medium mt-0.5">Fast Settle</div>
            </div>
            <div className="p-2 rounded-xl bg-black/50 border border-neutral-800 text-center">
              <div className="text-[#00D26A] text-xs font-black">1.9% - 6.0%</div>
              <div className="text-[10px] text-neutral-400 font-medium mt-0.5">Ticket Yield</div>
            </div>
            <div className="p-2 rounded-xl bg-black/50 border border-neutral-800 text-center">
              <div className="text-[#00D26A] text-xs font-black">Multiple</div>
              <div className="text-[10px] text-neutral-400 font-medium mt-0.5">Daily Tickets</div>
            </div>
          </div>

          {/* Bottom Action Strip */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 font-medium">
              <Zap size={13} className="text-[#00D26A]" />
              <span>Verified Global Music Assets</span>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('popular-events-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3 py-1.5 rounded-xl bg-[#00D26A] hover:bg-[#00e875] text-black text-xs font-extrabold shadow-md shadow-[#00D26A]/20 transition-transform active:scale-95 flex items-center gap-1"
            >
              <TicketIcon size={13} />
              <span>{t('home.popularList', 'Explore Tickets')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. NOTIFICATION MARQUEE */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs">
        <Volume2 size={15} className="text-[#00D26A] shrink-0 animate-bounce" />
        <div className="overflow-hidden whitespace-nowrap text-neutral-300 font-medium">
          <div className="inline-block animate-marquee">
            <span className="text-[#00D26A] font-bold mr-1">notify:</span>
            {notices[0]?.title || 'The reward for upgrading to vip2 during festival season is active! Daily yield up to 6.0%.'}
          </div>
        </div>
      </div>

      {/* 3. SEARCH BAR */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('home.searchPlaceholder', 'Search tickets, artists, venues...')}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#00D26A] transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs"
          >
            Clear
          </button>
        )}
      </div>

      {/* 4. STAR RECORD MAN / ARTIST SECTION */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h3 className="text-sm font-extrabold text-white tracking-wide">{t('home.starRecordMan', 'Star record man')}</h3>
          <button
            onClick={() => setSelectedArtist(null)}
            className="text-xs text-[#00D26A] font-semibold hover:underline flex items-center gap-0.5"
          >
            {selectedArtist ? 'Show All' : t('income.more', 'More')}
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Horizontal Scrolling Artist Circles */}
        <div className="flex items-start gap-3.5 overflow-x-auto pb-2 scrollbar-none snap-x">
          {artists.map((artist) => {
            const isSelected = selectedArtist === artist.name;
            return (
              <div
                key={artist.id}
                onClick={() => setSelectedArtist(isSelected ? null : artist.name)}
                className="flex flex-col items-center shrink-0 w-[72px] cursor-pointer group snap-start"
              >
                <div
                  className={`relative w-15 h-15 rounded-full overflow-hidden p-0.5 transition-all ${
                    isSelected
                      ? 'ring-2 ring-[#00D26A] shadow-[0_0_12px_#00D26A]'
                      : 'border border-neutral-700 group-hover:border-[#00D26A]/60'
                  }`}
                >
                  <img
                    src={artist.avatar}
                    alt={artist.name}
                    className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="mt-1.5 text-[11px] font-medium text-neutral-300 text-center leading-tight line-clamp-2 w-full group-hover:text-[#00D26A]">
                  {artist.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. CATEGORY FILTER CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const isActive = selectedCategory.toLowerCase() === cat.slug.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#00D26A] text-black font-bold shadow-md shadow-[#00D26A]/20'
                  : 'bg-neutral-900 text-neutral-400 border border-neutral-800 hover:border-neutral-700 hover:text-neutral-200'
              }`}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* 6. POPULAR LIST */}
      <div id="popular-events-section">
        <div className="flex items-center justify-between mb-3 px-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold text-white tracking-wide">{t('home.popularList', 'Popular list')}</h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400">
              {filteredTickets.length} events
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedArtist(null);
            }}
            className="text-xs text-[#00D26A] font-semibold hover:underline flex items-center gap-0.5"
          >
            {t('income.more', 'More')}
            <ChevronRight size={13} />
          </button>
        </div>

        {/* 2-Column Responsive Card Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          {popularTickets.map((ticket) => (
            <div
              key={ticket.id}
              id={`ticket-card-${ticket.id}`}
              className="bg-[#121319] border border-neutral-800/80 hover:border-[#00D26A]/40 rounded-2xl overflow-hidden flex flex-col group transition-all duration-200 hover:shadow-lg hover:shadow-black/60"
            >
              {/* Event Image with Green Play Circle at Bottom-Right */}
              <div className="relative aspect-square overflow-hidden bg-neutral-900">
                <img
                  src={ticket.image}
                  alt={ticket.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />

                {/* Voucher tag */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm border border-neutral-700 text-neutral-300 text-[9px] font-semibold">
                  {t('home.voucher', 'Voucher')}:{ticket.voucherQty}
                </div>

                {/* Circular Green Music Play Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayTrack(ticket);
                  }}
                  title="Play preview"
                  className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-[#00D26A] hover:bg-[#00e875] text-white flex items-center justify-center shadow-lg shadow-black/50 transition-transform active:scale-90"
                >
                  <Music size={16} fill="currentColor" />
                </button>
              </div>

              {/* Card Meta Content */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight line-clamp-1 group-hover:text-[#00D26A] transition-colors">
                    {ticket.name}
                  </h4>
                  <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                    {ticket.artist}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between pt-1 border-t border-neutral-800/60">
                  <div className="text-[10px] text-neutral-400 truncate max-w-[70px]">
                    {t('home.voucher', 'Voucher')}:{ticket.voucherQty}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-[#00D26A]">
                      ${ticket.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => onSelectTicket(ticket)}
                  className="mt-2 w-full py-1.5 rounded-lg bg-neutral-800 hover:bg-[#00D26A] text-neutral-200 hover:text-black text-xs font-extrabold transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <TicketIcon size={12} />
                  {t('home.buyNow', 'Buy Now')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
