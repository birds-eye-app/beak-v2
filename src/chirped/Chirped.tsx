import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { performChirpedCalculations } from './calculate';
import Upload from './components/slides/Upload';
import { ChirpedContext, ChirpedContextType } from './contexts/Chirped';
import { UserSelections } from './contexts/UserSelections';
import { makeNewChirpedContext } from './helpers';
import { parseObservations } from './parseEbirdExport';

import { Container } from '@mui/material';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import Checklists from './components/slides/Checklists';
import Counts from './components/slides/Counts';
import Hotspots from './components/slides/Hotspots';
import Lifers from './components/slides/Lifers';
import QualitativeInput from './components/slides/QualitativeInput';
import Species from './components/slides/Species';
import Summary from './components/slides/Summary';
import Totals from './components/slides/Totals';
import './styles.css';

export const CurrentYear = 2024;

const swiperSlideStyle = { backgroundColor: '#555555' };

export function Chirped() {
  const [fileContents, setFileContents] = useState('');
  const [actualProcessingComplete, setActualProcessingComplete] =
    useState(false);
  const [fakeProcessingComplete, setFakeProcessingComplete] = useState(false);
  const [chirpedObservations, setChirpedObservations] =
    useState<ChirpedContextType>(makeNewChirpedContext());

  const onUploadComplete = async (contents: string) => {
    setFileContents(contents);
  };

  useEffect(() => {
    async function runObs() {
      const observations = await parseObservations(fileContents);
      const chirped = await performChirpedCalculations(
        observations,
        CurrentYear
      );
      setChirpedObservations(chirped);
      setActualProcessingComplete(true);
    }

    runObs();
  }, [fileContents]);

  if (!fakeProcessingComplete) {
    return (
      <Container
        sx={{
          mt: 2,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          width: '100%',
        }}
      >
        <Upload
          onUploadComplete={onUploadComplete}
          actualProcessingComplete={actualProcessingComplete}
          onFakeProcessingComplete={() => {}}
          onStartChirped={() => setFakeProcessingComplete(true)}
        />
      </Container>
    );
  }

  return (
    <>
      <ChirpedContext.Provider value={chirpedObservations}>
        <UserSelections>
          <Swiper
            navigation={chirpedObservations.allObservations.length !== 0}
            modules={[Navigation]}
            className="mySwiper"
          >
            <SwiperSlide style={swiperSlideStyle}>
              {({ isActive }) => <Totals isActive={isActive} />}
            </SwiperSlide>
            <SwiperSlide style={swiperSlideStyle}>
              {({ isActive }) => <Checklists isActive={isActive} />}
            </SwiperSlide>
            <SwiperSlide style={swiperSlideStyle}>
              {({ isActive }) => <Lifers isActive={isActive} />}
            </SwiperSlide>
            <SwiperSlide style={swiperSlideStyle}>
              {({ isActive }) => <Species isActive={isActive} />}
            </SwiperSlide>
            <SwiperSlide style={swiperSlideStyle}>
              {({ isActive }) => <Counts isActive={isActive} />}
            </SwiperSlide>
            <SwiperSlide style={swiperSlideStyle}>
              {({ isActive }) => <Hotspots isActive={isActive} />}
            </SwiperSlide>
            <SwiperSlide style={swiperSlideStyle}>
              {({ isActive }) => <QualitativeInput isActive={isActive} />}
            </SwiperSlide>

            <SwiperSlide style={swiperSlideStyle}>
              {({ isActive }) => <Summary isActive={isActive} />}
            </SwiperSlide>
          </Swiper>
        </UserSelections>
      </ChirpedContext.Provider>
    </>
  );
}
