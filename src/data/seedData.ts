import { VIPTier, Ticket, Category, Artist, TaskItem, PlatformNotice } from '../types';

export const VIP_TIERS: VIPTier[] = [
  {
    level: 1,
    name: 'VIP 1',
    minBalance: 10,
    maxBalance: 499,
    minDirectMembers: 0,
    dailyRate: 0.019, // 1.9%
    description: 'VIP 1: $10–$499 with 1.9% daily profit. 0 direct members required.',
    color: '#E5A93C',
    badge: '★ VIP 1'
  },
  {
    level: 2,
    name: 'VIP 2',
    minBalance: 500,
    maxBalance: 1999,
    minDirectMembers: 3,
    dailyRate: 0.025, // 2.5%
    description: 'VIP 2: $500–$1,999 with 2.5% daily profit. 3 valid direct members required.',
    color: '#F59E0B',
    badge: '★★ VIP 2'
  },
  {
    level: 3,
    name: 'VIP 3',
    minBalance: 2000,
    maxBalance: 4999,
    minDirectMembers: 5,
    dailyRate: 0.03, // 3.0%
    description: 'VIP 3: $2,000–$4,999 with 3% daily profit. 5 valid direct members required.',
    color: '#F97316',
    badge: '★★★ VIP 3'
  },
  {
    level: 4,
    name: 'VIP 4',
    minBalance: 5000,
    maxBalance: 20000,
    minDirectMembers: 10,
    dailyRate: 0.04, // 4.0%
    description: 'VIP 4: $5,000–$20,000 with 4% daily profit. 10 valid direct members required.',
    color: '#EF4444',
    badge: '★★★★ VIP 4'
  },
  {
    level: 5,
    name: 'VIP 5',
    minBalance: 20000,
    maxBalance: 50000,
    minDirectMembers: 20,
    dailyRate: 0.05, // 5.0%
    description: 'VIP 5: $20,000–$50,000 with 5% daily profit. 20 valid direct members required.',
    color: '#DC2626',
    badge: '👑 VIP 5'
  },
  {
    level: 6,
    name: 'VIP 6',
    minBalance: 50000,
    maxBalance: 500000,
    minDirectMembers: 50,
    dailyRate: 0.06, // 6.0%
    description: 'VIP 6: $50,000–$500,000 with 6% daily profit. 50 valid direct members required.',
    color: '#A855F7',
    badge: '💎 VIP 6'
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
    id: 'tkt-usd-30',
    name: 'At Home with Chloe Flower',
    artist: 'Chloe Flower',
    category: 'Music',
    price: 30,
    voucherQty: 1,
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/573/573539_11861866-lq.mp3',
    description: 'An intimate classical crossover concert blending timeless melodies with modern rhythmic grandeur.',
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
    id: 'tkt-usd-50',
    name: 'Turn It To Praise Live',
    artist: 'Joseph Seph',
    category: 'Live Show',
    price: 50,
    voucherQty: 1,
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/612/612080_11861866-lq.mp3',
    description: 'Soulful live acoustic gospel and indie rock sessions under the night sky.',
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
    id: 'tkt-usd-100',
    name: 'Mine — Special Acoustic',
    artist: 'Audrey Chu',
    category: 'Music',
    price: 100,
    voucherQty: 1,
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/573/573539_11861866-lq.mp3',
    description: 'Hypnotic electronic-pop acoustic experience featuring a full strings quartet.',
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
    id: 'tkt-usd-200',
    name: 'Born Again Stadium Tour',
    artist: 'Rihanna',
    category: 'Concert',
    price: 200,
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
    id: 'tkt-usd-500',
    name: 'LOST MY DOG Live Tour',
    artist: 'Quavo & Takeoff Tribute',
    category: 'Concert',
    price: 500,
    voucherQty: 2,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/612/612080_11861866-lq.mp3',
    description: 'High energy hip-hop showcase featuring surprise guest appearances and exclusive sound stages.',
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
    id: 'tkt-usd-1000',
    name: 'Welcome to Walkerworld',
    artist: 'Alan Walker',
    category: 'Festival',
    price: 1000,
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
    id: 'tkt-usd-2000',
    name: 'After Hours Til Dawn Stadium Show',
    artist: 'The Weeknd',
    category: 'Premium Concert',
    price: 2000,
    voucherQty: 4,
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/573/573539_11861866-lq.mp3',
    description: 'Global synthwave spectacle featuring world-class visual artistry and diamond hits.',
    eventDate: '2026-11-28',
    venue: 'Wembley Stadium',
    location: 'London, UK',
    vipRequired: 0,
    purchaseLimit: 25,
    maxQuantity: 10,
    soldCount: 5200,
    isActive: true,
    isPopular: true,
    isFeatured: true,
    dailyYieldEst: 3.0
  },
  {
    id: 'tkt-usd-5000',
    name: 'Silk Sonic Las Vegas Residency',
    artist: 'Bruno Mars',
    category: 'VIP Event',
    price: 5000,
    voucherQty: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/612/612080_11861866-lq.mp3',
    description: 'Exclusive 70s funk & soul luxury residency with premier front-row staging and grand acoustic depth.',
    eventDate: '2026-12-12',
    venue: 'Dolby Live at Park MGM',
    location: 'Las Vegas, USA',
    vipRequired: 0,
    purchaseLimit: 15,
    maxQuantity: 10,
    soldCount: 3100,
    isActive: true,
    isPopular: true,
    isFeatured: true,
    dailyYieldEst: 4.0
  },
  {
    id: 'tkt-usd-10000',
    name: 'Royal Diamond Stadium Gala',
    artist: 'Ariana Grande',
    category: 'International Event',
    price: 10000,
    voucherQty: 6,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80',
    audioPreviewUrl: 'https://cdn.freesound.org/previews/612/612093_11861866-lq.mp3',
    description: 'Ultra-exclusive premier diamond gala concert with VIP backstage access and full philharmonic orchestra.',
    eventDate: '2026-12-25',
    venue: 'Tokyo Dome',
    location: 'Tokyo, Japan',
    vipRequired: 0,
    purchaseLimit: 10,
    maxQuantity: 10,
    soldCount: 6800,
    isActive: true,
    isPopular: true,
    isFeatured: true,
    dailyYieldEst: 5.0
  }
];

export const INITIAL_TASKS: TaskItem[] = [
  {
    id: 'task-invite-5',
    title: 'Invite 5 valid members',
    description: 'Invite 5 valid members (≥$30 USDT) to claim $15.00 USDT reward',
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
    id: 'task-invite-10',
    title: 'Invite 10 valid members',
    description: 'Invite 10 valid members (≥$30 USDT) to claim $50.00 USDT reward',
    rewardAmount: 50.0,
    rewardType: 'balance',
    progress: 0,
    maxProgress: 10,
    isCompleted: false,
    isClaimed: false,
    icon: 'Users',
    category: 'growth'
  },
  {
    id: 'task-invite-20',
    title: 'Invite 20 valid members',
    description: 'Invite 20 valid members (≥$30 USDT) to claim $120.00 USDT reward',
    rewardAmount: 120.0,
    rewardType: 'balance',
    progress: 0,
    maxProgress: 20,
    isCompleted: false,
    isClaimed: false,
    icon: 'Users',
    category: 'growth'
  },
  {
    id: 'task-invite-50',
    title: 'Invite 50 valid members',
    description: 'Invite 50 valid members (≥$30 USDT) to claim $300.00 USDT reward',
    rewardAmount: 300.0,
    rewardType: 'balance',
    progress: 0,
    maxProgress: 50,
    isCompleted: false,
    isClaimed: false,
    icon: 'Users',
    category: 'growth'
  },
  {
    id: 'task-invite-100',
    title: 'Invite 100 valid members',
    description: 'Invite 100 valid members (≥$30 USDT) to claim $1,000.00 USDT reward',
    rewardAmount: 1000.0,
    rewardType: 'balance',
    progress: 0,
    maxProgress: 100,
    isCompleted: false,
    isClaimed: false,
    icon: 'Users',
    category: 'growth'
  }
];

export const INITIAL_NOTICES: PlatformNotice[] = [
  {
    id: 'n-1',
    title: 'Official USDT TRC20 and BEP20 Payment Channels Active',
    content: 'Members can recharge and withdraw securely using USDT on Tron (TRC20) and BNB Smart Chain (BEP20). Fast on-chain transaction verification and manual Admin safety checks.',
    date: '2026-08-28',
    type: 'reward'
  },
  {
    id: 'n-2',
    title: 'USD VIP Structure & Daily Multi-Tier Commissions Active',
    content: 'VIP 1 ($10–$499 @ 1.9%) up to VIP 6 ($50,000–$500,000 @ 6.0%). Earn 16% (Level 1), 8% (Level 2), and 4% (Level 3) subordinate dividends in USDT in real time.',
    date: '2026-08-27',
    type: 'upgrade'
  },
  {
    id: 'n-3',
    title: 'System Notice: 24-Hour Daily Income Engine Executes at 00:00 UTC',
    content: 'Minimum balance required for daily yield is $10.00 USDT (VIP 1). Ensure your available balance remains above $10.00 USDT to maintain uninterrupted daily income.',
    date: '2026-08-26',
    type: 'system'
  }
];
