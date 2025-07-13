import React from "react";
import { Typography, TypographyProps } from "@mui/material";
import { FadeInWithInitialDelay } from "./FadeWithInitialDelay";

export type TypographyWithFadeInProps = TypographyProps & {
  in?: boolean;
  timeout?: number;
  initialDelay: number;
};

export const TypographyWithFadeIn = (props: TypographyWithFadeInProps) => {
  // only pass props to the child Typography component
  // that it knows how to handle
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { in: _, timeout: __, initialDelay: ___, ...rest } = props;
  return (
    <FadeInWithInitialDelay
      in={props.in}
      timeout={props.timeout}
      initialDelay={props.initialDelay}
    >
      <Typography {...rest} />
    </FadeInWithInitialDelay>
  );
};
