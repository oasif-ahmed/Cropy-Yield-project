import {
  LayoutDashboard, Users, Map, Sprout, CloudSun, TrendingUp, Sparkles,
  FlaskConical, Bug, Droplets, Banknote, BarChart3, BrainCircuit, UserCog, Bell, Target, Leaf, Bot, ShieldCheck,
} from 'lucide-react';

export const heroStats = [
  { key: 'farmers', value: '5,000+', bn: '৫,০০০+' },
  { key: 'precision', value: 'AI-driven', bn: 'AI নির্ভর' },
  { key: 'coverage', value: 'All 8 divisions', bn: '৮টি বিভাগ' },
  { key: 'yield', value: 'Yield lift', bn: 'ফলন বৃদ্ধি' },
];

export const problems = [
  {
    icon: Target,
    title: { bn: 'অনিশ্চিত ফলন', en: 'Uncertain Yields' },
    body: {
      bn: 'কৃষকরা জানেন না মৌসুমে কী ফলন পাবেন — পরিকল্পনা করা কঠিন।',
      en: 'Farmers rarely know what to expect each season, making planning unpredictable.',
    },
    tone: 'rose',
  },
  {
    icon: Leaf,
    title: { bn: 'রোগ–পোকা দেরিতে ধরা পড়ে', en: 'Late Disease Detection' },
    body: {
      bn: 'ফসলের রোগ চোখে পড়লে ততক্ষণে অনেক ক্ষতি হয়ে যায়।',
      en: 'By the time crop disease is spotted with the eye, much damage is already done.',
    },
    tone: 'amber',
  },
  {
    icon: CloudSun,
    title: { bn: 'জলবায়ু নির্ভর কৃষি', en: 'Climate-Dependent Farming' },
    body: {
      bn: 'আবহাওয়া ও মাটির অবস্থা বদলায়, কিন্তু সিদ্ধান্ত একই থাকে।',
      en: 'Weather and soil change constantly, but decisions often stay static.',
    },
    tone: 'sky',
  },
  {
    icon: BarChart3,
    title: { bn: 'বাজারে সঠিক দাম নেই', en: 'No Clear Market Insight' },
    body: {
      bn: 'কখন, কোথায়, কী দামে বিক্রি করবেন — তা বোঝা কঠিন।',
      en: 'Knowing when, where, and at what price to sell is difficult to judge.',
    },
    tone: 'emerald',
  },
];

export const features = [
  {
    key: 'dashboard',
    icon: LayoutDashboard,
    to: '/dashboard',
    tone: 'emerald',
    title: { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
    tagline: { bn: 'পুরো খামারের এক নজর', en: 'Your farm at a glance' },
    description: {
      bn: 'কৃষক, জমি, উৎপাদন ও আয়ের লাইভ সারসংক্ষেপ। এক জায়গায় সব পরিসংখ্যান, প্রবণতা ও গুরুত্বপূর্ণ সতর্কতা দেখুন।',
      en: 'Live summary of farmers, land, production and income. See all key stats, trends and critical alerts in one place.',
    },
    benefits: [
      { bn: 'রিয়েল-টাইম মেট্রিক্স', en: 'Real-time metrics' },
      { bn: 'উৎপাদন ও আয়ের প্রবণতা', en: 'Production & revenue trends' },
      {
        bn: 'দ্রুত সিদ্ধান্ত নেওয়া',
        en: 'Faster decision-making',
      },
    ],
  },
  {
    key: 'farmers',
    icon: Users,
    to: '/farmers',
    tone: 'indigo',
    title: { bn: 'কৃষক ব্যবস্থাপনা', en: 'Farmer Management' },
    tagline: { bn: 'প্রতিটি কৃষকের রেকর্ড', en: 'Records for every farmer' },
    description: {
      bn: 'কৃষকদের তথ্য, যোগাযোগ ও বিভাগভিত্তিক বিতরণ এক জায়গায় পরিচালনা করুন, যাতে সেবা সবাইকে পৌঁছায়।',
      en: 'Manage farmer profiles, contact info and division-wise distribution so support reaches everyone.',
    },
    benefits: [
      { bn: 'কেন্দ্রীয় প্রোফাইল', en: 'Central profiles' },
      { bn: 'বিভাগভিত্তিক হাল', en: 'Division-wise overview' },
      { bn: 'সহজ অনুসন্ধান', en: 'Easy search' },
    ],
  },
  {
    key: 'lands',
    icon: Map,
    to: '/lands',
    tone: 'blue',
    title: { bn: 'জমি ব্যবস্থাপনা', en: 'Land Management' },
    tagline: { bn: 'জমি ও খণ্ডের মানচিত্র', en: 'Map your land & plots' },
    description: {
      bn: 'জমির খণ্ড, বিঘা, অবস্থান ও ম্যাপ রেকর্ড করুন। ইন্টার‌্যাক্টিভ ম্যাপে জমির সঠিক বিবরণ দেখা যায়।',
      en: 'Record land plots, bighas, location and maps. View accurate land details on an interactive map.',
    },
    benefits: [
      { bn: 'ম্যাপ-ভিত্তিক রেকর্ড', en: 'Map-based records' },
      { bn: 'খণ্ড ও বিঘা হিসাব', en: 'Plot & bigha tracking' },
      { bn: 'সঠিক অবস্থান', en: 'Accurate location' },
    ],
  },
  {
    key: 'crops',
    icon: Sprout,
    to: '/crops',
    tone: 'green',
    title: { bn: 'ফসল ট্র্যাকিং', en: 'Crop Tracking' },
    tagline: { bn: 'চাষ থেকে ফসল তোলা', en: 'From planting to harvest' },
    description: {
      bn: 'কোন ফসল, কত জমিতে, কী অবস্থায় চলছে — পুরো চাষের জীবনচক্র ট্র্যাক করুন এবং ফলন রেকর্ড করুন।',
      en: 'Track which crops are growing, in how much land, and their stage — capturing the full crop lifecycle and yields.',
    },
    benefits: [
      { bn: 'চাষের জীবনচক্র', en: 'Full lifecycle' },
      { bn: 'ফলন রেকর্ড', en: 'Yield records' },
      { bn: 'ফসলভিত্তিক হিসাব', en: 'Per-crop analytics' },
    ],
  },
  {
    key: 'weather',
    icon: CloudSun,
    to: '/weather',
    tone: 'sky',
    title: { bn: 'আবহাওয়া পূর্বাভাস', en: 'Weather Forecast' },
    tagline: { bn: 'আবহাওয়া অনুযায়ী পরিকল্পনা', en: 'Plan with the weather' },
    description: {
      bn: 'নিজের বিভাগের বর্তমান আবহাওয়া ও ৭ দিনের পূর্বাভাস পান — সেচ ও ফসলের সময় ঠিক করতে কাজে লাগে।',
      en: 'Get current weather and 7-day forecasts for your division — crucial for irrigation and crop timing.',
    },
    benefits: [
      { bn: '৭ দিনের পূর্বাভাস', en: '7-day forecast' },
      { bn: 'বিভাগভিত্তিক তথ্য', en: 'Division-specific data' },
      { bn: 'সেচ সিদ্ধান্তে সহায়ক', en: 'Smart irrigation' },
    ],
  },
  {
    key: 'forecast',
    icon: TrendingUp,
    to: '/forecast',
    tone: 'violet',
    title: { bn: 'ফলন পূর্বাভাস', en: 'AI Yield Forecast' },
    tagline: { bn: 'ভবিষ্যৎ ফলন আগে থেকেই', en: 'Know your yield in advance' },
    description: {
      bn: 'মেশিন-লার্নিং মডেল ব্যবহার করে আবহাওয়া, মাটি ও ইতিহাসের ভিত্তিতে ভবিষ্যৎ ফলন অনুমান করুন।',
      en: 'ML models estimate future yields based on weather, soil and historical data — before harvest.',
    },
    benefits: [
      { bn: 'এআই-ভিত্তিক অনুমান', en: 'AI-based estimates' },
      { bn: 'ঝুঁকি আগে বোঝা', en: 'Early risk awareness' },
      { bn: 'বাজার পরিকল্পনা', en: 'Better market planning' },
    ],
  },
  {
    key: 'recommendations',
    icon: Sparkles,
    to: '/recommendations',
    tone: 'amber',
    title: { bn: 'AI ফসল সুপারিশ', en: 'AI Crop Recommendations' },
    tagline: { bn: 'কোন ফসল সবচেয়ে ভালো?', en: 'Which crop fits best?' },
    description: {
      bn: 'মাটির গুণাগুণ ও পরিবেশ অনুযায়ী কোন ফসল চাষ করলে সর্বোচ্চ ফলন পাবেন — মেশিন দিয়ে সিদ্ধান্ত নিন।',
      en: 'Let the machine decide which crop gives the best yield for your soil and environment.',
    },
    benefits: [
      { bn: 'ব্যক্তিগত সুপারিশ', en: 'Personalized advice' },
      { bn: 'সর্বোচ্চ ফলন', en: 'Maximum yield' },
      { bn: 'মাটি-উপযুক্ত ফসল', en: 'Soil-matched choices' },
    ],
  },
  {
    key: 'soil',
    icon: FlaskConical,
    to: '/soil',
    tone: 'teal',
    title: { bn: 'মৃত্তিকা পরীক্ষা', en: 'Soil Testing' },
    tagline: { bn: 'মাটির প্রকৃত অবস্থা', en: 'Know your soil' },
    description: {
      bn: 'মাটির pH, নাইট্রোজেন, ফসফরাস ও পটাশিয়াম রেকর্ড করুন এবং কোন সার কত লাগবে বুঝুন।',
      en: 'Record soil pH, nitrogen, phosphorus and potassium — and understand exactly what your soil needs.',
    },
    benefits: [
      { bn: 'পুষ্টি বিশ্লেষণ', en: 'Nutrient analysis' },
      { bn: 'সার পরিকল্পনা', en: 'Fertilizer planning' },
      { bn: 'স্বাস্থ্যকর মাটি', en: 'Healthy soil' },
    ],
  },
  {
    key: 'diseases',
    icon: Bug,
    to: '/diseases',
    tone: 'rose',
    title: { bn: 'রোগ–পোকা শনাক্তকরণ', en: 'Pest & Disease Detection' },
    tagline: { bn: 'ছবিতেই রোগ শনাক্ত', en: 'Detect disease from a photo' },
    description: {
      bn: 'ফসলের ছবি তুলে মেশিন-লার্নিং দিয়ে রোগ ও পোকা শনাক্ত করুন, সাথে সমাধানের পরামর্শ পান।',
      en: 'Upload a photo of your crop and use ML to identify pests & diseases, with treatment advice.',
    },
    benefits: [
      { bn: 'ইমেজ শনাক্তকরণ', en: 'Image detection' },
      { bn: 'দ্রুত সমাধান', en: 'Fast solutions' },
      { bn: 'ফসল রক্ষা', en: 'Protect your harvest' },
    ],
  },
  {
    key: 'advisories',
    icon: Droplets,
    to: '/advisories',
    tone: 'cyan',
    title: { bn: 'সার ও সেচ পরামর্শ', en: 'Fertilizer & Irrigation' },
    tagline: { bn: 'ঠিক সময়ে, ঠিক পরিমাণে', en: 'Right time, right amount' },
    description: {
      bn: 'মাটি ও আবহাওয়ার ভিত্তিতে কখন, কত সার দেবেন এবং সেচ দেবেন — এআই তৈরি পরামর্শ পান।',
      en: 'AI-generated advisories on when and how much to fertilize and irrigate, based on soil and weather.',
    },
    benefits: [
      { bn: 'এআই তৈরি পরামর্শ', en: 'AI advisories' },
      { bn: 'সার সাশ্রয়', en: 'Save on inputs' },
      { bn: 'উৎপাদন বাড়ানো', en: 'Boost production' },
    ],
  },
  {
    key: 'market',
    icon: Banknote,
    to: '/market',
    tone: 'yellow',
    title: { bn: 'বাজারদর', en: 'Market Prices' },
    tagline: { bn: 'সঠিক দামে বিক্রি করুন', en: 'Sell at the right price' },
    description: {
      bn: 'বিভিন্ন ফসলের বাজারদর দেখুন ও তুলনা করুন — কোথায়, কখন বিক্রি করলে লাভ বেশি তা বুঝুন।',
      en: 'View and compare market prices for crops to understand where and when selling gives the best return.',
    },
    benefits: [
      { bn: 'ফসলভিত্তিক দর', en: 'Crop-wise prices' },
      { bn: 'লাভের তুলনা', en: 'Profit comparison' },
      { bn: 'স্মার্ট বিক্রয়', en: 'Smart selling' },
    ],
  },
  {
    key: 'reports',
    icon: BarChart3,
    to: '/reports',
    tone: 'indigo',
    title: { bn: 'রিপোর্ট ও বিশ্লেষণ', en: 'Reports & Analytics' },
    tagline: { bn: 'ডেটা দিয়ে সিদ্ধান্ত', en: 'Data-driven decisions' },
    description: {
      bn: 'কর্মকর্তা ও অ্যাডমিনদের জন্য বিস্তারিত রিপোর্ট — জমি, উৎপাদন, আয় ও ফলনের গভীর বিশ্লেষণ।',
      en: 'Detailed reports for officers & admins — deep analysis of land, production, income and yield.',
    },
    benefits: [
      { bn: 'গভীর বিশ্লেষণ', en: 'Deep analytics' },
      { bn: 'রপ্তানি যোগ্য', en: 'Exportable' },
      { bn: 'নীতিনির্ধারণে সহায়ক', en: 'Policy support' },
    ],
  },
  {
    key: 'ainsights',
    icon: BrainCircuit,
    to: '/ai-monitor',
    tone: 'violet',
    title: { bn: 'AI মনিটরিং', en: 'AI Monitoring' },
    tagline: { bn: 'মডেলের স্বাস্থ্য দেখা', en: 'Watch the models' },
    description: {
      bn: 'অ্যাডমিনরা দেখে মেশিন-লার্নিং মডেল কেমন কাজ করছে — নির্ভুলতা, সংস্করণ ও স্বাস্থ্য পর্যবেক্ষণ।',
      en: 'Admins monitor how the ML models are performing — accuracy, versions and health at a glance.',
    },
    benefits: [
      { bn: 'মডেল স্বাস্থ্য', en: 'Model health' },
      { bn: 'নির্ভুলতা ট্র্যাকিং', en: 'Accuracy tracking' },
      { bn: 'আস্থা বৃদ্ধি', en: 'Build trust' },
    ],
  },
  {
    key: 'users',
    icon: UserCog,
    to: '/users',
    tone: 'rose',
    title: { bn: 'ব্যবহারকারী', en: 'User Management' },
    tagline: { bn: 'ভূমিকা ও প্রবেশাধিকার', en: 'Roles & access' },
    description: {
      bn: 'অ্যাডমিনরা কৃষক, কর্মকর্তা ও অ্যাডমিনের ভূমিকা ভাগ করে দেন — নিরাপদ ও নিয়ন্ত্রিত প্রবেশাধিকার।',
      en: 'Admins assign farmer, officer and admin roles for secure, controlled access.',
    },
    benefits: [
      { bn: 'ভূমিকা নিয়ন্ত্রণ', en: 'Role control' },
      { bn: 'নিরাপত্তা', en: 'Security' },
      { bn: 'সহজ ব্যবস্থাপনা', en: 'Easy administration' },
    ],
  },
  {
    key: 'notifications',
    icon: Bell,
    to: '/notifications',
    tone: 'amber',
    title: { bn: 'বিজ্ঞপ্তি', en: 'Notifications' },
    tagline: { bn: 'গুরুত্বপূর্ণ খবর সবার আগে', en: 'Stay informed first' },
    description: {
      bn: 'রোগ–পোকা সতর্কতা, ফসল তোলার সময়সূচি ও গুরুত্বপূর্ণ আপডেট সরাসরি বিজ্ঞপ্তিতে পান।',
      en: 'Pest alerts, harvest schedules and important updates delivered straight to your notifications.',
    },
    benefits: [
      { bn: 'সতর্কতা', en: 'Alerts' },
      { bn: 'সময়মতো জানানো', en: 'Timely info' },
      { bn: 'কোনো খবর মিস নয়', en: 'Nothing missed' },
    ],
  },
];

export const howItWorks = [
  {
    icon: ShieldCheck,
    step: { bn: '০১', en: '01' },
    title: { bn: 'রেজিস্টার ও প্রোফাইল', en: 'Register & Profile' },
    body: {
      bn: 'কৃষক, কর্মকর্তা বা অ্যাডমিন হিসেবে সাইন আপ করুন এবং নিজের বিভাগ ও জমির তথ্য দিন।',
      en: 'Sign up as a farmer, officer or admin and add your division and land details.',
    },
  },
  {
    icon: Bot,
    step: { bn: '০২', en: '02' },
    title: { bn: 'AI বিশ্লেষণ করুন', en: 'Let AI analyze' },
    body: {
      bn: 'আবহাওয়া, মাটি ও ফসলের তথ্য দিন — মেশিন-লার্নিং মডেল ফলন, রোগ ও সুপারিশ প্রস্তুত করে।',
      en: 'Provide weather, soil and crop data — ML models generate yields, disease and recommendations.',
    },
  },
  {
    icon: Sprout,
    step: { bn: '০৩', en: '03' },
    title: { bn: 'সঠিক সিদ্ধান্ত নিন', en: 'Decide with confidence' },
    body: {
      bn: 'পূর্বাভাস ও পরামর্শের ভিত্তিতে চাষ, সার, সেচ ও বিক্রয়ের সিদ্ধান্ত নিন।',
      en: 'Make planting, fertilizing, irrigation and selling decisions based on forecasts and advice.',
    },
  },
];
