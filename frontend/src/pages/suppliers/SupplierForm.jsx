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
  name: Yup.string().required('اسم المورد مطلوب'),
  company_name: Yup.string(),
  phone: Yup.string().required('رقم الهاتف مطلوب'),
  email: Yup.string().email('البريد الإلكتروني غير صحيح'),
  address: Yup.string(),
  tax_number: Yup.string(),
  credit_limit: Yup.number()
    .min(0, 'يجب أن يكون الحد الائتماني أكبر من أو يساوي صفر')
    .required('الحد الائتماني مطلوب'),
  payment_terms: Yup.number()
    .min(0, 'يجب أن تكون مدة السداد أكبر من أو تساوي صفر')
    .required('مدة السداد مطلوبة'),
  status: Yup.string().required('الحالة مطلوبة'),
  bank_name: Yup.string(),
  bank_account: Yup.string(),
  notes: Yup.string(),
});

function SupplierForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState('');

  const { data: supplier } = useQuery(
    ['supplier', id],
    async () => {
      if (id) {
        const response = await axios.get(`/api/suppliers/${id}`);
        return response.data;
      }
      return null;
    },
    { enabled: !!id }
  );

  const mutation = useMutation(
    async (values) => {
      if (id) {
        await axios.put(`/api/suppliers/${id}`, values);
      } else {
        await axios.post('/api/suppliers', values);
      }
    },
    {
      onSuccess: () => {
        navigate('/suppliers');
      },
      onError: (error) => {
        setError(
          error.response?.data?.detail || 'حدث خطأ أثناء حفظ بيانات المورد'
        );
      },
    }
  );

  const formik = useFormik({
    initialValues: {
      name: '',
      company_name: '',
      phone: '',
      email: '',
      address: '',
      tax_number: '',
      credit_limit: 0,
      payment_terms: 0,
      status: 'active',
      bank_name: '',
      bank_account: '',
      notes: '',
    },
    validationSchema,
    onSubmit: mutation.mutate,
  });

  useEffect(() => {
    if (supplier) {
      formik.setValues({
        name: supplier.name,
        company_name: supplier.company_name || '',
        phone: supplier.phone,
        email: supplier.email || '',
        address: supplier.address || '',
        tax_number: supplier.tax_number || '',
        credit_limit: supplier.credit_limit,
        payment_terms: supplier.payment_terms,
        status: supplier.status,
        bank_name: supplier.bank_name || '',
        bank_account: supplier.bank_account || '',
        notes: supplier.notes || '',
      });
    }
  }, [supplier]);

  return (
    <>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/suppliers')}
        sx={{ mb: 3 }}
      >
        العودة إلى قائمة الموردين
      </Button>

      <FormCard
        title={id ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
        actions={
          <>
            <Button onClick={() => navigate('/suppliers')}>إلغاء</Button>
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
              label="اسم المورد"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="company_name"
              label="اسم الشركة"
              value={formik.values.company_name}
              onChange={formik.handleChange}
              error={
                formik.touched.company_name &&
                Boolean(formik.errors.company_name)
              }
              helperText={
                formik.touched.company_name && formik.errors.company_name
              }
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
              name="tax_number"
              label="الرقم الضريبي"
              value={formik.values.tax_number}
              onChange={formik.handleChange}
              error={
                formik.touched.tax_number &&
                Boolean(formik.errors.tax_number)
              }
              helperText={
                formik.touched.tax_number && formik.errors.tax_number
              }
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
            <TextField
              fullWidth
              name="payment_terms"
              label="مدة السداد"
              type="number"
              value={formik.values.payment_terms}
              onChange={formik.handleChange}
              error={
                formik.touched.payment_terms &&
                Boolean(formik.errors.payment_terms)
              }
              helperText={
                formik.touched.payment_terms && formik.errors.payment_terms
              }
              InputProps={{
                endAdornment: <span>يوم</span>,
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

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="bank_name"
              label="اسم البنك"
              value={formik.values.bank_name}
              onChange={formik.handleChange}
              error={
                formik.touched.bank_name &&
                Boolean(formik.errors.bank_name)
              }
              helperText={
                formik.touched.bank_name && formik.errors.bank_name
              }
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="bank_account"
              label="رقم الحساب البنكي"
              value={formik.values.bank_account}
              onChange={formik.handleChange}
              error={
                formik.touched.bank_account &&
                Boolean(formik.errors.bank_account)
              }
              helperText={
                formik.touched.bank_account && formik.errors.bank_account
              }
            />
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

export default SupplierForm;
