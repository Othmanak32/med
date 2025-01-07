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
  Undo as UndoIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { arSD } from 'date-fns/locale';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

function SalesList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const { data: sales, isLoading, error, refetch } = useQuery(
    ['sales', searchQuery],
    async () => {
      const response = await axios.get('/api/sales', {
        params: { search: searchQuery },
      });
      return response.data;
    }
  );

  const deleteMutation = useMutation(
    async (id) => {
      await axios.delete(`/api/sales/${id}`);
    },
    {
      onSuccess: () => {
        refetch();
        setDeleteDialogOpen(false);
        setSelectedSale(null);
      },
    }
  );

  const handleDelete = () => {
    if (selectedSale) {
      deleteMutation.mutate(selectedSale.id);
    }
  };

  const handleMenuOpen = (event, sale) => {
    setAnchorEl(event.currentTarget);
    setSelectedSale(sale);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSale(null);
  };

  const handlePrint = async () => {
    try {
      const response = await axios.get(`/api/sales/${selectedSale.id}/print`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `فاتورة-${selectedSale.invoice_number}.pdf`);
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
      case 'returned':
        return 'info';
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
      case 'returned':
        return 'مرتجعة';
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
      field: 'customer_name',
      headerName: 'العميل',
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
        title="المبيعات"
        actionText="إضافة فاتورة"
        onActionClick={() => navigate('/sales/new')}
      />

      <DataTable
        rows={sales || []}
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
            navigate(`/sales/${selectedSale?.id}`);
          }}
        >
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          تعديل
        </MenuItem>
        <MenuItem onClick={handlePrint}>
          <PrintIcon sx={{ mr: 1 }} fontSize="small" />
          طباعة
        </MenuItem>
        {selectedSale?.status === 'completed' && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              navigate(`/sales/${selectedSale?.id}/return`);
            }}
          >
            <UndoIcon sx={{ mr: 1 }} fontSize="small" />
            إرجاع
          </MenuItem>
        )}
        {selectedSale?.status !== 'completed' && (
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
            هل أنت متأكد من حذف الفاتورة رقم "{selectedSale?.invoice_number}"؟
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

export default SalesList;
