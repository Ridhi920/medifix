import { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Typography, Chip, Alert, Snackbar, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Stack,
  Switch, FormControlLabel, CircularProgress,
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { contentAPI, type Testimonial, type TestimonialInput } from '../../api/contentApi';

const EMPTY: TestimonialInput = {
  name: '', role: '', avatar: '👤', quote: '',
  accent: '#FF6B35', bg: '#ffedd5', display_order: 0, is_active: true,
};

export default function ReviewsManagementPage() {
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<TestimonialInput>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const showSnackbar = (message: string, severity: 'success' | 'error') =>
    setSnackbar({ open: true, message, severity });

  const load = async () => {
    try {
      setReviews(await contentAPI.getTestimonials());
    } catch {
      showSnackbar('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY, display_order: reviews.length });
    setDialogOpen(true);
  };

  const openEdit = (r: Testimonial) => {
    setEditingId(r.id);
    const { id, ...rest } = r;
    void id;
    setForm(rest);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.quote.trim()) {
      showSnackbar('Name and review text are required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId == null) {
        await contentAPI.createTestimonial(form);
        showSnackbar('Review added', 'success');
      } else {
        await contentAPI.updateTestimonial(editingId, form);
        showSnackbar('Review updated', 'success');
      }
      setDialogOpen(false);
      load();
    } catch {
      showSnackbar('Failed to save review', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (r: Testimonial) => {
    if (!window.confirm(`Delete review by ${r.name}?`)) return;
    try {
      await contentAPI.deleteTestimonial(r.id);
      showSnackbar('Review deleted', 'success');
      load();
    } catch {
      showSnackbar('Failed to delete review', 'error');
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={6}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" component="h1">User Reviews</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openAdd}>Add Review</Button>
      </Box>
      <Typography variant="body2" color="text.secondary" mb={3}>
        These appear in the app's “What Our Users Say” carousel. Inactive reviews are hidden from the app.
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Avatar</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Review</TableCell>
              <TableCell>Colors</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow><TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>No reviews yet</TableCell></TableRow>
            ) : reviews.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.display_order}</TableCell>
                <TableCell><span style={{ fontSize: 24 }}>{r.avatar}</span></TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.role}</TableCell>
                <TableCell sx={{ maxWidth: 320 }}>
                  <Typography variant="body2" noWrap title={r.quote}>{r.quote}</Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.5}>
                    <Box title={`accent ${r.accent}`} sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: r.accent, border: '1px solid #ccc' }} />
                    <Box title={`bg ${r.bg}`} sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: r.bg, border: '1px solid #ccc' }} />
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={r.is_active ? 'Active' : 'Hidden'} color={r.is_active ? 'success' : 'default'} size="small" />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="primary" onClick={() => openEdit(r)}><Edit /></IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(r)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId == null ? 'Add Review' : 'Edit Review'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField label="Name" fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <TextField label="Location" fullWidth value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </Stack>
            <TextField label="Avatar (emoji)" value={form.avatar} onChange={(e) => setForm({ ...form, avatar: e.target.value })} sx={{ width: 160 }} />
            <TextField label="Review text" fullWidth multiline minRows={3} value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} />
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField label="Accent color" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} />
              <input type="color" value={form.accent} onChange={(e) => setForm({ ...form, accent: e.target.value })} style={{ width: 40, height: 40, border: 'none', background: 'none' }} />
              <TextField label="Background color" value={form.bg} onChange={(e) => setForm({ ...form, bg: e.target.value })} />
              <input type="color" value={form.bg} onChange={(e) => setForm({ ...form, bg: e.target.value })} style={{ width: 40, height: 40, border: 'none', background: 'none' }} />
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
