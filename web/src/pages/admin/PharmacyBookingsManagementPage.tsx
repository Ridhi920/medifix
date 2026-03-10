import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Divider,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Visibility,
  Cancel,
  MoreVert,
  CheckCircle,
  Schedule,
  ShoppingCart,
  LocalShipping,
  Done,
  Close,
} from '@mui/icons-material';
import { pharmacyAPI, MedicineOrder } from '../../api/pharmacyApi';

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'info' | 'success' | 'error'> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'info',
  out_for_delivery: 'info',
  delivered: 'success',
  cancelled: 'error',
};

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending', icon: <Schedule fontSize="small" /> },
  { value: 'confirmed', label: 'Confirmed', icon: <CheckCircle fontSize="small" /> },
  { value: 'preparing', label: 'Preparing', icon: <ShoppingCart fontSize="small" /> },
  { value: 'out_for_delivery', label: 'Out for Delivery', icon: <LocalShipping fontSize="small" /> },
  { value: 'delivered', label: 'Delivered', icon: <Done fontSize="small" /> },
  { value: 'cancelled', label: 'Cancelled', icon: <Close fontSize="small" /> },
] as const;

export default function PharmacyBookingsManagementPage() {
  const [orders, setOrders] = useState<MedicineOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<MedicineOrder | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [statusChangeOrder, setStatusChangeOrder] = useState<MedicineOrder | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const data = await pharmacyAPI.getAllOrders();
      setOrders(data);
    } catch (error: any) {
      showSnackbar('Failed to load orders', 'error');
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleViewOrder = (order: MedicineOrder) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const handleCancelOrder = async (orderId: number) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      try {
        await pharmacyAPI.cancelOrder(orderId);
        showSnackbar('Order cancelled successfully', 'success');
        fetchOrders();
        handleCloseDialog();
      } catch (error: any) {
        showSnackbar('Failed to cancel order', 'error');
      }
    }
  };

  const handleOpenStatusMenu = (event: React.MouseEvent<HTMLElement>, order: MedicineOrder) => {
    setStatusMenuAnchor(event.currentTarget);
    setStatusChangeOrder(order);
  };

  const handleCloseStatusMenu = () => {
    setStatusMenuAnchor(null);
    setStatusChangeOrder(null);
  };

  const handleChangeStatus = async (newStatus: string) => {
    if (!statusChangeOrder) return;

    try {
      await pharmacyAPI.updateOrderStatus(statusChangeOrder.id, newStatus);
      showSnackbar(`Order status updated to ${newStatus.replace('_', ' ')}`, 'success');
      fetchOrders();
      handleCloseStatusMenu();
      if (selectedOrder && selectedOrder.id === statusChangeOrder.id) {
        setSelectedOrder({ ...selectedOrder, status: newStatus as MedicineOrder['status'] });
      }
    } catch (error: any) {
      showSnackbar('Failed to update order status', 'error');
      handleCloseStatusMenu();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Schedule fontSize="small" />;
      case 'confirmed': return <CheckCircle fontSize="small" />;
      case 'preparing': return <ShoppingCart fontSize="small" />;
      case 'out_for_delivery': return <LocalShipping fontSize="small" />;
      case 'delivered': return <Done fontSize="small" />;
      case 'cancelled': return <Close fontSize="small" />;
      default: return undefined;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Pharmacy Orders Management
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Patient</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>#{order.id}</TableCell>
                <TableCell>
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {order.patient_name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>{order.patient_phone}</TableCell>
                <TableCell>
                  <Chip 
                    label={`${order.items.length} item${order.items.length > 1 ? 's' : ''}`} 
                    size="small" 
                    color="primary"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    ₹{order.total_amount}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    icon={getStatusIcon(order.status)}
                    label={formatStatus(order.status)}
                    color={STATUS_COLORS[order.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(order.created_at)}</TableCell>
                <TableCell align="right">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleViewOrder(order)}
                  >
                    <Visibility />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenStatusMenu(e, order)}
                  >
                    <MoreVert />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Status Change Menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleCloseStatusMenu}
      >
        {STATUS_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            onClick={() => handleChangeStatus(option.value)}
            disabled={statusChangeOrder?.status === option.value}
          >
            <ListItemIcon>{option.icon}</ListItemIcon>
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>

      {/* Order Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Order #{selectedOrder?.id}</Typography>
            {selectedOrder && (
              <Chip
                icon={getStatusIcon(selectedOrder.status)}
                label={formatStatus(selectedOrder.status)}
                color={STATUS_COLORS[selectedOrder.status]}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Stack spacing={3}>
              {/* Patient Details */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Patient Details
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Name</Typography>
                      <Typography variant="body1">{selectedOrder.patient_name}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Phone</Typography>
                      <Typography variant="body1">{selectedOrder.patient_phone}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">Delivery Address</Typography>
                      <Typography variant="body1">{selectedOrder.delivery_address}</Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Order Items
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Medicine</TableCell>
                          <TableCell align="center">Quantity</TableCell>
                          <TableCell align="right">Price</TableCell>
                          <TableCell align="right">Subtotal</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.medicine_name}</TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="right">₹{item.price}</TableCell>
                            <TableCell align="right">₹{item.price * item.quantity}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="subtitle1" fontWeight="bold">
                              Total Amount:
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="subtitle1" fontWeight="bold">
                              ₹{selectedOrder.total_amount}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              {/* Additional Info */}
              {(selectedOrder.notes || selectedOrder.prescription_image) && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                      Additional Information
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    {selectedOrder.notes && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="textSecondary">Notes</Typography>
                        <Typography variant="body1">{selectedOrder.notes}</Typography>
                      </Box>
                    )}
                    {selectedOrder.prescription_image && (
                      <Box>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          Prescription
                        </Typography>
                        <Chip label="Prescription Uploaded" color="success" size="small" />
                      </Box>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Order Info */}
              <Box>
                <Typography variant="body2" color="textSecondary">
                  Order Date: {formatDateTime(selectedOrder.created_at)}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          {selectedOrder && selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
            <Button
              onClick={() => handleCancelOrder(selectedOrder.id)}
              color="error"
              startIcon={<Cancel />}
            >
              Cancel Order
            </Button>
          )}
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
