import React, { useContext } from "react";
import OutlinedCard from "../../Card";
import { CurrentYear } from "../../Chirped";
import { ChirpedContext } from "../../contexts/Chirped";
import { TypographyWithFadeIn } from "../Text";

const Totals = ({ isActive }: { isActive: boolean }) => {
  const chirped = useContext(ChirpedContext);
  const yearStats = chirped.yearStats;
  return (
    <OutlinedCard>
      <br />
      <br />
      <TypographyWithFadeIn in={isActive} variant="h5" initialDelay={500}>
        You submitted <b>{yearStats.checklists.toLocaleString()}</b> checklists
        in {CurrentYear} and spent a total of{" "}
        <b>{yearStats.totalTimeSpentMinutes.toLocaleString()}</b> minutes
        birding!
      </TypographyWithFadeIn>
      <br />
      <br />
      <TypographyWithFadeIn in={isActive} variant="body1" initialDelay={2000}>
        Let&apos;s see how those checklists broke down...
      </TypographyWithFadeIn>
    </OutlinedCard>
  );
};

export default Totals;
