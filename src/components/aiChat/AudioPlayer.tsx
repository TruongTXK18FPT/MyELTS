'use client';

import { useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Pause, Play, Volume2 } from 'lucide-react';
import { useTextToSpeech } from '@/hooks/useTextToSpeech';

type AudioPlayerProps = {
  audioUrl?: string | null;
  transcript?: string;
  youtubeLinks?: string[];
};

const SPEEDS = ['0.75', '1', '1.25', '1.5'];

export function AudioPlayer({ audioUrl, transcript = '', youtubeLinks = [] }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState('1');
  const { speak, stop, isSpeaking, isSupported } = useTextToSpeech();

  const safeLinks = useMemo(() => youtubeLinks.filter((item) => /^https?:\/\//.test(item)).slice(0, 3), [youtubeLinks]);

  const toggleAudio = async () => {
    if (!audioRef.current) {
      return;
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    audioRef.current.playbackRate = Number(speed);
    await audioRef.current.play();
    setIsPlaying(true);
  };

  const onSpeedChange = (value: string) => {
    setSpeed(value);
    if (audioRef.current) {
      audioRef.current.playbackRate = Number(value);
    }
  };

  const speakTranscript = () => {
    if (!transcript.trim()) {
      return;
    }

    if (isSpeaking) {
      stop();
      return;
    }

    speak(transcript, {
      rate: Number(speed),
      lang: 'en-US',
    });
  };

  return (
    <div className="space-y-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-cyan-600 text-white">Listening Audio</Badge>
          {audioUrl ? <span className="text-xs text-muted-foreground">File mode</span> : <span className="text-xs text-muted-foreground">TTS mode</span>}
        </div>

        <Select value={speed} onValueChange={onSpeedChange}>
          <SelectTrigger className="h-8 w-[92px] rounded-xl bg-white/80">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPEEDS.map((item) => (
              <SelectItem key={item} value={item}>
                {item}x
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        {audioUrl ? (
          <Button type="button" size="icon" className="rounded-full bg-cyan-600 text-white hover:bg-cyan-700" onClick={toggleAudio}>
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            className="rounded-full bg-cyan-600 text-white hover:bg-cyan-700"
            onClick={speakTranscript}
            disabled={!isSupported || !transcript.trim()}
          >
            <Volume2 className="mr-1 h-4 w-4" />
            {isSpeaking ? 'Stop TTS' : 'Read transcript'}
          </Button>
        )}

        <div className="flex flex-1 items-end gap-1.5">
          {Array.from({ length: 18 }).map((_, index) => (
            <span
              key={index}
              className="w-1 rounded-full bg-cyan-500/70"
              style={{
                height: `${10 + ((index * 11) % 30)}px`,
                animationDelay: `${index * 0.06}s`,
              }}
            />
          ))}
        </div>
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}

      {safeLinks.length > 0 && (
        <div className="space-y-1 text-xs">
          <p className="font-medium text-cyan-900">Reference videos</p>
          <div className="flex flex-wrap gap-2">
            {safeLinks.map((link) => (
              <a
                key={link}
                href={link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-white px-3 py-1 text-cyan-700 hover:bg-cyan-100"
              >
                YouTube
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
