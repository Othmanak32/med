import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Box,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { arSD } from 'date-fns/locale';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

function SupplierPaymentList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const { data: payments, isLoading, error, refetch } = useQuery(
    ['supplier-payments', searchQuery],
    async () => {
      const response = await axios.get('/api/payments/suppliers', {
        params: { search: searchQuery },
      });
      return response.data;
    }
  );

  const deleteMutation = useMutation(
    async (id) => {
      await axios.delete(`/api/payments/suppliers/${id}`);
    },
    {
      onSuccess: () => {
        refetch();
        setDeleteDialogOpen(false);
        setSelectedPayment(null);
      },
    }
  );

  const handleDelete = () => {
    if (selectedPayment) {
      deleteMutation.mutate(selectedPayment.id);
    }
  };

  const handleMenuOpen = (event, payment) => {
    setAnchorEl(event.currentTarget);
    setSelectedPayment(payment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPayment(null);
  };

  const handlePrint = async () => {
    try {
      const response = await axios.get(
        `/api/payments/suppliers/${selectedPayment.id}/print`,
        {
          responseType: 'blob',
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `سند-صرف-${selectedPayment.receipt_number}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error printing receipt:', error);
    }
    handleMenuClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'مكتمل';
      case 'pending':
        return 'معلق';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash':
        return 'نقدي';
      case 'bank_transfer':
        return 'تحويل بنكي';
      case 'cheque':
        return 'شيك';
      default:
        return method;
    }
  };

  const columns = [
    {
      field: 'receipt_number',
      headerName: 'رقم السند',
      width: 130,
    },
    {
      field: 'date',
      headerName: 'التاريخ',
      width: 180,
      valueFormatter: (params) =>
        format(new Date(params.value), 'PPpp', { locale: arSD }),
    },
    {
      field: 'supplier_name',
      headerName: 'المورد',
      flex: 1,
    },
    {
      field: 'amount',
      headerName: 'المبلغ',
      width: 150,
      valueFormatter: (params) => params.value.toLocaleString() + ' د.ع',
    },
    {
      field: 'payment_method',
      headerName: 'طريقة الدفع',
      width: 130,
      valueFormatter: (params) => getPaymentMethodLabel(params.value),
    },
    {
      field: 'status',
      headerName: 'الحالة',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={getStatusLabel(params.value)}
          color={getStatusColor(params.value)}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      headerName: 'الإجراءات',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton
            size="small"
            onClick={(event) => handleMenuOpen(event, params.row)}
          >
            <MoreVertIcon />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="سندات الصرف"
        actionText="إضافة سند صرف"
        onActionClick={() => navigate('/payments/suppliers/new')}
      />

      <DataTable
        rows={payments || []}
        columns={columns}
        loading={isLoading}
        error={error}
        searchField
        onSearchChange={setSearchQuery}
      />

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate(`/payments/suppliers/${selectedPayment?.id}`);
          }}
        >
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          تعديل
        </MenuItem>
        <MenuItem onClick={handlePrint}>
          <PrintIcon sx={{ mr: 1 }} fontSize="small" />
          طباعة
        </MenuItem>
        {selectedPayment?.status !== 'completed' && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              setDeleteDialogOpen(true);
            }}
          >
            <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
            حذف
          </MenuItem>
        )}
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>حذف سند الصرف</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من حذف سند الصرف رقم "
            {selectedPayment?.receipt_number}"؟ لا يمكن التراجع عن هذا
            الإجراء.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
          <Button
            onClick={handleDelete}
            color="error"
            autoFocus
            disabled={deleteMutation.isLoading}
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SupplierPaymentList;
