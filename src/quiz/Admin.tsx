import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import {
  Box,
  Button,
  ButtonGroup,
  Chip,
  Container,
  IconButton,
  Paper,
  Rating,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useRef, useState } from "react";

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

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const DIFF_COLORS = {
  easy: "success",
  medium: "warning",
  hard: "error",
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
      audio.play();
    }
    setPlaying(!playing);
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onEnded = () => setPlaying(false);
    audio.addEventListener("ended", onEnded);
    return () => audio.removeEventListener("ended", onEnded);
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

async function updateRecording(
  xenoCantoId: string,
  updates: Record<string, string>,
) {
  await fetch("/api/recording/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ xenoCantoId, ...updates }),
  });
}

export function Admin() {
  const [rows, setRows] = useState<RecordingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/recordings");
    const data = await res.json();
    setRows(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = useCallback(
    async (xenoCantoId: string, field: string, value: string) => {
      await updateRecording(xenoCantoId, { [field]: value });
      setRows((prev) =>
        prev.map((r) =>
          r.xenoCantoId === xenoCantoId ? { ...r, [field]: value } : r,
        ),
      );
    },
    [],
  );

  if (loading) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  const active = rows.filter((r) => r.rejected !== "true");
  const rejected = rows.filter((r) => r.rejected === "true");

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Tweeter Admin
      </Typography>
      <Typography variant="body2" sx={{ mb: 3, color: "grey.600" }}>
        {active.length} active / {rejected.length} rejected / {rows.length}{" "}
        total
      </Typography>

      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Bird</TableCell>
              <TableCell>Spectrogram</TableCell>
              <TableCell>Audio</TableCell>
              <TableCell>Recordist</TableCell>
              <TableCell>Difficulty</TableCell>
              <TableCell>Quality</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => {
              const isRejected = row.rejected === "true";
              return (
                <TableRow
                  key={row.xenoCantoId}
                  sx={{ opacity: isRejected ? 0.4 : 1 }}
                >
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {row.commonName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.scientificName}
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
                        objectFit: "cover",
                        borderRadius: 0.5,
                        backgroundColor: "grey.200",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <AudioCell src={row.audioFile} />
                  </TableCell>
                  <TableCell>
                    <Box
                      component="a"
                      href={`https://xeno-canto.org/${row.xenoCantoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        color: "inherit",
                        textDecoration: "none",
                        fontSize: "0.8rem",
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
                            row.difficulty === d ? "contained" : "outlined"
                          }
                          onClick={() =>
                            handleUpdate(row.xenoCantoId, "difficulty", d)
                          }
                          sx={{ textTransform: "none", minWidth: 50 }}
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
                        handleUpdate(row.xenoCantoId, "quality", String(v ?? 0))
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {isRejected ? (
                      <Chip
                        label="Rejected"
                        size="small"
                        color="error"
                        variant="outlined"
                        onClick={() =>
                          handleUpdate(row.xenoCantoId, "rejected", "")
                        }
                        onDelete={() =>
                          handleUpdate(row.xenoCantoId, "rejected", "")
                        }
                      />
                    ) : (
                      <Button
                        size="small"
                        color="error"
                        variant="text"
                        onClick={() =>
                          handleUpdate(row.xenoCantoId, "rejected", "true")
                        }
                        sx={{ textTransform: "none" }}
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
