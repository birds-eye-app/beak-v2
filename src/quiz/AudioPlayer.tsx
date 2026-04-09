import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import { Box, IconButton, Slider, Typography } from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_DURATION = 30; // seconds

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function AudioPlayer({
  src,
  autoPlay,
  onPlayingChange,
}: {
  src: string;
  autoPlay?: boolean;
  onPlayingChange?: (playing: boolean) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, _setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState(false);

  const setPlaying = useCallback(
    (v: boolean) => {
      _setPlaying(v);
      onPlayingChange?.(v);
    },
    [onPlayingChange]
  );

  const clampedDuration = Math.min(duration, MAX_DURATION);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      if (audio.currentTime >= MAX_DURATION) {
        audio.pause();
        audio.currentTime = MAX_DURATION;
        setPlaying(false);
      }
      setCurrentTime(Math.min(audio.currentTime, MAX_DURATION));
    };
    const onDurationChange = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);
    const onError = () => {
      setPlaying(false);
      setError(true);
    };
    const onCanPlay = () => setError(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('canplay', onCanPlay);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('canplay', onCanPlay);
    };
  }, [setPlaying]);

  // Safe play helper — Safari rejects play() promises for various reasons
  const safePlay = useCallback(
    (audio: HTMLAudioElement) => {
      audio.play().then(
        () => setPlaying(true),
        () => setPlaying(false)
      );
    },
    [setPlaying]
  );

  // Reset and auto-play when src changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(0);
    setError(false);
    if (autoPlay) {
      safePlay(audio);
    } else {
      setPlaying(false);
    }
  }, [src, autoPlay, safePlay, setPlaying]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      if (audio.currentTime >= MAX_DURATION) {
        audio.currentTime = 0;
      }
      safePlay(audio);
    }
  }, [playing, safePlay, setPlaying]);

  const handleSeek = useCallback((_: Event, value: number | number[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const time = Math.min(value as number, MAX_DURATION);
    audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    safePlay(audio);
  }, [safePlay]);

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          width: '100%',
          py: 1,
        }}
      >
        <audio ref={audioRef} src={src} preload="auto" />
        <Typography variant="body2" color="error" sx={{ flex: 1 }}>
          Could not load this recording. Try skipping to the next question.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
      <audio ref={audioRef} src={src} preload="auto" />
      <IconButton onClick={togglePlay} color="primary" size="large">
        {playing ? <PauseIcon /> : <PlayArrowIcon />}
      </IconButton>
      <Slider
        size="small"
        value={currentTime}
        max={clampedDuration || 1}
        onChange={handleSeek}
        sx={{ flex: 1 }}
      />
      <Typography variant="caption" sx={{ minWidth: 40, textAlign: 'right' }}>
        {formatTime(currentTime)}/{formatTime(clampedDuration)}
      </Typography>
      <IconButton onClick={restart} size="small">
        <ReplayIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
