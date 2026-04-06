import { Autocomplete, createFilterOptions, TextField } from "@mui/material";
import { useMemo } from "react";
import recordings from "./data/recordings.json";

interface SpeciesOption {
  label: string;
  commonName: string;
  scientificName: string;
}

const filterOptions = createFilterOptions<SpeciesOption>({
  ignoreCase: true,
  limit: 10,
  stringify: (option) => `${option.commonName} ${option.scientificName}`,
});

export function SpeciesAutocomplete({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const options = useMemo(
    () =>
      recordings.map((r) => ({
        label: r.commonName,
        commonName: r.commonName,
        scientificName: r.scientificName,
      })),
    [],
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
        if (typeof newValue === "string") {
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
