import { VIPTier, Ticket, Category, Artist, TaskItem, PlatformNotice } from '../types';

export const VIP_TIERS: VIPTier[] = [
  {
    level: 1,
    name: 'VIP 1',
    minBalance: 30,
    maxBalance: 499.99,
    minDirectMembers: 0,
    dailyRate: 0.019, // 1.9%
    description: 'Basic tier with steady 1.9% daily yield. Min balance $30.',
    color: '#00D26A',
    badge: '★ VIP 1'
  },
  {
    level: 2,
    name: 'VIP 2',
    minBalance: 500,
    maxBalance: 1999.99,
    minDirectMembers: 3,
    dailyRate: 0.025, // 2.5%
    description: 'Tier 2 with 2.5% daily yield. Requires 3 valid direct members.',
    color: '#22c55e',
    badge: '★★ VIP 2'
  },
  {
    level: 3,
    name: 'VIP 3',
    minBalance: 2000,
    maxBalance: 4999.99,
    minDirectMembers: 5,
    dailyRate: 0.03, // 3.0%
    description: 'Tier 3 with 3.0% daily yield. Requires 5 valid direct members.',
    color: '#10b981',
    badge: '★★★ VIP 3'
  },
  {
    level: 4,
    name: 'VIP 4',
    minBalance: 5000,
    maxBalance: 19999.99,
    minDirectMembers: 10,
    dailyRate: 0.04, // 4.0%
    description: 'Elite Tier with 4.0% daily yield. Requires 10 valid direct members.',
    color: '#34d399',
    badge: '★★★★ VIP 4'
  },
  {
    level: 5,
    name: 'VIP 5',
    minBalance: 20000,
    maxBalance: 49999.99,
    minDirectMembers: 20,
    dailyRate: 0.05, // 5.0%
    description: 'Executive Tier with 5.0% daily yield. Requires 20 valid direct members.',
    color: '#6ee7b7',
    badge: '★★★★★ VIP 5'
  },
  {
    level: 6,
    name: 'VIP 6',
    minBalance: 50000,
    maxBalance: 500000,
    minDirectMembers: 50,
    dailyRate: 0.06, // 6.0%
    description: 'Royal Diamond Tier with 6.0% daily yield. Requires 50 valid direct members.',
    color: '#a7f3d0',
    badge: '👑 VIP 6'
  }
];

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'All Events', slug: 'all', isActive: true },
  { id: 'cat-2', name: 'Music', slug: 'music', isActive: true },
  { id: 'cat-3', name: 'Concert', slug: 'concert', isActive: true },
  { id: 'cat-4', name: 'Festival', slug: 'festival', isActive: true },
  { id: 'cat-5', name: 'Live Show', slug: 'live-show', isActive: true },
  { id: 'cat-6', name: 'Premium Concert', slug: 'premium', isActive: true },
  { id: 'cat-7', name: 'VIP Event', slug: 'vip-event', isActive: true },
  { id: 'cat-8', name: 'International Event', slug: 'international', isActive: true }
];

export const INITIAL_ARTISTS: Artist[] = [
  {
    id: 'art-1',
    name: 'Ariana Grande',
    genre: 'Pop / R&B',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    followers: '380M',
    bio: 'Global pop sensation and multi-platinum recording icon.'
  },
  {
    id: 'art-2',
    name: 'Billie Eilish',
    genre: 'Alt-Pop / Electronic',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    followers: '120M',
    bio: 'Grammy & Academy Award winning singer-songwriter.'
  },
  {
    id: 'art-3',
    name: 'Bruno Mars',
    genre: 'Funk / Pop / Soul',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    followers: '95M',
    bio: 'Multi-instrumentalist showman & Silk Sonic co-founder.'
  },
  {
    id: 'art-4',
    name: 'Charlie Puth',
    genre: 'Pop / Synth-Pop',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    followers: '45M',
    bio: 'Perfect pitch producer and chart-topping songwriter.'
  },
  {
    id: 'art-5',
    name: 'Chloe Flower',
    genre: 'Classical Crossover',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    followers: '12M',
    bio: 'Virtuoso pianist and cinematic composer combining pop with grand piano.'
  },
  {
    id: 'art-6',
    name: 'The Weeknd',
    genre: 'R&B / Synthwave',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&auto=format&fit=crop&q=80',
    followers: '110M',
    bio: 'Global streaming king and After Hours hitmaker.'
  },
  {
    id: 'art-7',
    name: 'Alan Walker',
    genre: 'EDM / Electro House',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    followers: '44M',
    bio: 'Electronic dance music pioneer known for signature masked shows.'
  }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'tkt-1',
    name: 'At Home with Chloe Flower',
    artist: 'Chloe Flower',
    category: 'Music',
    price: 10,
    voucherQty: 1,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/573/573539_11861866-lq.mp3',
    description: 'An intimate classical crossover concert blending timeless classical melodies with pop rhythm beats.',
    eventDate: '2026-10-15',
    venue: 'Carnegie Grand Symphony Hall',
    location: 'New York, USA',
    vipRequired: 0,
    purchaseLimit: 50,
    maxQuantity: 10,
    soldCount: 1420,
    isActive: true,
    isPopular: true,
    isFeatured: true,
    dailyYieldEst: 1.9
  },
  {
    id: 'tkt-2',
    name: 'Turn It To Praise',
    artist: 'Joseph Seph',
    category: 'Live Show',
    price: 14,
    voucherQty: 1,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/612/612080_11861866-lq.mp3',
    description: 'Soulful live acoustic gospel and indie rock sessions under the night stars.',
    eventDate: '2026-11-02',
    venue: 'The O2 Indigo Arena',
    location: 'London, UK',
    vipRequired: 0,
    purchaseLimit: 50,
    maxQuantity: 10,
    soldCount: 890,
    isActive: true,
    isPopular: true,
    dailyYieldEst: 1.9
  },
  {
    id: 'tkt-3',
    name: 'Born Again',
    artist: 'Rihanna',
    category: 'Concert',
    price: 20,
    voucherQty: 2,
    image: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/612/612093_11861866-lq.mp3',
    description: 'The monumental return stadium tour with immersive stage lighting and pyrotechnics.',
    eventDate: '2026-11-20',
    venue: 'SoFi Stadium',
    location: 'Los Angeles, USA',
    vipRequired: 0,
    purchaseLimit: 30,
    maxQuantity: 10,
    soldCount: 3410,
    isActive: true,
    isPopular: true,
    isFeatured: true,
    dailyYieldEst: 2.1
  },
  {
    id: 'tkt-4',
    name: 'Mine — Special Acoustic',
    artist: 'Audrey Chu',
    category: 'Music',
    price: 18,
    voucherQty: 1,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/573/573539_11861866-lq.mp3',
    description: 'Vulnerable and hypnotic electronic-pop experience featuring full strings quartet.',
    eventDate: '2026-12-05',
    venue: 'MBS Theatre',
    location: 'Singapore',
    vipRequired: 0,
    purchaseLimit: 40,
    maxQuantity: 10,
    soldCount: 620,
    isActive: true,
    isPopular: true,
    dailyYieldEst: 1.9
  },
  {
    id: 'tkt-5',
    name: 'LOST MY DOG Live Tour',
    artist: 'Quavo & Takeoff Tribute',
    category: 'Concert',
    price: 25,
    voucherQty: 2,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/612/612080_11861866-lq.mp3',
    description: 'High energy hip-hop showcase featuring surprise guest appearances and exclusive merch.',
    eventDate: '2026-12-18',
    venue: 'State Farm Arena',
    location: 'Atlanta, USA',
    vipRequired: 0,
    purchaseLimit: 50,
    maxQuantity: 10,
    soldCount: 1980,
    isActive: true,
    isPopular: true,
    dailyYieldEst: 2.2
  },
  {
    id: 'tkt-6',
    name: 'Welcome to Walkerworld',
    artist: 'Alan Walker',
    category: 'Festival',
    price: 35,
    voucherQty: 3,
    image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/612/612093_11861866-lq.mp3',
    description: 'A 360-degree EDM audio-visual realm with cutting-edge laser choreography and LED drones.',
    eventDate: '2026-12-31',
    venue: 'Telenor Arena',
    location: 'Oslo, Norway',
    vipRequired: 0,
    purchaseLimit: 50,
    maxQuantity: 10,
    soldCount: 4890,
    isActive: true,
    isPopular: true,
    isFeatured: true,
    dailyYieldEst: 2.5
  },
  {
    id: 'tkt-7',
    name: 'Flowers Stadium Experience',
    artist: 'Miley Cyrus',
    category: 'Premium Concert',
    price: 10,
    voucherQty: 1,
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80',
    description: 'Record-breaking summer anthem live performance with full orchestra and dancers.',
    eventDate: '2026-10-28',
    venue: 'Wembley Stadium',
    location: 'London, UK',
    vipRequired: 0,
    purchaseLimit: 50,
    maxQuantity: 10,
    soldCount: 5200,
    isActive: true,
    isPopular: true,
    dailyYieldEst: 1.9
  },
  {
    id: 'tkt-8',
    name: 'Lovely Midnight Special',
    artist: 'Billie Eilish & Khalid',
    category: 'VIP Event',
    price: 12,
    voucherQty: 1,
    image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=600&auto=format&fit=crop&q=80',
    description: 'Chilling harmonies and breathtaking acoustic arrangement in an intimate candlelit setup.',
    eventDate: '2026-11-14',
    venue: 'Sydney Opera House',
    location: 'Sydney, Australia',
    vipRequired: 0,
    purchaseLimit: 50,
    maxQuantity: 10,
    soldCount: 2310,
    isActive: true,
    isPopular: true,
    dailyYieldEst: 2.0
  },
  {
    id: 'tkt-9',
    name: 'Mood Neon Rooftop',
    artist: '24kGoldn & Iann Dior',
    category: 'Music',
    price: 13,
    voucherQty: 1,
    image: 'https://images.unsplash.com/photo-1516873240891-4bf014598ab4?w=600&auto=format&fit=crop&q=80',
    description: 'Sunset rooftop electronic and pop party overlooking Tokyo skyline with DJ sets.',
    eventDate: '2026-11-25',
    venue: 'Shibuya Sky Deck',
    location: 'Tokyo, Japan',
    vipRequired: 0,
    purchaseLimit: 50,
    maxQuantity: 10,
    soldCount: 1540,
    isActive: true,
    isPopular: true,
    dailyYieldEst: 1.9
  },
  {
    id: 'tkt-10',
    name: 'As It Was World Tour',
    artist: 'Harry Styles',
    category: 'International Event',
    price: 14,
    voucherQty: 1,
    image: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&auto=format&fit=crop&q=80',
    description: 'Electrifying pop-rock live spectacle featuring sparkling glam fashion and guitar solos.',
    eventDate: '2026-12-10',
    venue: 'Accor Arena',
    location: 'Paris, France',
    vipRequired: 0,
    purchaseLimit: 50,
    maxQuantity: 10,
    soldCount: 3880,
    isActive: true,
    isPopular: true,
    dailyYieldEst: 1.9
  },
  {
    id: 'tkt-11',
    name: 'Starboy Deluxe VIP Lounge',
    artist: 'The Weeknd',
    category: 'VIP Event',
    price: 50,
    voucherQty: 5,
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=600&auto=format&fit=crop&q=80',
    description: 'Ultra VIP access including soundcheck preview, luxury lounge catering, and commemorative vinyl.',
    eventDate: '2027-01-15',
    venue: 'Madison Square Garden',
    location: 'New York, USA',
    vipRequired: 0,
    purchaseLimit: 20,
    maxQuantity: 10,
    soldCount: 740,
    isActive: true,
    isPopular: true,
    dailyYieldEst: 2.5
  },
  {
    id: 'tkt-12',
    name: 'Blinding Lights Super Grand Prix',
    artist: 'The Weeknd & Guests',
    category: 'Premium Concert',
    price: 120,
    voucherQty: 10,
    image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/612/612080_11861866-lq.mp3',
    description: 'The definitive musical climax featuring full futuristic skyline stage and fireworks finale.',
    eventDate: '2027-02-01',
    venue: 'Marina Bay Street Circuit',
    location: 'Singapore',
    vipRequired: 0,
    purchaseLimit: 10,
    maxQuantity: 10,
    soldCount: 420,
    isActive: true,
    isPopular: true,
    dailyYieldEst: 3.0
  }
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-invite-5',
    title: 'Invite 5 valid A-level direct members',
    description: 'Invite 5 valid A-level direct members to claim $15 reward',
    rewardAmount: 15.0,
    rewardType: 'balance',
    progress: 0,
    maxProgress: 5,
    isCompleted: false,
    isClaimed: false,
    icon: 'Users',
    category: 'growth'
  },
  {
    id: 'task-activate-10',
    title: 'Activate 10 valid A-level direct members',
    description: 'Activate 10 valid A-level direct members to claim $30 reward',
    rewardAmount: 30.0,
    rewardType: 'balance',
    progress: 0,
    maxProgress: 10,
    isCompleted: false,
    isClaimed: false,
    icon: 'Users',
    category: 'growth'
  },
  {
    id: 'task-activate-20',
    title: 'Activate 20 valid A-level direct members',
    description: 'Activate 20 valid A-level direct members to claim $100 reward',
    rewardAmount: 100.0,
    rewardType: 'balance',
    progress: 0,
    maxProgress: 20,
    isCompleted: false,
    isClaimed: false,
    icon: 'Users',
    category: 'growth'
  },
  {
    id: 'task-activate-50',
    title: 'Activate 50 valid direct members',
    description: 'Activate 50 valid direct members to claim $500 reward',
    rewardAmount: 500.0,
    rewardType: 'balance',
    progress: 0,
    maxProgress: 50,
    isCompleted: false,
    isClaimed: false,
    icon: 'Users',
    category: 'growth'
  }
];

export const INITIAL_NOTICES: PlatformNotice[] = [
  {
    id: 'n-1',
    title: 'The reward for upgrading to VIP 2 during festival season is +0.6% bonus!',
    content: 'All users who upgrade to VIP 2 by maintaining $500 balance and 3 valid direct investor members will receive an exclusive commemorative ticket bonus!',
    date: '2026-08-28',
    type: 'reward'
  },
  {
    id: 'n-2',
    title: 'Tier VIP Commission Chart Update: Level 1 (16%), Level 2 (8%), Level 3 (4%) active.',
    content: 'Invite your friends to join JAMBASE and earn generous daily multi-tier subordinate income dividends in real time.',
    date: '2026-08-27',
    type: 'upgrade'
  },
  {
    id: 'n-3',
    title: 'System Notice: Daily income engine executes at 00:00 UTC with compound profit.',
    content: 'Minimum balance required for daily yield is $30. Ensure your available + frozen asset balance remains above $30 to maintain uninterrupted daily income.',
    date: '2026-08-26',
    type: 'system'
  }
];
