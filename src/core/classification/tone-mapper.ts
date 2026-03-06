/**
 * Maps GDELT tone score (-100 to +100) to ombre/lumière scores.
 */

export interface ToneScores {
  ombreScore: number;
  lumiereScore: number;
}

/**
 * Maps GDELT tone to classification scores.
 * tone > 3  → lumiereScore
 * tone < -3 → ombreScore
 * else      → both 0.3 (neutral)
 * @param tone - GDELT tone value (-100 to +100)
 */
export function mapTone(tone: number): ToneScores {
  if (tone > 3) {
    const lumiereScore = Math.min(Math.abs(tone) / 10, 1);
    return { ombreScore: 0, lumiereScore };
  }
  if (tone < -3) {
    const ombreScore = Math.min(Math.abs(tone) / 10, 1);
    return { ombreScore, lumiereScore: 0 };
  }
  return { ombreScore: 0.3, lumiereScore: 0.3 };
}
