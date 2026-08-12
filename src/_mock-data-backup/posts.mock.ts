// NOT USED — kept only as reference/seed data. The live store
// (features/posts/hooks/use-posts-data.ts) now reads from Supabase.
// Note: CURRENT_AUTHOR/AUTHORS below was posts' own separate mock
// identity scheme (same bug class fixed across every other domain
// this session).

import { Comment, Post, PostAuthor } from "@/features/posts/types/posts.types";

export const CURRENT_AUTHOR: PostAuthor = {
  id: "me",
  name: "You",
  role: "Pharmacist",
  avatarColor: "#0066cc",
};

const AUTHORS: PostAuthor[] = [
  { id: "a1", name: "Ama Owusu", role: "Pharmacist at Adenta Pharmacy", avatarColor: "#2563eb" },
  { id: "a2", name: "Kwame Asante", role: "Clinical Pharmacist, Tema General Hospital", avatarColor: "#16a34a" },
  { id: "a3", name: "Efua Mensah", role: "Pharmacy Technician", avatarColor: "#9333ea" },
  { id: "a4", name: "Dr. Kojo Boateng", role: "Hospital Specialist, Ridge Hospital", avatarColor: "#d97706" },
  { id: "a5", name: "Abena Darko", role: "Community Pharmacist", avatarColor: "#dc2626" },
];

const MOCK_POSTS: Post[] = [
  {
    id: "1",
    type: "text",
    author: AUTHORS[0],
    text: "Wrapped up a really smooth medication reconciliation session with a patient today — small conversations like that are why I love community pharmacy. What's one thing you did today that reminded you why you got into this field?",
    createdAt: hoursAgo(2),
    likeCount: 18,
    hasLiked: false,
    commentCount: 2,
  },
  {
    id: "2",
    type: "text",
    author: AUTHORS[1],
    text: "PSA for anyone doing ICU rounds this week: our antimicrobial stewardship team just updated the empiric therapy guidelines. Reach out if you'd like the summary sheet — happy to share.",
    createdAt: hoursAgo(6),
    likeCount: 34,
    hasLiked: true,
    commentCount: 1,
  },
  {
    id: "3",
    type: "text",
    author: AUTHORS[2],
    text: "Two years in as a pharmacy technician today! Grateful for every pharmacist who's taken the time to teach me along the way.",
    createdAt: hoursAgo(20),
    likeCount: 52,
    hasLiked: false,
    commentCount: 0,
  },
  {
    id: "4",
    type: "text",
    author: AUTHORS[3],
    text: "Does anyone have experience setting up a chemotherapy compounding checklist for a smaller hospital pharmacy? Trying to bring ours up to a higher standard and would love to compare notes with other oncology pharmacy folks.",
    createdAt: hoursAgo(30),
    likeCount: 9,
    hasLiked: false,
    commentCount: 1,
  },
  {
    id: "5",
    type: "text",
    author: AUTHORS[4],
    text: "Reminder: FDA Ghana's product registration portal is down for maintenance this weekend. Plan your submissions accordingly!",
    createdAt: hoursAgo(48),
    likeCount: 27,
    hasLiked: false,
    commentCount: 0,
  },
  {
    id: "6",
    type: "poll",
    author: AUTHORS[1],
    text: "Curious how the community is handling this lately:",
    poll: {
      question: "What's your biggest challenge with stock shortages right now?",
      options: [
        { id: "o1", label: "Antibiotics", voteCount: 14 },
        { id: "o2", label: "Insulin & diabetes meds", voteCount: 9 },
        { id: "o3", label: "IV fluids", voteCount: 5 },
        { id: "o4", label: "Pain management", voteCount: 3 },
      ],
      votedOptionId: "o1",
      closesAt: daysFromNow(2),
    },
    createdAt: hoursAgo(10),
    likeCount: 12,
    hasLiked: false,
    commentCount: 0,
  },
  {
    id: "7",
    type: "poll",
    author: AUTHORS[3],
    text: "",
    poll: {
      question: "Should more hospital pharmacies offer weekend MTM appointments?",
      options: [
        { id: "o1", label: "Yes, definitely", voteCount: 21 },
        { id: "o2", label: "Only for chronic patients", voteCount: 11 },
        { id: "o3", label: "No, not worth the staffing cost", voteCount: 4 },
      ],
      votedOptionId: null,
    },
    createdAt: hoursAgo(15),
    likeCount: 6,
    hasLiked: false,
    commentCount: 0,
  },
  {
    id: "8",
    type: "news",
    author: AUTHORS[4],
    text: "Worth a read for anyone managing FDA submissions this quarter.",
    news: {
      title: "FDA Ghana Streamlines Product Registration for Generic Medicines",
      summary:
        "The Food and Drugs Authority has announced a revised, faster-track registration process for generic medicine applications, aimed at reducing approval timelines by up to 30%.",
      imageUrl:
        "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&q=80",
      sourceUrl: "https://fdaghana.gov.gh",
    },
    createdAt: hoursAgo(9),
    likeCount: 15,
    hasLiked: false,
    commentCount: 0,
  },
  {
    id: "9",
    type: "news",
    author: AUTHORS[0],
    text: "",
    news: {
      title: "WHO Updates Guidance on Antimicrobial Stewardship in West Africa",
      summary:
        "New guidance emphasizes pharmacist-led stewardship programs as a key lever for reducing antimicrobial resistance across the region, with a call for expanded training resources.",
      sourceUrl: "https://www.who.int",
    },
    createdAt: hoursAgo(33),
    likeCount: 22,
    hasLiked: false,
    commentCount: 0,
  },
  {
    id: "10",
    type: "text",
    author: AUTHORS[2],
    text: "Our team finally finished re-organizing the dispensary shelving this weekend — night and day difference for pick times. A few before/after shots:",
    media: [
      {
        id: "m1",
        type: "image",
        uri: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=900&q=80",
        sizeBytes: 2_400_000,
        width: 900,
        height: 600,
      },
      {
        id: "m2",
        type: "image",
        uri: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=900&q=80",
        sizeBytes: 2_100_000,
        width: 900,
        height: 600,
      },
      {
        id: "m3",
        type: "image",
        uri: "https://images.unsplash.com/photo-1631549916768-4119b2e5f926?w=900&q=80",
        sizeBytes: 1_950_000,
        width: 900,
        height: 600,
      },
    ] as PostMedia[],
    createdAt: hoursAgo(4),
    likeCount: 31,
    hasLiked: false,
    commentCount: 0,
  },
];

const MOCK_COMMENTS: Comment[] = [
  {
    id: "c1",
    postId: "1",
    author: AUTHORS[3],
    text: "This is why community pharmacy matters so much. Great work!",
    createdAt: hoursAgo(1),
  },
  {
    id: "c2",
    postId: "1",
    author: CURRENT_AUTHOR,
    text: "Had a similar moment last week with a diabetic patient finally getting their A1C under control.",
    createdAt: hoursAgo(1),
  },
  {
    id: "c3",
    postId: "2",
    author: AUTHORS[4],
    text: "Please do share, this would help our team too!",
    createdAt: hoursAgo(5),
  },
  {
    id: "c4",
    postId: "4",
    author: AUTHORS[1],
    text: "Happy to hop on a call and walk through ours if that helps.",
    createdAt: hoursAgo(28),
  },
];

