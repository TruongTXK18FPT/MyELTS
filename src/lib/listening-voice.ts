export const LISTENING_VOICE_BANDS = ['band_5_6', 'band_6_5_7_5', 'band_8_9'] as const;

export type ListeningVoiceBand = (typeof LISTENING_VOICE_BANDS)[number];

export type ListeningVoiceProfile = {
  id: ListeningVoiceBand;
  label: string;
  description: string;
  targetRate: number;
  targetPitch: number;
  language: 'en-GB' | 'en-US' | 'en-AU';
  accentHint: string;
  voiceHints: string[];
  pauseMs: number;
};

export const DEFAULT_LISTENING_VOICE_BAND: ListeningVoiceBand = 'band_6_5_7_5';

export const LISTENING_VOICE_PROFILE_MAP: Record<ListeningVoiceBand, ListeningVoiceProfile> = {
  band_5_6: {
    id: 'band_5_6',
    label: 'Band 5.0-6.0',
    description: 'Slow and clear pacing with simple pauses for easier decoding.',
    targetRate: 0.88,
    targetPitch: 1.02,
    language: 'en-GB',
    accentHint: 'neutral british',
    voiceHints: ['en-gb', 'uk', 'female', 'clear'],
    pauseMs: 240,
  },
  band_6_5_7_5: {
    id: 'band_6_5_7_5',
    label: 'Band 6.5-7.5',
    description: 'Natural exam speed with balanced linking and chunking.',
    targetRate: 0.98,
    targetPitch: 1,
    language: 'en-AU',
    accentHint: 'australian',
    voiceHints: ['en-au', 'australia', 'female', 'natural'],
    pauseMs: 170,
  },
  band_8_9: {
    id: 'band_8_9',
    label: 'Band 8.0-9.0',
    description: 'Near-authentic speed, richer connected speech, less artificial pausing.',
    targetRate: 1.06,
    targetPitch: 0.98,
    language: 'en-GB',
    accentHint: 'advanced british',
    voiceHints: ['en-gb', 'uk', 'male', 'natural'],
    pauseMs: 110,
  },
};

export const LISTENING_VOICE_OPTIONS = LISTENING_VOICE_BANDS.map((band) => ({
  id: band,
  label: LISTENING_VOICE_PROFILE_MAP[band].label,
  description: LISTENING_VOICE_PROFILE_MAP[band].description,
}));

export function isListeningVoiceBand(value: unknown): value is ListeningVoiceBand {
  return typeof value === 'string' && LISTENING_VOICE_BANDS.includes(value as ListeningVoiceBand);
}

export function getListeningVoiceProfile(value?: unknown): ListeningVoiceProfile {
  const band = isListeningVoiceBand(value) ? value : DEFAULT_LISTENING_VOICE_BAND;
  return LISTENING_VOICE_PROFILE_MAP[band];
}

export function pickListeningVoiceBandFromMetadata(
  metadata: Record<string, unknown> | null | undefined
): ListeningVoiceBand {
  if (!metadata) {
    return DEFAULT_LISTENING_VOICE_BAND;
  }

  if (isListeningVoiceBand(metadata.listeningVoiceBand)) {
    return metadata.listeningVoiceBand;
  }

  const ttsProfile = metadata.ttsProfile;
  if (ttsProfile && typeof ttsProfile === 'object' && !Array.isArray(ttsProfile)) {
    const targetBand = (ttsProfile as Record<string, unknown>).targetBand;
    if (isListeningVoiceBand(targetBand)) {
      return targetBand;
    }
  }

  return DEFAULT_LISTENING_VOICE_BAND;
}
