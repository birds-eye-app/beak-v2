import { Button, Container, ListItem } from "@mui/material";
import List from "@mui/material/List";
import Typography from "@mui/material/Typography";
import React, { useContext } from "react";
import OutlinedCard from "../../Card";
import { CurrentYear } from "../../Chirped";
import { ChirpedContext } from "../../contexts/Chirped";
import { UserSelectionsContext } from "../../contexts/UserSelections";
import { FadeInWithInitialDelay } from "../FadeWithInitialDelay";
import { TypographyWithFadeIn } from "../Text";

const Hotspots = ({ isActive }: { isActive: boolean }) => {
  const chirped = useContext(ChirpedContext);
  const { hotspotRanking, setHotspotRanking } = useContext(
    UserSelectionsContext,
  );
  const yearStats = chirped.yearStats;
  const ranking =
    hotspotRanking === "checklists"
      ? chirped.rankings.topHotspotsByChecklists
      : chirped.rankings.topHotspotsByTimeSpent;
  return (
    <OutlinedCard justifyContent="flex-start">
      <TypographyWithFadeIn
        in={isActive}
        initialDelay={500}
        variant="h5"
        sx={{ mb: 2, textAlign: "center" }}
      >
        You visited <b>{yearStats.numberOfHotspots}</b> hotspots in{" "}
        {CurrentYear}.
      </TypographyWithFadeIn>
      <TypographyWithFadeIn in={isActive} initialDelay={2000} variant="body2">
        But only one was your favorite...
      </TypographyWithFadeIn>
      <br />

      {hotspotRanking === "checklists" ? (
        <TypographyWithFadeIn in={isActive} initialDelay={3500} variant="body1">
          <b>{chirped.rankings.topHotspotsByChecklists[0].locationName}</b> was
          your most frequently visited hotspot with{" "}
          <b>
            {chirped.rankings.topHotspotsByChecklists[0].checklistCount.toLocaleString()}
          </b>{" "}
          checklists. You spent a total of{" "}
          <b>
            {chirped.rankings.topHotspotsByChecklists[0].timeSpentMinutes.toLocaleString()}
          </b>{" "}
          minutes here.
        </TypographyWithFadeIn>
      ) : (
        <TypographyWithFadeIn in={isActive} initialDelay={3500} variant="body1">
          <b>{chirped.rankings.topHotspotsByTimeSpent[0].locationName}</b> kept
          you the longest with{" "}
          <b>
            {chirped.rankings.topHotspotsByTimeSpent[0].timeSpentMinutes.toLocaleString()}
          </b>{" "}
          minutes spent here. You visited this hotspot{" "}
          <b>
            {chirped.rankings.topHotspotsByTimeSpent[0].checklistCount.toLocaleString()}
          </b>{" "}
          times.
        </TypographyWithFadeIn>
      )}
      <br />
      <TypographyWithFadeIn
        in={isActive}
        initialDelay={5500}
        variant="body2"
        sx={{ mb: 2 }}
      >
        Here are all your top hotspots:
      </TypographyWithFadeIn>
      <Container
        disableGutters
        sx={{
          width: "100%",
          maxHeight: 150,
          overflowY: "auto",
        }}
      >
        <FadeInWithInitialDelay in={isActive} initialDelay={7000}>
          <List component="ol">
            {ranking.map((hotspot, index) => (
              <ListItem disableGutters disablePadding key={hotspot.locationID}>
                <Container
                  disableGutters
                  sx={{ flexDirection: "row", display: "flex" }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      marginRight: 1,
                    }}
                  >
                    {index + 1}.{" "}
                  </Typography>
                  <Typography variant="body2">
                    {hotspot.locationName}
                  </Typography>
                  <Container sx={{ flex: 1 }} />
                  <Typography variant="body2">
                    {hotspotRanking === "checklists"
                      ? hotspot.checklistCount.toLocaleString()
                      : hotspot.timeSpentMinutes.toLocaleString()}
                  </Typography>
                </Container>
              </ListItem>
            ))}
          </List>
        </FadeInWithInitialDelay>
      </Container>
      <br />
      <FadeInWithInitialDelay in={isActive} initialDelay={8500}>
        <Button
          component="button"
          role={undefined}
          variant="contained"
          tabIndex={-1}
          color="secondary"
          onClick={() =>
            setHotspotRanking(
              hotspotRanking === "checklists" ? "timeSpent" : "checklists",
            )
          }
        >
          Display by{" "}
          {hotspotRanking === "checklists" ? "minutes" : "checklists"}
        </Button>
      </FadeInWithInitialDelay>
    </OutlinedCard>
  );
};

export default Hotspots;
