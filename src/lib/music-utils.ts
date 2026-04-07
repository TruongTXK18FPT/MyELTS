export type MusicPlatform = 'YOUTUBE' | 'SPOTIFY';

export interface ParsedMusicUrl {
  platform: MusicPlatform;
  id: string;
  embedUrl: string;
  thumbnailUrl: string | null;
}

/**
 * Detect whether a URL is YouTube or Spotify
 */
export function detectPlatform(url: string): MusicPlatform | null {
  const trimmed = url.trim();
  if (
    trimmed.includes('youtube.com') ||
    trimmed.includes('youtu.be') ||
    trimmed.includes('music.youtube.com')
  ) {
    return 'YOUTUBE';
  }
  if (trimmed.includes('spotify.com') || trimmed.includes('spotify:')) {
    return 'SPOTIFY';
  }
  return null;
}

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/embed\/|youtu\.be\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extract Spotify track/playlist ID from URL
 */
export function extractSpotifyId(url: string): { id: string; type: string } | null {
  // Handle URLs like: https://open.spotify.com/track/xxx or /playlist/xxx or /album/xxx
  const match = url.match(/spotify\.com\/(track|playlist|album|episode)\/([a-zA-Z0-9]+)/);
  if (match) {
    return { id: match[2], type: match[1] };
  }
  // Handle Spotify URI: spotify:track:xxx
  const uriMatch = url.match(/spotify:(track|playlist|album|episode):([a-zA-Z0-9]+)/);
  if (uriMatch) {
    return { id: uriMatch[2], type: uriMatch[1] };
  }
  return null;
}

/**
 * Generate YouTube embed URL
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
}

/**
 * Generate Spotify embed URL
 */
export function getSpotifyEmbedUrl(spotifyId: string, type: string = 'track'): string {
  return `https://open.spotify.com/embed/${type}/${spotifyId}?utm_source=generator&theme=0`;
}

/**
 * Get YouTube thumbnail URL
 */
export function getYouTubeThumbnail(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

/**
 * Parse a music URL and return structured data
 */
export function parseMusicUrl(url: string): ParsedMusicUrl | null {
  const platform = detectPlatform(url);
  if (!platform) return null;

  if (platform === 'YOUTUBE') {
    const id = extractYouTubeId(url);
    if (!id) return null;
    return {
      platform,
      id,
      embedUrl: getYouTubeEmbedUrl(id),
      thumbnailUrl: getYouTubeThumbnail(id),
    };
  }

  if (platform === 'SPOTIFY') {
    const spotify = extractSpotifyId(url);
    if (!spotify) return null;
    return {
      platform,
      id: spotify.id,
      embedUrl: getSpotifyEmbedUrl(spotify.id, spotify.type),
      thumbnailUrl: null, // Spotify embeds handle their own thumbnails
    };
  }

  return null;
}

/**
 * Fetch oEmbed data for a YouTube URL to get title/author info
 */
export async function fetchYouTubeOEmbed(url: string): Promise<{ title: string; author_name: string } | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Validate if a URL is a valid music link
 */
export function isValidMusicUrl(url: string): boolean {
  return parseMusicUrl(url) !== null;
}
