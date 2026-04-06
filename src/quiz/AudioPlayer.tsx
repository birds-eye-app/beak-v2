import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ReplayIcon from "@mui/icons-material/Replay";
import { Box, IconButton, Slider, Typography } from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

const MAX_DURATION = 30; // seconds

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
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

  const setPlaying = useCallback(
    (v: boolean) => {
      _setPlaying(v);
      onPlayingChange?.(v);
    },
    [onPlayingChange],
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

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  // Reset and auto-play when src changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(0);
    if (autoPlay) {
      audio.play().then(() => setPlaying(true));
    } else {
      setPlaying(false);
    }
  }, [src, autoPlay]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      if (audio.currentTime >= MAX_DURATION) {
        audio.currentTime = 0;
      }
      audio.play();
    }
    setPlaying(!playing);
  }, [playing]);

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
    audio.play();
    setPlaying(true);
  }, []);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
      <audio ref={audioRef} src={src} preload="metadata" />
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
      <Typography variant="caption" sx={{ minWidth: 40, textAlign: "right" }}>
        {formatTime(currentTime)}/{formatTime(clampedDuration)}
      </Typography>
      <IconButton onClick={restart} size="small">
        <ReplayIcon fontSize="small" />
      </IconButton>
    </Box>
  );
}
