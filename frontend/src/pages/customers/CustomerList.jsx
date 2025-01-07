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
  History as HistoryIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

function CustomerList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const { data: customers, isLoading, error, refetch } = useQuery(
    ['customers', searchQuery],
    async () => {
      const response = await axios.get('/api/customers', {
        params: { search: searchQuery },
      });
      return response.data;
    }
  );

  const deleteMutation = useMutation(
    async (id) => {
      await axios.delete(`/api/customers/${id}`);
    },
    {
      onSuccess: () => {
        refetch();
        setDeleteDialogOpen(false);
        setSelectedCustomer(null);
      },
    }
  );

  const handleDelete = () => {
    if (selectedCustomer) {
      deleteMutation.mutate(selectedCustomer.id);
    }
  };

  const handleMenuOpen = (event, customer) => {
    setAnchorEl(event.currentTarget);
    setSelectedCustomer(customer);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCustomer(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'inactive':
        return 'غير نشط';
      default:
        return status;
    }
  };

  const columns = [
    {
      field: 'name',
      headerName: 'اسم العميل',
      flex: 1,
    },
    {
      field: 'phone',
      headerName: 'رقم الهاتف',
      width: 150,
    },
    {
      field: 'email',
      headerName: 'البريد الإلكتروني',
      width: 200,
    },
    {
      field: 'total_sales',
      headerName: 'إجمالي المبيعات',
      width: 150,
      valueFormatter: (params) => params.value.toLocaleString() + ' د.ع',
    },
    {
      field: 'balance',
      headerName: 'الرصيد',
      width: 150,
      renderCell: (params) => (
        <Box
          sx={{
            color: params.value < 0 ? 'error.main' : 'success.main',
            fontWeight: 'bold',
          }}
        >
          {params.value.toLocaleString()} د.ع
        </Box>
      ),
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
        title="العملاء"
        actionText="إضافة عميل"
        onActionClick={() => navigate('/customers/new')}
      />

      <DataTable
        rows={customers || []}
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
            navigate(`/customers/${selectedCustomer?.id}`);
          }}
        >
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          تعديل
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate(`/customers/${selectedCustomer?.id}/history`);
          }}
        >
          <HistoryIcon sx={{ mr: 1 }} fontSize="small" />
          سجل المعاملات
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setDeleteDialogOpen(true);
          }}
        >
          <DeleteIcon sx={{ mr: 1 }} fontSize="small" />
          حذف
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>حذف العميل</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من حذف العميل "{selectedCustomer?.name}"؟
            سيتم حذف جميع بيانات العميل وسجل معاملاته.
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

export default CustomerList;
