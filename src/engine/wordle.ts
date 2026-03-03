import type { GuessResult } from '../lib/types';

export function evaluateGuess(guess: string, answer: string): GuessResult {
  const g = guess.toLowerCase().split('');
  const a = answer.toLowerCase().split('');
  const result: GuessResult = new Array(g.length).fill('absent');
  const answerUsed = new Array(a.length).fill(false);

  // First pass: exact matches
  for (let i = 0; i < g.length; i++) {
    if (g[i] === a[i]) {
      result[i] = 'correct';
      answerUsed[i] = true;
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < g.length; i++) {
    if (result[i] === 'correct') continue;
    for (let j = 0; j < a.length; j++) {
      if (!answerUsed[j] && g[i] === a[j]) {
        result[i] = 'present';
        answerUsed[j] = true;
        break;
      }
    }
  }

  return result;
}
