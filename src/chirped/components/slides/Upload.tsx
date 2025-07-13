import { Button, Fade, Link, styled, Typography } from "@mui/material";
import React, { useEffect, useState } from "react";
import OutlinedCard from "../../Card";
import { TypographyWithFadeIn } from "../Text";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const loadingTextDelay = process.env.NODE_ENV === "development" ? 1 : 750;
const processingText = [
  "Performing breeding display...",
  "Gathering nesting material...",
  "Laying eggs...",
  "Incubating cuckoo eggs...",
  "Kicking cuckoo eggs out and starting over...",
  "Incubating eggs...",
  "Hatching...",
  "Feeding...",
  "Time to fledge!",
];
const transitionDelay = loadingTextDelay * processingText.length + 1000;

const UploadCSV = ({
  onUploadComplete,
  actualProcessingComplete,
  onFakeProcessingComplete,
  onStartChirped,
}: {
  onUploadComplete: (contents: string) => void;
  actualProcessingComplete: boolean;
  onFakeProcessingComplete: () => void;
  onStartChirped: () => void;
}) => {
  const [animationReady, setAnimationReady] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onUploadComplete(await e.target.files[0].text());
      setAnimationReady(true);
    }
  };

  useEffect(() => {
    if (actualProcessingComplete && animationReady) {
      setTimeout(() => {
        onFakeProcessingComplete();
        setAnimationComplete(true);
      }, transitionDelay);
    }
  }, [actualProcessingComplete, animationReady, onFakeProcessingComplete]);

  return (
    <OutlinedCard>
      <TypographyWithFadeIn
        gutterBottom
        sx={{
          fontSize: 24,
          color: "text.primary",
        }}
        initialDelay={0}
      >
        🐦🕰️ Welcome!
      </TypographyWithFadeIn>
      <br />
      <TypographyWithFadeIn
        gutterBottom
        sx={{
          fontSize: 14,
          color: "text.primary",
          textAlign: "center",
        }}
        initialDelay={0}
      >
        To get started, you&apos;ll need to upload your eBird CSV export. You
        can request an export from eBird here:{" "}
        <Link
          href="https://ebird.org/downloadMyData"
          target="_blank"
          rel="noreferrer"
        >
          https://ebird.org/downloadMyData
        </Link>
      </TypographyWithFadeIn>

      <br />
      {animationReady &&
        processingText.map((text, index) => (
          <Fade
            in={processingText.length > 0}
            timeout={{ enter: 500, exit: 250 }}
            style={{ transitionDelay: `${index * loadingTextDelay}ms` }}
            key={`asi-${index}`}
          >
            <Typography gutterBottom variant="body2">
              {text}
            </Typography>
          </Fade>
        ))}
      <br />
      {!animationComplete && (
        <Fade in={true} timeout={1000}>
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            color="primary"
            disabled={animationReady}
          >
            📄 Upload eBird CSV
            <VisuallyHiddenInput
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
          </Button>
        </Fade>
      )}
      {animationComplete && (
        <Fade in={true} timeout={1000}>
          <Button
            component="label"
            role={undefined}
            variant="contained"
            tabIndex={-1}
            color="secondary"
            onClick={onStartChirped}
          >
            Start chirped!
          </Button>
        </Fade>
      )}
    </OutlinedCard>
  );
};

export default UploadCSV;
