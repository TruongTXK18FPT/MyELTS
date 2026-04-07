'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { AddTrackForm } from '@/components/music/AddTrackForm';
import { TrackGrid } from '@/components/music/TrackGrid';
import { PlaylistCard } from '@/components/music/PlaylistCard';
import { PlaylistManager } from '@/components/music/PlaylistManager';
import { useMusic, type MusicTrackData } from '@/providers/MusicContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Music2,
  ListMusic,
  Disc3,
  Headphones,
  Radio,
  Sparkles,
  Youtube,
  Music,
  Play,
} from 'lucide-react';

interface TrackResponse {
  id: string;
  title: string;
  url: string;
  platform: 'YOUTUBE' | 'SPOTIFY';
  platformId: string;
  thumbnail: string | null;
  artist: string | null;
  duration: string | null;
  addedBy: {
    id: string;
    name: string | null;
    image: string | null;
    avatar?: string | null;
  };
}

interface PlaylistResponse {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  createdById: string;
  createdBy: { id: string; name: string | null; image: string | null };
  tracks: Array<{ track: MusicTrackData }>;
  _count: { tracks: number };
}

export default function MusicPage() {
  const { data: session } = useSession();
  const { playPlaylist, setQueue } = useMusic();
  const [tracks, setTracks] = useState<TrackResponse[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistResponse[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(true);
  const [loadingPlaylists, setLoadingPlaylists] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'YOUTUBE' | 'SPOTIFY'>('ALL');
  const [trackToAdd, setTrackToAdd] = useState<MusicTrackData | null>(null);

  const fetchTracks = useCallback(async () => {
    setLoadingTracks(true);
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (filter !== 'ALL') params.set('platform', filter);
      const res = await fetch(`/api/music/tracks?${params}`);
      const data = await res.json();
      setTracks(data.tracks || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    } finally {
      setLoadingTracks(false);
    }
  }, [filter]);

  const fetchPlaylists = useCallback(async () => {
    setLoadingPlaylists(true);
    try {
      const res = await fetch('/api/music/playlists');
      const data = await res.json();
      setPlaylists(data || []);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    } finally {
      setLoadingPlaylists(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  useEffect(() => {
    fetchPlaylists();
  }, [fetchPlaylists]);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      const musicTracks: MusicTrackData[] = tracks.map((t) => ({
        id: t.id,
        title: t.title,
        url: t.url,
        platform: t.platform,
        platformId: t.platformId,
        thumbnail: t.thumbnail,
        artist: t.artist,
        duration: t.duration,
        addedBy: t.addedBy,
      }));
      playPlaylist(musicTracks);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50/80 via-white to-rose-50/50">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-pink-400 via-rose-400 to-pink-500 pb-16 pt-12">
        {/* Decorative blobs */}
        <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -right-10 top-10 h-40 w-40 rounded-full bg-pink-300/20 blur-2xl" />
        <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-rose-300/20 blur-2xl" />

        {/* Floating music notes */}
        <div className="absolute left-[10%] top-[30%] animate-bounce text-white/20" style={{ animationDelay: '0s', animationDuration: '3s' }}>
          <Music2 className="h-8 w-8" />
        </div>
        <div className="absolute right-[15%] top-[20%] animate-bounce text-white/15" style={{ animationDelay: '1s', animationDuration: '4s' }}>
          <Headphones className="h-10 w-10" />
        </div>
        <div className="absolute left-[60%] top-[60%] animate-bounce text-white/20" style={{ animationDelay: '0.5s', animationDuration: '3.5s' }}>
          <Disc3 className="h-6 w-6 animate-spin" style={{ animationDuration: '4s' }} />
        </div>

        <div className="container relative">
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 shadow-xl backdrop-blur-sm">
              <Radio className="h-10 w-10 text-white" />
            </div>
            <h1 className="mb-2 text-4xl font-extrabold text-white md:text-5xl">
              🎵 Trạm Phát Nhạc
            </h1>
            <p className="max-w-md text-base text-pink-100">
              Chia sẻ và thưởng thức nhạc cùng nhau trên MyELTS 🎧✨
            </p>

            {/* Stats */}
            <div className="mt-6 flex items-center gap-6">
              <div className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">{tracks.length}</p>
                <p className="text-[11px] text-pink-100">Bài nhạc</p>
              </div>
              <div className="rounded-2xl bg-white/15 px-4 py-2 backdrop-blur-sm">
                <p className="text-2xl font-bold text-white">{playlists.length}</p>
                <p className="text-[11px] text-pink-100">Playlist</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wave decoration at bottom */}
        <svg
          className="absolute -bottom-1 left-0 w-full"
          viewBox="0 0 1440 60"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 60L48 50C96 40 192 20 288 13.3C384 6.7 480 13.3 576 20C672 26.7 768 33.3 864 30C960 26.7 1056 13.3 1152 10C1248 6.7 1344 13.3 1392 16.7L1440 20V60H0Z"
            fill="hsl(336, 100%, 99%)"
          />
        </svg>
      </div>

      <div className="container -mt-8">
        {/* Add Track Form */}
        {session?.user && (
          <div className="mx-auto mb-8 max-w-xl">
            <AddTrackForm onTrackAdded={fetchTracks} />
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="tracks" className="mt-6">
          <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <TabsList className="rounded-2xl border border-pink-200 bg-white p-1 shadow-sm">
              <TabsTrigger
                value="tracks"
                className="rounded-xl px-5 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-rose-400 data-[state=active]:text-white"
              >
                <Music2 className="mr-2 h-4 w-4" />
                Tất cả nhạc
              </TabsTrigger>
              <TabsTrigger
                value="playlists"
                className="rounded-xl px-5 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-400 data-[state=active]:to-rose-400 data-[state=active]:text-white"
              >
                <ListMusic className="mr-2 h-4 w-4" />
                Playlist
              </TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              {session?.user && (
                <PlaylistManager
                  playlists={playlists.map((p) => ({ id: p.id, name: p.name, _count: p._count }))}
                  onPlaylistCreated={fetchPlaylists}
                  onTrackAddedToPlaylist={fetchPlaylists}
                  trackToAdd={trackToAdd}
                  onClearTrackToAdd={() => setTrackToAdd(null)}
                />
              )}
            </div>
          </div>

          {/* Tracks Tab */}
          <TabsContent value="tracks">
            {/* Platform Filter */}
            <div className="mb-5 flex items-center gap-2">
              <button
                onClick={() => setFilter('ALL')}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  filter === 'ALL'
                    ? 'bg-gradient-to-r from-pink-400 to-rose-400 text-white shadow-md shadow-pink-200'
                    : 'bg-white text-gray-500 border border-pink-100 hover:border-pink-300 hover:text-pink-500'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Tất cả
              </button>
              <button
                onClick={() => setFilter('YOUTUBE')}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  filter === 'YOUTUBE'
                    ? 'bg-red-500 text-white shadow-md shadow-red-200'
                    : 'bg-white text-gray-500 border border-pink-100 hover:border-red-300 hover:text-red-500'
                }`}
              >
                <Youtube className="h-3.5 w-3.5" />
                YouTube
              </button>
              <button
                onClick={() => setFilter('SPOTIFY')}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                  filter === 'SPOTIFY'
                    ? 'bg-green-500 text-white shadow-md shadow-green-200'
                    : 'bg-white text-gray-500 border border-pink-100 hover:border-green-300 hover:text-green-500'
                }`}
              >
                <Music className="h-3.5 w-3.5" />
                Spotify
              </button>

              {tracks.length > 0 && (
                <Button
                  onClick={handlePlayAll}
                  size="sm"
                  className="ml-auto h-8 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 text-xs font-semibold text-white shadow-sm hover:from-pink-500 hover:to-rose-500"
                >
                  <Play className="mr-1 h-3.5 w-3.5" fill="white" />
                  Phát tất cả ({tracks.length})
                </Button>
              )}
            </div>

            <TrackGrid
              tracks={tracks}
              onDelete={fetchTracks}
              onAddToPlaylist={(track) => setTrackToAdd(track)}
              loading={loadingTracks}
            />
          </TabsContent>

          {/* Playlists Tab */}
          <TabsContent value="playlists">
            {loadingPlaylists ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-pink-100 bg-white">
                    <div className="aspect-[2/1] w-full bg-pink-100" />
                    <div className="space-y-2 p-4">
                      <div className="h-4 w-3/4 rounded-full bg-pink-100" />
                      <div className="h-3 w-1/2 rounded-full bg-pink-50" />
                    </div>
                  </div>
                ))}
              </div>
            ) : playlists.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-pink-200 bg-pink-50/50 py-16">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-rose-200">
                  <ListMusic className="h-10 w-10 text-pink-400" />
                </div>
                <h3 className="mb-1 text-lg font-bold text-pink-600">Chưa có playlist nào</h3>
                <p className="text-sm text-pink-400">Tạo playlist đầu tiên để tổ chức nhạc yêu thích! 🎶</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {playlists.map((playlist) => (
                  <PlaylistCard
                    key={playlist.id}
                    playlist={playlist}
                    onDelete={fetchPlaylists}
                    onUpdate={fetchPlaylists}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom spacing for robot widget */}
      <div className="h-24" />
    </div>
  );
}
