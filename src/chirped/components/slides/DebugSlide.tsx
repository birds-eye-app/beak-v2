import React, { useContext } from 'react';
import { ChirpedContext } from '../../contexts/Chirped';
const DebugSlide = () => {
  const chirped = useContext(ChirpedContext);
  return (
    <div>
      <table>
        <tbody>
          <tr>
            <td>All Observations</td>
            <td>{chirped.allObservations.length}</td>
            <td>{chirped.allObservations[0]?.scientificName}</td>
          </tr>
          <tr>
            <td>Year Observations</td>
            <td>{chirped.yearObservations.length}</td>
            <td>{chirped.yearObservations[0]?.scientificName}</td>
          </tr>
          <tr>
            <td>Lifers</td>
            <td>{chirped.lifeList.length}</td>
            <td>{chirped.lifeList[0]?.scientificName}</td>
          </tr>
        </tbody>
      </table>
      <pre>{JSON.stringify(chirped.yearStats, null, 2)}</pre>
    </div>
  );
};

export default DebugSlide;
