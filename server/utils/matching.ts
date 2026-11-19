export interface SkillRecord {
  id: number;
  user_id: number;
  name: string;
  category: string;
  direction: 'teach' | 'learn';
  proficiency: string;
  description: string;
  peers_taught: number;
}

export interface PeerUserRecord {
  id: number;
  full_name: string;
  email: string;
  bio: string;
  location: string;
  major: string;
  year: string;
  experience_level: string;
  availability: string;
  avatar_url: string;
  points: number;
  total_sessions: number;
  rating_avg: number;
  rating_count: number;
}

export interface MatchResult {
  peer: PeerUserRecord;
  teachSkills: SkillRecord[];
  learnSkills: SkillRecord[];
  matchPercentage: number;
  isMutualMatch: boolean;
  theyTeachYouCanLearn: string[];
  youTeachTheyWant: string[];
  compatibilityExplanation: string;
}

const STOP_WORDS = new Set([
  'and', 'for', 'the', 'with', 'basics', 'fundamentals', 'introduction', 'intro', 'to', 'of', 'in', '101',
]);

function normalizeTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s+#]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function skillsOverlap(skillA: SkillRecord, skillB: SkillRecord): boolean {
  const nameA = skillA.name.toLowerCase().trim();
  const nameB = skillB.name.toLowerCase().trim();
  if (nameA === nameB || nameA.includes(nameB) || nameB.includes(nameA)) {
    return true;
  }

  const tokensA = normalizeTokens(nameA);
  const tokensB = normalizeTokens(nameB);
  const sharedTokens = tokensA.filter((t) => tokensB.includes(t));
  if (sharedTokens.length >= 1) {
    return true;
  }

  return false;
}

export function computePeerMatch(
  currentTeach: SkillRecord[],
  currentLearn: SkillRecord[],
  peer: PeerUserRecord,
  peerTeach: SkillRecord[],
  peerLearn: SkillRecord[]
): MatchResult {
  // 1. Skills peer can teach that current user wants to learn
  const theyTeachYouCanLearn: string[] = [];
  for (const pt of peerTeach) {
    if (currentLearn.some((cl) => skillsOverlap(pt, cl))) {
      theyTeachYouCanLearn.push(pt.name);
    }
  }

  // 2. Skills current user can teach that peer wants to learn
  const youTeachTheyWant: string[] = [];
  for (const ct of currentTeach) {
    if (peerLearn.some((pl) => skillsOverlap(ct, pl))) {
      youTeachTheyWant.push(ct.name);
    }
  }

  // 3. Category overlap bonus if exact skill name wasn't matched
  const currentLearnCats = new Set(currentLearn.map((s) => s.category));
  const currentTeachCats = new Set(currentTeach.map((s) => s.category));
  const peerTeachCatHits = peerTeach.filter((s) => currentLearnCats.has(s.category)).length;
  const peerLearnCatHits = peerLearn.filter((s) => currentTeachCats.has(s.category)).length;

  const hasForwardMatch = theyTeachYouCanLearn.length > 0;
  const hasReverseMatch = youTeachTheyWant.length > 0;
  const isMutualMatch = hasForwardMatch && hasReverseMatch;

  let score = 15; // base campus peer compatibility
  if (isMutualMatch) {
    score = 78 + Math.min(22, (theyTeachYouCanLearn.length + youTeachTheyWant.length) * 6);
  } else if (hasForwardMatch || hasReverseMatch) {
    score = 48 + Math.min(24, (theyTeachYouCanLearn.length + youTeachTheyWant.length) * 8 + (peerTeachCatHits + peerLearnCatHits) * 4);
  } else if (peerTeachCatHits > 0 || peerLearnCatHits > 0) {
    score = 30 + Math.min(20, (peerTeachCatHits + peerLearnCatHits) * 7);
  }

  const matchPercentage = Math.min(100, Math.max(15, score));

  let compatibilityExplanation = '';
  if (isMutualMatch) {
    compatibilityExplanation = `Direct 1:1 mutual swap: ${peer.full_name} teaches ${theyTeachYouCanLearn.slice(0, 2).join(', ')} while seeking ${youTeachTheyWant.slice(0, 2).join(', ')} that you teach.`;
  } else if (hasForwardMatch) {
    compatibilityExplanation = `${peer.full_name} teaches ${theyTeachYouCanLearn.slice(0, 2).join(', ')}, which matches your learning goals.`;
  } else if (hasReverseMatch) {
    compatibilityExplanation = `${peer.full_name} wants to learn ${youTeachTheyWant.slice(0, 2).join(', ')}, which matches what you teach.`;
  } else if (peerTeachCatHits > 0 || peerLearnCatHits > 0) {
    compatibilityExplanation = `Shared interest areas across ${Array.from(new Set([...peerTeach.map((s) => s.category)])).slice(0, 2).join(' & ')}.`;
  } else {
    compatibilityExplanation = `Active peer on ${peer.location} open to cross-disciplinary skill swaps.`;
  }

  return {
    peer,
    teachSkills: peerTeach,
    learnSkills: peerLearn,
    matchPercentage,
    isMutualMatch,
    theyTeachYouCanLearn,
    youTeachTheyWant,
    compatibilityExplanation,
  };
}
