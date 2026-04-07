'use client';

import { getYouTubeEmbedUrl, getSpotifyEmbedUrl, extractYouTubeId, extractSpotifyId } from '@/lib/music-utils';

interface MusicEmbedProps {
  url: string;
  platform: 'YOUTUBE' | 'SPOTIFY';
  compact?: boolean;
  className?: string;
}

export function MusicEmbed({ url, platform, compact = false, className = '' }: MusicEmbedProps) {
  if (platform === 'YOUTUBE') {
    const videoId = extractYouTubeId(url);
    if (!videoId) return <div className="text-sm text-muted-foreground">Invalid YouTube URL</div>;

    const embedUrl = getYouTubeEmbedUrl(videoId);
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-black/5 ${className}`}>
        <div className={`relative ${compact ? 'aspect-video max-h-[180px]' : 'aspect-video'} w-full`}>
          <iframe
            src={embedUrl}
            className="absolute inset-0 h-full w-full rounded-2xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            title="YouTube player"
          />
        </div>
      </div>
    );
  }

  if (platform === 'SPOTIFY') {
    const spotify = extractSpotifyId(url);
    if (!spotify) return <div className="text-sm text-muted-foreground">Invalid Spotify URL</div>;

    const embedUrl = getSpotifyEmbedUrl(spotify.id, spotify.type);
    return (
      <div className={`relative overflow-hidden rounded-2xl ${className}`}>
        <iframe
          src={embedUrl}
          className="w-full rounded-2xl"
          height={compact ? 152 : 352}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify player"
          style={{ border: 'none' }}
        />
      </div>
    );
  }

  return null;
}
