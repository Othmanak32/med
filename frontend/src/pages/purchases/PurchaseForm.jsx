import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Grid,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  Autocomplete,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useQuery, useMutation } from '@tanstack/react-query';
import FormCard from '../../components/common/FormCard';
import LoadingButton from '../../components/common/LoadingButton';

const validationSchema = Yup.object({
  supplier_id: Yup.string().required('المورد مطلوب'),
  items: Yup.array()
    .of(
      Yup.object({
        product_id: Yup.string().required('المنتج مطلوب'),
        quantity: Yup.number()
          .positive('يجب أن تكون الكمية أكبر من صفر')
          .required('الكمية مطلوبة'),
        price_iqd: Yup.number()
          .positive('يجب أن يكون السعر أكبر من صفر')
          .required('السعر مطلوب'),
        price_usd: Yup.number()
          .positive('يجب أن يكون السعر أكبر من صفر')
          .required('السعر مطلوب'),
      })
    )
    .min(1, 'يجب إضافة منتج واحد على الأقل'),
  notes: Yup.string(),
});

function PurchaseForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState('');
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState(null);

  const { data: suppliers } = useQuery(['suppliers'], async () => {
    const response = await axios.get('/api/suppliers');
    return response.data;
  });

  const { data: products } = useQuery(['products'], async () => {
    const response = await axios.get('/api/products');
    return response.data;
  });

  const { data: purchase } = useQuery(
    ['purchase', id],
    async () => {
      if (id) {
        const response = await axios.get(`/api/purchases/${id}`);
        return response.data;
      }
      return null;
    },
    { enabled: !!id }
  );

  const mutation = useMutation(
    async (values) => {
      if (id) {
        await axios.put(`/api/purchases/${id}`, values);
      } else {
        await axios.post('/api/purchases', values);
      }
    },
    {
      onSuccess: () => {
        navigate('/purchases');
      },
      onError: (error) => {
        setError(error.response?.data?.detail || 'حدث خطأ أثناء حفظ الفاتورة');
      },
    }
  );

  const formik = useFormik({
    initialValues: {
      supplier_id: '',
      items: [],
      notes: '',
    },
    validationSchema,
    onSubmit: mutation.mutate,
  });

  useEffect(() => {
    if (purchase) {
      formik.setValues({
        supplier_id: purchase.supplier_id,
        items: purchase.items,
        notes: purchase.notes || '',
      });
    }
  }, [purchase]);

  const handleAddProduct = () => {
    setSelectedProductIndex(null);
    setProductDialogOpen(true);
  };

  const handleEditProduct = (index) => {
    setSelectedProductIndex(index);
    setProductDialogOpen(true);
  };

  const handleProductDialogSave = (product) => {
    const items = [...formik.values.items];
    if (selectedProductIndex !== null) {
      items[selectedProductIndex] = product;
    } else {
      items.push(product);
    }
    formik.setFieldValue('items', items);
    setProductDialogOpen(false);
  };

  const handleRemoveProduct = (index) => {
    const items = [...formik.values.items];
    items.splice(index, 1);
    formik.setFieldValue('items', items);
  };

  const calculateTotals = () => {
    return formik.values.items.reduce(
      (totals, item) => ({
        total_iqd: totals.total_iqd + item.quantity * item.price_iqd,
        total_usd: totals.total_usd + item.quantity * item.price_usd,
      }),
      { total_iqd: 0, total_usd: 0 }
    );
  };

  return (
    <>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/purchases')}
        sx={{ mb: 3 }}
      >
        العودة إلى قائمة المشتريات
      </Button>

      <FormCard
        title={id ? 'تعديل فاتورة شراء' : 'فاتورة شراء جديدة'}
        actions={
          <>
            <Button onClick={() => navigate('/purchases')}>إلغاء</Button>
            <LoadingButton
              variant="contained"
              onClick={formik.handleSubmit}
              loading={mutation.isLoading}
            >
              حفظ
            </LoadingButton>
          </>
        }
      >
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={suppliers || []}
              getOptionLabel={(option) => option.name}
              value={
                suppliers?.find(
                  (s) => s.id === formik.values.supplier_id
                ) || null
              }
              onChange={(_, value) =>
                formik.setFieldValue('supplier_id', value?.id || '')
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="المورد"
                  error={
                    formik.touched.supplier_id &&
                    Boolean(formik.errors.supplier_id)
                  }
                  helperText={
                    formik.touched.supplier_id && formik.errors.supplier_id
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddProduct}
              >
                إضافة منتج
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>المنتج</TableCell>
                    <TableCell>الكمية</TableCell>
                    <TableCell>السعر (د.ع)</TableCell>
                    <TableCell>السعر ($)</TableCell>
                    <TableCell>المجموع (د.ع)</TableCell>
                    <TableCell>المجموع ($)</TableCell>
                    <TableCell>الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formik.values.items.map((item, index) => {
                    const product = products?.find(
                      (p) => p.id === item.product_id
                    );
                    return (
                      <TableRow key={index}>
                        <TableCell>{product?.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {item.price_iqd.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {item.price_usd.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {(item.quantity * item.price_iqd).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {(item.quantity * item.price_usd).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleEditProduct(index)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveProduct(index)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {formik.touched.items && formik.errors.items && (
              <Typography color="error" variant="caption">
                {formik.errors.items}
              </Typography>
            )}

            <Box sx={{ mt: 2, textAlign: 'left' }}>
              <Typography variant="h6">
                المجموع الكلي:{' '}
                {calculateTotals().total_iqd.toLocaleString()} د.ع /{' '}
                {calculateTotals().total_usd.toLocaleString()} $
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              name="notes"
              label="ملاحظات"
              multiline
              rows={4}
              value={formik.values.notes}
              onChange={formik.handleChange}
              error={formik.touched.notes && Boolean(formik.errors.notes)}
              helperText={formik.touched.notes && formik.errors.notes}
            />
          </Grid>
        </Grid>
      </FormCard>

      <ProductDialog
        open={productDialogOpen}
        onClose={() => setProductDialogOpen(false)}
        onSave={handleProductDialogSave}
        products={products || []}
        initialData={
          selectedProductIndex !== null
            ? formik.values.items[selectedProductIndex]
            : null
        }
      />
    </>
  );
}

function ProductDialog({ open, onClose, onSave, products, initialData }) {
  const formik = useFormik({
    initialValues: initialData || {
      product_id: '',
      quantity: '',
      price_iqd: '',
      price_usd: '',
    },
    validationSchema: Yup.object({
      product_id: Yup.string().required('المنتج مطلوب'),
      quantity: Yup.number()
        .positive('يجب أن تكون الكمية أكبر من صفر')
        .required('الكمية مطلوبة'),
      price_iqd: Yup.number()
        .positive('يجب أن يكون السعر أكبر من صفر')
        .required('السعر مطلوب'),
      price_usd: Yup.number()
        .positive('يجب أن يكون السعر أكبر من صفر')
        .required('السعر مطلوب'),
    }),
    onSubmit: (values) => {
      onSave(values);
      formik.resetForm();
    },
  });

  const handleProductChange = (_, value) => {
    formik.setFieldValue('product_id', value?.id || '');
    if (value) {
      formik.setFieldValue('price_iqd', value.price_iqd);
      formik.setFieldValue('price_usd', value.price_usd);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? 'تعديل منتج' : 'إضافة منتج'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Autocomplete
                options={products}
                getOptionLabel={(option) => option.name}
                value={
                  products.find(
                    (p) => p.id === formik.values.product_id
                  ) || null
                }
                onChange={handleProductChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="المنتج"
                    error={
                      formik.touched.product_id &&
                      Boolean(formik.errors.product_id)
                    }
                    helperText={
                      formik.touched.product_id && formik.errors.product_id
                    }
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="quantity"
                label="الكمية"
                type="number"
                value={formik.values.quantity}
                onChange={formik.handleChange}
                error={
                  formik.touched.quantity &&
                  Boolean(formik.errors.quantity)
                }
                helperText={
                  formik.touched.quantity && formik.errors.quantity
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                name="price_iqd"
                label="سعر الشراء (د.ع)"
                type="number"
                value={formik.values.price_iqd}
                onChange={formik.handleChange}
                error={
                  formik.touched.price_iqd &&
                  Boolean(formik.errors.price_iqd)
                }
                helperText={
                  formik.touched.price_iqd && formik.errors.price_iqd
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                name="price_usd"
                label="سعر الشراء ($)"
                type="number"
                value={formik.values.price_usd}
                onChange={formik.handleChange}
                error={
                  formik.touched.price_usd &&
                  Boolean(formik.errors.price_usd)
                }
                helperText={
                  formik.touched.price_usd && formik.errors.price_usd
                }
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>إلغاء</Button>
        <Button
          variant="contained"
          onClick={formik.handleSubmit}
          disabled={!formik.isValid}
        >
          {initialData ? 'تعديل' : 'إضافة'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PurchaseForm;
