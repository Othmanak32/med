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

function SupplierList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const { data: suppliers, isLoading, error, refetch } = useQuery(
    ['suppliers', searchQuery],
    async () => {
      const response = await axios.get('/api/suppliers', {
        params: { search: searchQuery },
      });
      return response.data;
    }
  );

  const deleteMutation = useMutation(
    async (id) => {
      await axios.delete(`/api/suppliers/${id}`);
    },
    {
      onSuccess: () => {
        refetch();
        setDeleteDialogOpen(false);
        setSelectedSupplier(null);
      },
    }
  );

  const handleDelete = () => {
    if (selectedSupplier) {
      deleteMutation.mutate(selectedSupplier.id);
    }
  };

  const handleMenuOpen = (event, supplier) => {
    setAnchorEl(event.currentTarget);
    setSelectedSupplier(supplier);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedSupplier(null);
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
      headerName: 'اسم المورد',
      flex: 1,
    },
    {
      field: 'company_name',
      headerName: 'اسم الشركة',
      width: 200,
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
      field: 'total_purchases',
      headerName: 'إجمالي المشتريات',
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
            color: params.value < 0 ? 'success.main' : 'error.main',
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
        title="الموردين"
        actionText="إضافة مورد"
        onActionClick={() => navigate('/suppliers/new')}
      />

      <DataTable
        rows={suppliers || []}
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
            navigate(`/suppliers/${selectedSupplier?.id}`);
          }}
        >
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          تعديل
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate(`/suppliers/${selectedSupplier?.id}/history`);
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
        <DialogTitle>حذف المورد</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من حذف المورد "{selectedSupplier?.name}"؟
            سيتم حذف جميع بيانات المورد وسجل معاملاته.
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

export default SupplierList;
