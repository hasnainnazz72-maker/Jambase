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
      {/* 1. HBO JAMBASE MUSIC CONCERT & TOUR SHOWCASE (Home Page Top Flex Showcase) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2b0c0e] via-[#1a0a0c] to-[#0d0405] border border-[#DC2626]/40 p-4 sm:p-5 shadow-2xl shadow-black/80">
        <div 
          className="absolute inset-0 opacity-25 bg-cover bg-center pointer-events-none mix-blend-luminosity"
          style={{ backgroundImage: `url('https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80')` }}
        />
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-[#DC2626]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#E5A93C]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          {/* Header Tag */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5A93C] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E5A93C]"></span>
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#E5A93C] flex items-center gap-1.5">
                <Sparkles size={12} /> HBO JAMBASE MUSIC
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#DC2626]/20 border border-[#DC2626]/40 text-[#FCA5A5] text-[10px] font-bold">
              LIVE TOURS 2026
            </span>
          </div>

          {/* Main Headline */}
          <div>
            <h2 className="text-lg font-black text-white tracking-tight leading-tight">
              World Stadium Tours & Live Music Festivals
            </h2>
            <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
              Official live concert access, tour bookings, and verified festival experiences worldwide.
            </p>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="p-2 rounded-xl bg-black/60 border border-[#DC2626]/30 text-center">
              <div className="text-[#E5A93C] text-xs font-black">Official</div>
              <div className="text-[10px] text-neutral-400 font-medium mt-0.5">Live Access</div>
            </div>
            <div className="p-2 rounded-xl bg-black/60 border border-[#DC2626]/30 text-center">
              <div className="text-[#E5A93C] text-xs font-black">Worldwide</div>
              <div className="text-[10px] text-neutral-400 font-medium mt-0.5">Global Tours</div>
            </div>
            <div className="p-2 rounded-xl bg-black/60 border border-[#DC2626]/30 text-center">
              <div className="text-[#E5A93C] text-xs font-black">VIP Pass</div>
              <div className="text-[10px] text-neutral-400 font-medium mt-0.5">Instant Booking</div>
            </div>
          </div>

          {/* Bottom Action Strip */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-300 font-medium">
              <Zap size={13} className="text-[#E5A93C]" />
              <span>Verified Music Event Access</span>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById('popular-events-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#EF4444] hover:to-[#DC2626] text-white text-xs font-extrabold shadow-md shadow-[#DC2626]/30 transition-transform active:scale-95 flex items-center gap-1.5 border border-[#E5A93C]/40"
            >
              <TicketIcon size={13} className="text-[#E5A93C]" />
              <span>{t('home.popularList', 'Explore Tickets')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. NOTIFICATION MARQUEE */}
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs">
        <Volume2 size={15} className="text-[#E5A93C] shrink-0 animate-bounce" />
        <div className="overflow-hidden whitespace-nowrap text-neutral-300 font-medium">
          <div className="inline-block animate-marquee">
            <span className="text-[#E5A93C] font-bold mr-1">notify:</span>
            {notices[0]?.title || 'Welcome to HBO JAMBASE MUSIC! Daily Grab income is now live for all VIP tiers.'}
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
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#DC2626] transition-colors"
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
            className="text-xs text-[#E5A93C] font-semibold hover:underline flex items-center gap-0.5"
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
                      ? 'ring-2 ring-[#DC2626] shadow-[0_0_12px_#DC2626]'
                      : 'border border-neutral-700 group-hover:border-[#E5A93C]'
                  }`}
                >
                  <img
                    src={artist.avatar}
                    alt={artist.name}
                    className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="mt-1.5 text-[11px] font-medium text-neutral-300 text-center leading-tight line-clamp-2 w-full group-hover:text-[#E5A93C]">
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
                  ? 'bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white font-bold shadow-md shadow-[#DC2626]/20 border border-[#E5A93C]/40'
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
            className="text-xs text-[#E5A93C] font-semibold hover:underline flex items-center gap-0.5"
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
              className="bg-[#140b0d] border border-[#2d171a] hover:border-[#DC2626]/60 rounded-2xl overflow-hidden flex flex-col group transition-all duration-200 hover:shadow-lg hover:shadow-black/70"
            >
              {/* Event Image with Red/Gold Play Circle at Bottom-Right */}
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

                {/* Circular Red Music Play Button with Gold Icon */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayTrack(ticket);
                  }}
                  title="Play preview"
                  className="absolute bottom-2.5 right-2.5 w-9 h-9 rounded-full bg-gradient-to-tr from-[#DC2626] to-[#EF4444] hover:from-[#EF4444] hover:to-[#F87171] text-[#FDE047] flex items-center justify-center shadow-lg shadow-black/60 transition-transform active:scale-90 border border-[#E5A93C]/30"
                >
                  <Music size={16} fill="currentColor" />
                </button>
              </div>

              {/* Card Meta Content */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white leading-tight line-clamp-1 group-hover:text-[#E5A93C] transition-colors">
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
                    <span className="text-sm font-extrabold text-[#E5A93C]">
                      {ticket.price.toLocaleString()} ETB
                    </span>
                  </div>
                </div>

                {/* Buy Button */}
                <button
                  onClick={() => onSelectTicket(ticket)}
                  className="mt-2 w-full py-1.5 rounded-lg bg-neutral-900 border border-neutral-800 hover:border-[#DC2626] hover:bg-gradient-to-r hover:from-[#DC2626] hover:to-[#B91C1C] text-neutral-200 hover:text-white text-xs font-extrabold transition-all active:scale-95 flex items-center justify-center gap-1"
                >
                  <TicketIcon size={12} className="text-[#E5A93C]" />
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
