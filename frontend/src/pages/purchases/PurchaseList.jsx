import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Chip,
  Box,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
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

function PurchaseList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const { data: purchases, isLoading, error, refetch } = useQuery(
    ['purchases', searchQuery],
    async () => {
      const response = await axios.get('/api/purchases', {
        params: { search: searchQuery },
      });
      return response.data;
    }
  );

  const deleteMutation = useMutation(
    async (id) => {
      await axios.delete(`/api/purchases/${id}`);
    },
    {
      onSuccess: () => {
        refetch();
        setDeleteDialogOpen(false);
        setSelectedPurchase(null);
      },
    }
  );

  const handleDelete = () => {
    if (selectedPurchase) {
      deleteMutation.mutate(selectedPurchase.id);
    }
  };

  const handleMenuOpen = (event, purchase) => {
    setAnchorEl(event.currentTarget);
    setSelectedPurchase(purchase);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPurchase(null);
  };

  const handlePrint = async () => {
    try {
      const response = await axios.get(`/api/purchases/${selectedPurchase.id}/print`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `فاتورة-شراء-${selectedPurchase.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error printing invoice:', error);
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
        return 'مكتملة';
      case 'pending':
        return 'معلقة';
      case 'cancelled':
        return 'ملغية';
      default:
        return status;
    }
  };

  const columns = [
    {
      field: 'invoice_number',
      headerName: 'رقم الفاتورة',
      width: 130,
    },
    {
      field: 'supplier_name',
      headerName: 'المورد',
      flex: 1,
    },
    {
      field: 'date',
      headerName: 'التاريخ',
      width: 180,
      valueFormatter: (params) =>
        format(new Date(params.value), 'PPpp', { locale: arSD }),
    },
    {
      field: 'total_iqd',
      headerName: 'المجموع (د.ع)',
      width: 130,
      valueFormatter: (params) => params.value.toLocaleString(),
    },
    {
      field: 'total_usd',
      headerName: 'المجموع ($)',
      width: 130,
      valueFormatter: (params) => params.value.toLocaleString(),
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
        title="المشتريات"
        actionText="إضافة فاتورة"
        onActionClick={() => navigate('/purchases/new')}
      />

      <DataTable
        rows={purchases || []}
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
            navigate(`/purchases/${selectedPurchase?.id}`);
          }}
        >
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          تعديل
        </MenuItem>
        <MenuItem onClick={handlePrint}>
          <PrintIcon sx={{ mr: 1 }} fontSize="small" />
          طباعة
        </MenuItem>
        {selectedPurchase?.status !== 'completed' && (
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
        <DialogTitle>حذف الفاتورة</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من حذف فاتورة الشراء رقم "{selectedPurchase?.invoice_number}"؟
            لا يمكن التراجع عن هذا الإجراء.
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

export default PurchaseList;
