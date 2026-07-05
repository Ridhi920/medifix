import { TextField, InputAdornment } from '@mui/material';
import { Search } from '@mui/icons-material';

/**
 * Shared, clearly-visible search field for the admin management pages: white
 * background, a search icon and a visible border so it stands out against the
 * page background.
 */

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder }: Props) {
  return (
    <TextField
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? 'Search…'}
      size="small"
      fullWidth
      sx={{
        mb: 2,
        maxWidth: 480,
        backgroundColor: '#fff',
        borderRadius: 1,
      }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Search fontSize="small" color="action" />
          </InputAdornment>
        ),
      }}
    />
  );
}
