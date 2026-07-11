import { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Chip, Alert, Snackbar, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack,
  Switch, FormControlLabel, CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { contentAPI, type HomeFeature, type HomeFeatureInput } from '../../api/contentApi';

const EMPTY: HomeFeatureInput = {
  icon: '✅', title: '', subtitle: '',
  bg: '#ecfdf5', icon_bg: '#bbf7d0', display_order: 0, is_active: true,
};

export default function WhyChooseManagementPage() {
  const [features, setFeatures] = useState<HomeFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<HomeFeatureInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const load = async () => {
    try {
      setFeatures(await contentAPI.getFeatures());
    } catch {
      showSnackbar('Failed to load features', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY, display_order: features.length });
    setDialogOpen(true);
  };

  const openEdit = (f: HomeFeature) => {
    setEditingId(f.id);
    const { id, ...rest } = f;
    void id;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showSnackbar('Title is required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId == null) {
        await contentAPI.createFeature(form);
        showSnackbar('Feature added', 'success');
      } else {
        await contentAPI.updateFeature(editingId, form);
        showSnackbar('Feature updated', 'success');
      }
      setDialogOpen(false);
      load();
    } catch {
      showSnackbar('Failed to save feature', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (f: HomeFeature) => {
    if (!window.confirm(`Delete feature "${f.title}"?`)) return;
    try {
      await contentAPI.deleteFeature(f.id);
      showSnackbar('Feature deleted', 'success');
      load();
    } catch {
      showSnackbar('Failed to delete feature', 'error');
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" component="h1">Why Choose MedEfix</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Feature</Button>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        These cards appear in the app's “Why Choose MedEfix” section. Inactive features are hidden from the app.
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Icon</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Subtitle</TableCell>
              <TableCell>Colors</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {features.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No features yet</TableCell></TableRow>
            ) : features.map((f) => (
              <TableRow key={f.id}>
                <TableCell>{f.display_order}</TableCell>
                <TableCell>
                  <Box sx={{ width: 40, height: 40, borderRadius: '50%', bgcolor: f.icon_bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{f.icon}</Box>
                </TableCell>
                <TableCell>{f.title}</TableCell>
                <TableCell sx={{ maxWidth: 280 }}><Typography variant="body2" noWrap title={f.subtitle}>{f.subtitle}</Typography></TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <Box title={`card ${f.bg}`} sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: f.bg, border: '1px solid #ccc' }} />
                    <Box title={`icon ${f.icon_bg}`} sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: f.icon_bg, border: '1px solid #ccc' }} />
                  </Stack>
                </TableCell>
                <TableCell><Chip label={f.is_active ? 'Active' : 'Hidden'} color={f.is_active ? 'success' : 'default'} size="small" /></TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => openEdit(f)}><Edit /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(f)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId == null ? 'Add Feature' : 'Edit Feature'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField label="Icon (emoji)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} sx={{ width: 140 }} />
              <TextField label="Title" fullWidth value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </Stack>
            <TextField label="Subtitle" fullWidth value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField label="Card color" value={form.bg} onChange={(e) => setForm({ ...form, bg: e.target.value })} />
              <input type="color" value={form.bg} onChange={(e) => setForm({ ...form, bg: e.target.value })} style={{ width: 40, height: 40, border: 'none', background: 'none' }} />
              <TextField label="Icon color" value={form.icon_bg} onChange={(e) => setForm({ ...form, icon_bg: e.target.value })} />
              <input type="color" value={form.icon_bg} onChange={(e) => setForm({ ...form, icon_bg: e.target.value })} style={{ width: 40, height: 40, border: 'none', background: 'none' }} />
            </Stack>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField label="Display order" type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} sx={{ width: 160 }} />
              <FormControlLabel control={<Switch checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />} label="Active" />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
