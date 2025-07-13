import { Container, ListItem } from "@mui/material";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import React, { useContext } from "react";
import OutlinedCard from "../../Card";
import { CurrentYear } from "../../Chirped";
import { ChirpedContext } from "../../contexts/Chirped";
import { FadeInWithInitialDelay } from "../FadeWithInitialDelay";
import { TypographyWithFadeIn } from "../Text";

const Species = ({ isActive }: { isActive: boolean }) => {
  const chirped = useContext(ChirpedContext);
  const yearStats = chirped.yearStats;
  return (
    <OutlinedCard justifyContent="flex-start">
      <TypographyWithFadeIn
        in={isActive}
        initialDelay={500}
        variant="h5"
        sx={{ mb: 1, textAlign: "center" }}
      >
        You saw <b>{yearStats.species}</b> species of birds in {CurrentYear}{" "}
      </TypographyWithFadeIn>
      <TypographyWithFadeIn
        in={isActive}
        initialDelay={2000}
        variant="body1"
        sx={{ mb: 1, textAlign: "center" }}
      >
        That&apos;s across <b>{yearStats.genera}</b> genera and{" "}
        <b>{yearStats.families}</b> families!
      </TypographyWithFadeIn>
      <TypographyWithFadeIn
        in={isActive}
        initialDelay={3500}
        variant="body2"
        sx={{ mb: 1, textAlign: "center" }}
      >
        {" "}
        You took the safe option and left things as a spuh{" "}
        <b>{yearStats.numberOfSpuhs}</b> times...
      </TypographyWithFadeIn>
      <TypographyWithFadeIn
        in={isActive}
        initialDelay={5000}
        variant="body1"
        sx={{ mb: 1, textAlign: "center" }}
      >
        Your most observed bird by checklist frequency was{" "}
        <b>{chirped.rankings.mostObservedByChecklistFrequency[0].species}</b>{" "}
        with{" "}
        <b>
          {
            chirped.rankings.mostObservedByChecklistFrequency[0]
              .totalObservations
          }
        </b>{" "}
        sightings.
      </TypographyWithFadeIn>
      <br />
      <TypographyWithFadeIn
        in={isActive}
        variant="body2"
        initialDelay={7000}
        sx={{ mb: 1, textAlign: "center" }}
      >
        Here&apos;s the full list:
      </TypographyWithFadeIn>
      <Container
        disableGutters
        sx={{
          width: "100%",
          maxHeight: 200,

          overflowY: "auto",
        }}
      >
        <FadeInWithInitialDelay
          in={isActive}
          timeout={1000}
          initialDelay={8250}
        >
          <List component="ol">
            {chirped.rankings.mostObservedByChecklistFrequency.map(
              (species, index) => (
                <ListItem disableGutters disablePadding key={species.species}>
                  <Container
                    disableGutters
                    sx={{ flexDirection: "row", display: "flex" }}
                  >
                    <Typography
                      variant="body2"
                      sx={{ mr: 1, textAlign: "center" }}
                    >
                      {index + 1}.{" "}
                    </Typography>
                    <Typography variant="body2">{species.species}</Typography>
                    <Container sx={{ flex: 1 }} />
                    <Typography variant="body2">
                      {species.totalObservations}
                    </Typography>
                  </Container>
                </ListItem>
              ),
            )}
          </List>
        </FadeInWithInitialDelay>
      </Container>
    </OutlinedCard>
  );
};

export default Species;
