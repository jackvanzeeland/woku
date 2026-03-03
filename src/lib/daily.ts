import { RELEASE_DATE } from './constants';
import words from '../../words.json';

/** Mulberry32 seeded PRNG — returns a function that produces numbers in [0, 1) */
function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Days since RELEASE_DATE using local midnight */
export function getDayIndex(): number {
  const release = new Date(RELEASE_DATE + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.floor((today.getTime() - release.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Deterministic daily word from shuffled word list */
export function getDailyWord(): string {
  const dayIndex = getDayIndex();
  // Use a fixed seed to shuffle the word list deterministically
  const rng = mulberry32(123456789);
  const shuffled = [...(words as string[])];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled[dayIndex % shuffled.length];
}

/** Deterministic seed for puzzle generation for today's puzzle */
export function getDailySeed(): number {
  const dayIndex = getDayIndex();
  // Combine day index with a fixed salt for puzzle generation
  return (dayIndex * 2654435761 + 987654321) >>> 0;
}

/** Create a seeded RNG function for puzzle generation */
export function createSeededRng(seed: number): () => number {
  return mulberry32(seed);
}
