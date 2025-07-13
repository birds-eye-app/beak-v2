import React, { useState } from 'react';
import { SpeciesFilter, VisibleSpeciesWithLocation } from './BirdMap';

export const SpeciesSelectionList = ({
  visibleSpeciesWithLocation,
  onUpdateToCheckedCodes,
}: {
  visibleSpeciesWithLocation: VisibleSpeciesWithLocation;
  onUpdateToCheckedCodes: (filter: SpeciesFilter) => void;
}) => {
  const allCodes = Object.keys(visibleSpeciesWithLocation);
  const speciesByTaxonomicOrder: {
    [taxonomicOrder: number]: VisibleSpeciesWithLocation;
  } = {};
  Object.entries(visibleSpeciesWithLocation).forEach(([code, observations]) => {
    const taxonomicOrder = observations.species.taxonomic_order;
    if (!speciesByTaxonomicOrder[taxonomicOrder]) {
      speciesByTaxonomicOrder[taxonomicOrder] = {};
    }
    if (!speciesByTaxonomicOrder[taxonomicOrder][code]) {
      speciesByTaxonomicOrder[taxonomicOrder][code] = observations;
    }
  });

  const [preConfirmCheckedCodes, setPreConfirmCheckedCodes] =
    useState<SpeciesFilter>('all');
  const [checkedCodes, setCheckedCodes] = useState<SpeciesFilter>('all');
  const updateCode = (code: string) => {
    if (checkedCodes === 'all') {
      // if it's currently all codes, we now want to remove this code
      setCheckedCodes(allCodes.filter((c) => c !== code));
    } else if (
      typeof checkedCodes === 'object' &&
      checkedCodes.includes(code)
    ) {
      setCheckedCodes(checkedCodes.filter((c) => c !== code));
    } else {
      setCheckedCodes([...checkedCodes, code]);
    }
  };

  return (
    <div className="right-species-bar">
      <div className="checkbox-group">
        <button
          onClick={() =>
            setCheckedCodes(Object.keys(visibleSpeciesWithLocation))
          }
        >
          All
        </button>
        <button onClick={() => setCheckedCodes([])}>None</button>
        <div style={{ flex: 1 }} />
        <button
          disabled={checkedCodes === preConfirmCheckedCodes}
          onClick={() => {
            onUpdateToCheckedCodes(checkedCodes);
            setPreConfirmCheckedCodes(checkedCodes);
          }}
        >
          Confirm
        </button>
        <button
          disabled={checkedCodes === 'all'}
          onClick={() => {
            onUpdateToCheckedCodes('all');
            setCheckedCodes('all');
            setPreConfirmCheckedCodes('all');
          }}
        >
          Reset
        </button>
      </div>
      <div>
        <h2>
          {allCodes.length} species |{' '}
          {Object.values(visibleSpeciesWithLocation)
            .flatMap((x) => x.lifers.length)
            .reduce((a, b) => a + b, 0)}{' '}
          observations
        </h2>
      </div>
      <h3>Species - Observations - Locations</h3>
      <div className="checkbox-scroll-list">
        {Object.entries(speciesByTaxonomicOrder).map(
          ([taxonomicOrder, speciesWithLocation]) => (
            <div key={taxonomicOrder}>
              {Object.entries(speciesWithLocation).map(([code, info]) => (
                <div
                  key={code}
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      checkedCodes === 'all' || checkedCodes.includes(code)
                    }
                    id={code}
                    name={code}
                    value={info.species.common_name}
                    onChange={() => {
                      updateCode(code);
                    }}
                  />
                  <label
                    style={{ flex: 1, flexDirection: 'row', display: 'flex' }}
                    htmlFor={code}
                  >
                    <div style={{ flex: 1 }}>{info.species.common_name} </div>
                    <div>
                      {info.lifers.length} /{' '}
                      {
                        new Set(info.lifers.map((lifer) => lifer.location_id))
                          .size
                      }
                    </div>
                  </label>

                  <button
                    style={{ paddingTop: 0, paddingBottom: 0 }}
                    onClick={() => {
                      setCheckedCodes([code]);
                    }}
                  >
                    Only
                  </button>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
