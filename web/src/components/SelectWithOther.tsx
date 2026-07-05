import { useState } from 'react';
import { TextField } from '@mui/material';

/**
 * A native dropdown with an "Others" entry that reveals a free-text field, so
 * admins can enter a value not in the preset list. Drop-in replacement for the
 * `<TextField select native>` dropdowns used across the management pages.
 *
 * Relies on the dialog remounting its content when reopened (MUI Dialog default)
 * so the initial "other" state is recomputed for each edit.
 */

const OTHER = '__other__';

interface Props {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
  fullWidth?: boolean;
}

export default function SelectWithOther({ label, value, options, onChange, required, fullWidth = true }: Props) {
  // "Other" when there's a value that isn't one of the presets.
  const [otherMode, setOtherMode] = useState(() => value !== '' && !options.includes(value));

  return (
    <>
      <TextField
        fullWidth={fullWidth}
        select
        label={label}
        value={otherMode ? OTHER : value}
        onChange={(e) => {
          if (e.target.value === OTHER) {
            setOtherMode(true);
            onChange('');
          } else {
            setOtherMode(false);
            onChange(e.target.value);
          }
        }}
        SelectProps={{ native: true }}
        required={required}
      >
        <option value=""></option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
        <option value={OTHER}>Others</option>
      </TextField>
      {otherMode && (
        <TextField
          fullWidth={fullWidth}
          label={`Custom ${label}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          placeholder={`Enter ${label.toLowerCase()}`}
          autoFocus
          sx={{ mt: 2 }}
        />
      )}
    </>
  );
}
