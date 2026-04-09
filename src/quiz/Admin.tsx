import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Container,
  FormControlLabel,
  IconButton,
  Paper,
  Rating,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useRef, useState } from 'react';

const API_BASE = 'http://localhost:3001';

interface RecordingRow {
  commonName: string;
  scientificName: string;
  audioFile: string;
  spectrogramFile: string;
  xenoCantoId: string;
  recordist: string;
  rejected: string;
  difficulty: string;
  quality: string;
}

const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
const DIFF_COLORS = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
} as const;

function AudioCell({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
    } else {
      audio.play().catch(() => setPlaying(false));
    }
    setPlaying(!playing);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setPlaying(false);
    const onError = () => setPlaying(false);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, []);

  return (
    <>
      <audio ref={audioRef} src={src} preload="none" />
      <IconButton size="small" onClick={toggle}>
        {playing ? (
          <PauseIcon fontSize="small" />
        ) : (
          <PlayArrowIcon fontSize="small" />
        )}
      </IconButton>
    </>
  );
}

export function Admin() {
  const [rows, setRows] = useState<RecordingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [showOnlyUnreviewed, setShowOnlyUnreviewed] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/recordings`);
      const data = await res.json();
      setRows(data);
      setApiAvailable(true);
    } catch {
      setApiAvailable(false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = useCallback(
    async (xenoCantoId: string, field: string, value: string) => {
      if (!apiAvailable) return;
      await fetch(`${API_BASE}/api/recording/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ xenoCantoId, [field]: value }),
      });
      setRows((prev) =>
        prev.map((r) =>
          r.xenoCantoId === xenoCantoId ? { ...r, [field]: value } : r
        )
      );
    },
    [apiAvailable]
  );

  if (loading) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  if (!apiAvailable) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Admin API not running
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Start the admin server:
        </Typography>
        <Typography
          variant="body2"
          sx={{
            mt: 1,
            p: 2,
            backgroundColor: 'grey.900',
            borderRadius: 1,
            fontFamily: 'monospace',
            color: 'grey.300',
          }}
        >
          npx tsx scripts/admin-server.ts
        </Typography>
      </Container>
    );
  }

  const active = rows.filter((r) => r.rejected !== 'true');
  const rejected = rows.filter((r) => r.rejected === 'true');
  const reviewed = rows.filter(
    (r) => r.quality && r.quality !== '0' && r.rejected !== 'true'
  );
  const needsReview = active.filter((r) => !r.quality || r.quality === '0');

  const filteredRows = showOnlyUnreviewed
    ? rows.filter(
        (r) => (!r.quality || r.quality === '0') && r.rejected !== 'true'
      )
    : rows;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Tweeter Admin
      </Typography>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
        }}
      >
        <Typography variant="body2" sx={{ color: 'grey.600' }}>
          {reviewed.length} reviewed / {needsReview.length} needs review /{' '}
          {rejected.length} rejected / {rows.length} total
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showOnlyUnreviewed}
              onChange={(_, v) => setShowOnlyUnreviewed(v)}
            />
          }
          label="Show only unreviewed"
        />
      </Box>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Bird</TableCell>
              <TableCell>Spectrogram</TableCell>
              <TableCell>Audio</TableCell>
              <TableCell>Recordist</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Quality</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredRows.map((row, i) => {
              const isRejected = row.rejected === 'true';
              const isReviewed =
                !isRejected && row.quality && row.quality !== '0';
              const xcUrl = `https://xeno-canto.org/${row.xenoCantoId}`;
              const audioUrl = `https://xeno-canto.org/${row.xenoCantoId}/download`;

              return (
                <TableRow
                  key={row.xenoCantoId}
                  sx={{
                    opacity: isRejected ? 0.35 : 1,
                    backgroundColor: isRejected
                      ? 'rgba(244, 67, 54, 0.03)'
                      : isReviewed
                        ? 'rgba(76, 175, 80, 0.03)'
                        : 'rgba(255, 152, 0, 0.05)',
                  }}
                >
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {i + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {isRejected ? (
                      <Chip
                        label="Rejected"
                        size="small"
                        color="error"
                        variant="outlined"
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    ) : isReviewed ? (
                      <CheckCircleIcon color="success" fontSize="small" />
                    ) : (
                      <HelpOutlineIcon color="warning" fontSize="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {row.commonName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.scientificName} · XC{row.xenoCantoId}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box
                      component="img"
                      src={row.spectrogramFile}
                      alt=""
                      sx={{
                        width: 160,
                        height: 40,
                        objectFit: 'cover',
                        borderRadius: 0.5,
                        backgroundColor: 'grey.200',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <AudioCell src={audioUrl} />
                  </TableCell>
                  <TableCell>
                    <Box
                      component="a"
                      href={xcUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: 'inherit',
                        textDecoration: 'none',
                        fontSize: '0.8rem',
                      }}
                    >
                      {row.recordist}
                      <OpenInNewIcon sx={{ fontSize: 12 }} />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <ButtonGroup size="small" variant="outlined">
                      {DIFFICULTIES.map((d) => (
                        <Button
                          key={d}
                          color={DIFF_COLORS[d]}
                          variant={
                            row.difficulty === d ? 'contained' : 'outlined'
                          }
                          onClick={() =>
                            handleUpdate(row.xenoCantoId, 'difficulty', d)
                          }
                          sx={{ textTransform: 'none', minWidth: 50 }}
                        >
                          {d}
                        </Button>
                      ))}
                    </ButtonGroup>
                  </TableCell>
                  <TableCell>
                    <Rating
                      value={row.quality ? parseInt(row.quality) : 0}
                      max={3}
                      onChange={(_, v) =>
                        handleUpdate(row.xenoCantoId, 'quality', String(v ?? 0))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {isRejected ? (
                      <Button
                        size="small"
                        color="success"
                        variant="text"
                        onClick={() =>
                          handleUpdate(row.xenoCantoId, 'rejected', '')
                        }
                        sx={{ textTransform: 'none' }}
                      >
                        Restore
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        color="error"
                        variant="text"
                        onClick={() =>
                          handleUpdate(row.xenoCantoId, 'rejected', 'true')
                        }
                        sx={{ textTransform: 'none' }}
                      >
                        Reject
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
