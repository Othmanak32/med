import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Grid,
  TextField,
  Button,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useQuery, useMutation } from '@tanstack/react-query';
import FormCard from '../../components/common/FormCard';
import LoadingButton from '../../components/common/LoadingButton';

const validationSchema = Yup.object({
  name: Yup.string().required('اسم العميل مطلوب'),
  phone: Yup.string().required('رقم الهاتف مطلوب'),
  email: Yup.string().email('البريد الإلكتروني غير صحيح'),
  address: Yup.string(),
  credit_limit: Yup.number()
    .min(0, 'يجب أن يكون الحد الائتماني أكبر من أو يساوي صفر')
    .required('الحد الائتماني مطلوب'),
  status: Yup.string().required('الحالة مطلوبة'),
  notes: Yup.string(),
});

function CustomerForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState('');

  const { data: customer } = useQuery(
    ['customer', id],
    async () => {
      if (id) {
        const response = await axios.get(`/api/customers/${id}`);
        return response.data;
      }
      return null;
    },
    { enabled: !!id }
  );

  const mutation = useMutation(
    async (values) => {
      if (id) {
        await axios.put(`/api/customers/${id}`, values);
      } else {
        await axios.post('/api/customers', values);
      }
    },
    {
      onSuccess: () => {
        navigate('/customers');
      },
      onError: (error) => {
        setError(
          error.response?.data?.detail || 'حدث خطأ أثناء حفظ بيانات العميل'
        );
      },
    }
  );

  const formik = useFormik({
    initialValues: {
      name: '',
      phone: '',
      email: '',
      address: '',
      credit_limit: 0,
      status: 'active',
      notes: '',
    },
    validationSchema,
    onSubmit: mutation.mutate,
  });

  useEffect(() => {
    if (customer) {
      formik.setValues({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        credit_limit: customer.credit_limit,
        status: customer.status,
        notes: customer.notes || '',
      });
    }
  }, [customer]);

  return (
    <>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/customers')}
        sx={{ mb: 3 }}
      >
        العودة إلى قائمة العملاء
      </Button>

      <FormCard
        title={id ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}
        actions={
          <>
            <Button onClick={() => navigate('/customers')}>إلغاء</Button>
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
            <TextField
              fullWidth
              name="name"
              label="اسم العميل"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="phone"
              label="رقم الهاتف"
              value={formik.values.phone}
              onChange={formik.handleChange}
              error={formik.touched.phone && Boolean(formik.errors.phone)}
              helperText={formik.touched.phone && formik.errors.phone}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="email"
              label="البريد الإلكتروني"
              value={formik.values.email}
              onChange={formik.handleChange}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="credit_limit"
              label="الحد الائتماني"
              type="number"
              value={formik.values.credit_limit}
              onChange={formik.handleChange}
              error={
                formik.touched.credit_limit &&
                Boolean(formik.errors.credit_limit)
              }
              helperText={
                formik.touched.credit_limit && formik.errors.credit_limit
              }
              InputProps={{
                endAdornment: <span>د.ع</span>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>الحالة</InputLabel>
              <Select
                name="status"
                value={formik.values.status}
                onChange={formik.handleChange}
                error={
                  formik.touched.status && Boolean(formik.errors.status)
                }
              >
                <MenuItem value="active">نشط</MenuItem>
                <MenuItem value="inactive">غير نشط</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              name="address"
              label="العنوان"
              multiline
              rows={2}
              value={formik.values.address}
              onChange={formik.handleChange}
              error={
                formik.touched.address && Boolean(formik.errors.address)
              }
              helperText={formik.touched.address && formik.errors.address}
            />
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
    </>
  );
}

export default CustomerForm;
