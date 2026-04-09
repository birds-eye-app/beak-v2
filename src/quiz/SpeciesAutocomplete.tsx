import { Autocomplete, createFilterOptions, TextField } from '@mui/material';
import { useMemo } from 'react';
import { eBirdTaxonomy } from '../chirped/taxonomy/fetch';
import type { RecordingManifest } from './types';

interface SpeciesOption {
  label: string;
  commonName: string;
  scientificName: string;
  bandingCodes: string;
}

const filterOptions = createFilterOptions<SpeciesOption>({
  ignoreCase: true,
  limit: 10,
  stringify: (option) =>
    `${option.commonName} ${option.scientificName} ${option.bandingCodes}`,
});

export function SpeciesAutocomplete({
  value,
  onChange,
  disabled,
  recordings,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  recordings: RecordingManifest[];
}) {
  const options = useMemo(
    () =>
      recordings.map((r) => {
        const taxon = eBirdTaxonomy[r.scientificName];
        return {
          label: r.commonName,
          commonName: r.commonName,
          scientificName: r.scientificName,
          bandingCodes: taxon?.bandingCodes ?? '',
        };
      }),
    [recordings]
  );

  return (
    <Autocomplete
      freeSolo
      disabled={disabled}
      options={options}
      filterOptions={filterOptions}
      inputValue={value}
      onInputChange={(_, newValue) => onChange(newValue)}
      onChange={(_, newValue) => {
        if (typeof newValue === 'string') {
          onChange(newValue);
        } else if (newValue) {
          onChange(newValue.commonName);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Which bird is this?"
          variant="outlined"
          fullWidth
        />
      )}
    />
  );
}
