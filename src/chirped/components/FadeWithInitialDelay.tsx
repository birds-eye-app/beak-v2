import React from 'react';
import { Fade } from '@mui/material';

export type FadeInWithInitialDelayProps = {
  in?: boolean;
  timeout?: number;
  initialDelay: number;
  children: React.ReactElement;
};

export const FadeInWithInitialDelay = (props: FadeInWithInitialDelayProps) => {
  return (
    <Fade
      in={props.in !== undefined ? props.in : true}
      timeout={props.timeout || 2000}
      style={{ transitionDelay: `${props.initialDelay}ms` }}
    >
      {props.children}
    </Fade>
  );
};
