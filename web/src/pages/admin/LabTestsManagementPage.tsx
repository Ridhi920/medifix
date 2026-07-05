import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Alert,
  Snackbar,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
} from '@mui/icons-material';
import { labTestAPI, LabTest, LabTestCreate } from '../../api/labTestApi';
import ImportExcelButton, { makeGetter, toNum, toBool, toList } from '../../components/ImportExcelButton';
import SelectWithOther from '../../components/SelectWithOther';
import SearchBar from '../../components/SearchBar';

const CATEGORIES = [
  'Blood Test',
  'Urine Test',
  'Health Package',
  'Cardiac Test',
  'Imaging',
  'Other',
];

export default function LabTestsManagementPage() {
  const [tests, setTests] = useState<LabTest[]>([]);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTest, setEditingTest] = useState<LabTest | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  const [formData, setFormData] = useState<LabTestCreate>({
    name: '',
    description: '',
    parameters: [],
    price: 0,
    report_time: '',
    fasting_required: false,
    category: 'Blood Test',
    popular: false,
  });

  const [parameterInput, setParameterInput] = useState('');

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const data = await labTestAPI.getLabTests(undefined, true); // Include inactive tests for admin
      setTests(data);
    } catch (error: any) {
      showSnackbar('Failed to load lab tests', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenDialog = (test?: LabTest) => {
    if (test) {
      setEditingTest(test);
      setFormData({
        name: test.name,
        description: test.description,
        parameters: test.parameters,
        price: test.price,
        report_time: test.report_time,
        fasting_required: test.fasting_required,
        category: test.category,
        popular: test.popular,
      });
    } else {
      setEditingTest(null);
      setFormData({
        name: '',
        description: '',
        parameters: [],
        price: 0,
        report_time: '',
        fasting_required: false,
        category: 'Blood Test',
        popular: false,
      });
    }
    setParameterInput('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTest(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingTest) {
        await labTestAPI.updateLabTest(editingTest.id, formData);
        showSnackbar('Lab test updated successfully', 'success');
      } else {
        await labTestAPI.createLabTest(formData);
        showSnackbar('Lab test created successfully', 'success');
      }
      handleCloseDialog();
      fetchTests();
    } catch (error: any) {
      showSnackbar(error.response?.data?.detail || 'Operation failed', 'error');
    }
  };

  const handleDelete = async (testId: number) => {
    if (window.confirm('Are you sure you want to delete this lab test?')) {
      try {
        await labTestAPI.deleteLabTest(testId);
        showSnackbar('Lab test deleted successfully', 'success');
        fetchTests();
      } catch (error: any) {
        showSnackbar('Failed to delete lab test', 'error');
      }
    }
  };

  const handleToggleStatus = async (test: LabTest) => {
    try {
      await labTestAPI.toggleLabTestStatus(test.id, !test.is_active);
      showSnackbar(`Lab test ${!test.is_active ? 'activated' : 'deactivated'}`, 'success');
      fetchTests();
    } catch (error: any) {
      showSnackbar('Failed to update status', 'error');
    }
  };

  const handleAddParameter = () => {
    if (parameterInput.trim()) {
      setFormData(prev => ({
        ...prev,
        parameters: [...prev.parameters, parameterInput.trim()],
      }));
      setParameterInput('');
    }
  };

  const handleRemoveParameter = (index: number) => {
    setFormData(prev => ({
      ...prev,
      parameters: prev.parameters.filter((_, i) => i !== index),
    }));
  };

  return (
    <Box>
      {/* Action Bar */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Lab Tests Management ({tests.length})
        </Typography>
        <Stack direction="row" spacing={1}>
          <ImportExcelButton<LabTestCreate>
            entityLabel="lab test"
            fileBaseName="lab_tests"
            sample={{
              Name: 'Complete Blood Count (CBC)',
              Category: 'Hematology',
              Description: 'Measures different components of blood.',
              Parameters: 'Hemoglobin, RBC, WBC, Platelets',
              Price: 350,
              'Report Time': '24 hours',
              'Fasting Required': 'No',
              Popular: 'Yes',
            }}
            createItem={labTestAPI.createLabTest}
            onComplete={fetchTests}
            mapRow={(r) => {
              const g = makeGetter(r);
              const name = g('name')?.toString().trim();
              const category = g('category')?.toString().trim();
              if (!name || !category) return null;
              return {
                name,
                category,
                description: g('description')?.toString() ?? '',
                parameters: toList(g('parameters')),
                price: toNum(g('price')),
                report_time: g('reporttime', 'time')?.toString() ?? '',
                fasting_required: toBool(g('fastingrequired', 'fasting')),
                popular: toBool(g('popular')),
              };
            }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Lab Test
          </Button>
        </Stack>
      </Stack>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name or category…"
      />

      {/* Tests Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Test Name</strong></TableCell>
              <TableCell><strong>Category</strong></TableCell>
              <TableCell><strong>Parameters</strong></TableCell>
              <TableCell><strong>Price (₹)</strong></TableCell>
              <TableCell><strong>Report Time</strong></TableCell>
              <TableCell><strong>Fasting</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell align="right"><strong>Actions</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tests
              .filter((t) =>
                [t.name, t.category]
                  .join(' ')
                  .toLowerCase()
                  .includes(search.toLowerCase())
              )
              .map((test) => (
              <TableRow key={test.id} hover>
                <TableCell>
                  <Typography fontWeight={600}>{test.name}</Typography>
                  {test.popular && (
                    <Chip label="Popular" size="small" color="secondary" sx={{ mt: 0.5 }} />
                  )}
                </TableCell>
                <TableCell>
                  <Chip label={test.category} size="small" color="primary" variant="outlined" />
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{test.parameters.length} parameters</Typography>
                </TableCell>
                <TableCell>₹{test.price}</TableCell>
                <TableCell>{test.report_time}</TableCell>
                <TableCell>
                  {test.fasting_required ? (
                    <Chip label="Yes" size="small" color="warning" />
                  ) : (
                    <Chip label="No" size="small" color="default" />
                  )}
                </TableCell>
                <TableCell>
                  <Switch
                    checked={test.is_active}
                    onChange={() => handleToggleStatus(test)}
                    color="success"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(test)}
                    color="primary"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(test.id)}
                    color="error"
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingTest ? 'Edit Lab Test' : 'Add Lab Test'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            {/* Test Name */}
            <TextField
              label="Test Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            {/* Description */}
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
              required
            />

            {/* Category */}
            <SelectWithOther
              label="Category"
              value={formData.category}
              options={CATEGORIES}
              onChange={(val) => setFormData({ ...formData, category: val })}
              required
            />

            {/* Parameters */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Test Parameters
              </Typography>
              <Stack direction="row" spacing={1} mb={1}>
                <TextField
                  placeholder="Add parameter (e.g., Hemoglobin)"
                  value={parameterInput}
                  onChange={(e) => setParameterInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddParameter();
                    }
                  }}
                  size="small"
                  fullWidth
                />
                <Button onClick={handleAddParameter} variant="outlined">
                  Add
                </Button>
              </Stack>
              <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                {formData.parameters.map((param, index) => (
                  <Chip
                    key={index}
                    label={param}
                    onDelete={() => handleRemoveParameter(index)}
                    size="small"
                  />
                ))}
              </Stack>
            </Box>

            {/* Price and Report Time */}
            <Stack direction="row" spacing={2}>
              <TextField
                label="Price (₹)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                fullWidth
                required
              />
              <TextField
                label="Report Time"
                placeholder="e.g., 6 hours, 24 hours"
                value={formData.report_time}
                onChange={(e) => setFormData({ ...formData, report_time: e.target.value })}
                fullWidth
                required
              />
            </Stack>

            {/* Checkboxes */}
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.fasting_required}
                    onChange={(e) => setFormData({ ...formData, fasting_required: e.target.checked })}
                  />
                }
                label="Fasting Required"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.popular}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                  />
                }
                label="Mark as Popular"
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.name || !formData.description || formData.parameters.length === 0}
          >
            {editingTest ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
