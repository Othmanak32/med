import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  IconButton,
  Tooltip,
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
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import axios from 'axios';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';

function ProductList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const { data: products, isLoading, error, refetch } = useQuery(
    ['products', searchQuery],
    async () => {
      const response = await axios.get('/api/products', {
        params: { search: searchQuery },
      });
      return response.data;
    }
  );

  const handleDelete = async () => {
    try {
      await axios.delete(`/api/products/${selectedProduct.id}`);
      refetch();
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleMenuOpen = (event, product) => {
    setAnchorEl(event.currentTarget);
    setSelectedProduct(product);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProduct(null);
  };

  const columns = [
    {
      field: 'image_url',
      headerName: 'الصورة',
      width: 100,
      renderCell: (params) => (
        <Box
          component="img"
          src={params.value || '/placeholder.png'}
          alt={params.row.name}
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1,
            objectFit: 'cover',
          }}
        />
      ),
    },
    { field: 'name', headerName: 'اسم المنتج', flex: 1 },
    { field: 'sku', headerName: 'رمز المنتج', width: 130 },
    {
      field: 'price_iqd',
      headerName: 'السعر (د.ع)',
      width: 130,
      valueFormatter: (params) => params.value.toLocaleString(),
    },
    {
      field: 'price_usd',
      headerName: 'السعر ($)',
      width: 130,
      valueFormatter: (params) => params.value.toLocaleString(),
    },
    {
      field: 'current_stock',
      headerName: 'المخزون',
      width: 100,
      renderCell: (params) => (
        <Box
          sx={{
            color: params.value <= 10 ? 'error.main' : 'success.main',
            fontWeight: 'bold',
          }}
        >
          {params.value}
        </Box>
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
        title="المنتجات"
        actionText="إضافة منتج"
        onActionClick={() => navigate('/products/new')}
      />

      <DataTable
        rows={products || []}
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
            navigate(`/products/${selectedProduct?.id}`);
          }}
        >
          <EditIcon sx={{ mr: 1 }} fontSize="small" />
          تعديل
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
        <MenuItem
          onClick={() => {
            handleMenuClose();
            navigate(`/inventory/products/${selectedProduct?.id}`);
          }}
        >
          <InventoryIcon sx={{ mr: 1 }} fontSize="small" />
          المخزون
        </MenuItem>
      </Menu>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>حذف المنتج</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من حذف المنتج "{selectedProduct?.name}"؟
            لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleDelete} color="error" autoFocus>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ProductList;
