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
  Autocomplete,
  Box,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useQuery, useMutation } from '@tanstack/react-query';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import FormCard from '../../components/common/FormCard';
import LoadingButton from '../../components/common/LoadingButton';

const validationSchema = Yup.object({
  customer_id: Yup.string().required('العميل مطلوب'),
  amount: Yup.number()
    .positive('يجب أن يكون المبلغ أكبر من صفر')
    .required('المبلغ مطلوب'),
  payment_method: Yup.string().required('طريقة الدفع مطلوبة'),
  date: Yup.date().required('التاريخ مطلوب'),
  reference_number: Yup.string(),
  bank_name: Yup.string().when('payment_method', {
    is: (method) => method === 'bank_transfer' || method === 'cheque',
    then: () => Yup.string().required('اسم البنك مطلوب'),
  }),
  cheque_number: Yup.string().when('payment_method', {
    is: 'cheque',
    then: () => Yup.string().required('رقم الشيك مطلوب'),
  }),
  cheque_date: Yup.date().when('payment_method', {
    is: 'cheque',
    then: () => Yup.date().required('تاريخ الشيك مطلوب'),
  }),
  notes: Yup.string(),
});

function CustomerPaymentForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState('');

  const { data: customers } = useQuery(['customers'], async () => {
    const response = await axios.get('/api/customers');
    return response.data;
  });

  const { data: payment } = useQuery(
    ['customer-payment', id],
    async () => {
      if (id) {
        const response = await axios.get(`/api/payments/customers/${id}`);
        return response.data;
      }
      return null;
    },
    { enabled: !!id }
  );

  const mutation = useMutation(
    async (values) => {
      if (id) {
        await axios.put(`/api/payments/customers/${id}`, values);
      } else {
        await axios.post('/api/payments/customers', values);
      }
    },
    {
      onSuccess: () => {
        navigate('/payments/customers');
      },
      onError: (error) => {
        setError(
          error.response?.data?.detail || 'حدث خطأ أثناء حفظ سند القبض'
        );
      },
    }
  );

  const formik = useFormik({
    initialValues: {
      customer_id: '',
      amount: '',
      payment_method: 'cash',
      date: new Date(),
      reference_number: '',
      bank_name: '',
      cheque_number: '',
      cheque_date: null,
      notes: '',
    },
    validationSchema,
    onSubmit: mutation.mutate,
  });

  useEffect(() => {
    if (payment) {
      formik.setValues({
        customer_id: payment.customer_id,
        amount: payment.amount,
        payment_method: payment.payment_method,
        date: new Date(payment.date),
        reference_number: payment.reference_number || '',
        bank_name: payment.bank_name || '',
        cheque_number: payment.cheque_number || '',
        cheque_date: payment.cheque_date
          ? new Date(payment.cheque_date)
          : null,
        notes: payment.notes || '',
      });
    }
  }, [payment]);

  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    if (customers && formik.values.customer_id) {
      const customer = customers.find(
        (c) => c.id === formik.values.customer_id
      );
      setSelectedCustomer(customer);
    }
  }, [customers, formik.values.customer_id]);

  return (
    <>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/payments/customers')}
        sx={{ mb: 3 }}
      >
        العودة إلى قائمة سندات القبض
      </Button>

      <FormCard
        title={id ? 'تعديل سند قبض' : 'سند قبض جديد'}
        actions={
          <>
            <Button onClick={() => navigate('/payments/customers')}>
              إلغاء
            </Button>
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
              options={customers || []}
              getOptionLabel={(option) => option.name}
              value={
                customers?.find(
                  (c) => c.id === formik.values.customer_id
                ) || null
              }
              onChange={(_, value) => {
                formik.setFieldValue('customer_id', value?.id || '');
                setSelectedCustomer(value);
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="العميل"
                  error={
                    formik.touched.customer_id &&
                    Boolean(formik.errors.customer_id)
                  }
                  helperText={
                    formik.touched.customer_id &&
                    formik.errors.customer_id
                  }
                />
              )}
            />
          </Grid>

          {selectedCustomer && (
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
                <Typography color="textSecondary" gutterBottom>
                  الرصيد الحالي
                </Typography>
                <Typography
                  variant="h6"
                  color={
                    selectedCustomer.balance < 0 ? 'error' : 'success'
                  }
                >
                  {selectedCustomer.balance.toLocaleString()} د.ع
                </Typography>
              </Box>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="amount"
              label="المبلغ"
              type="number"
              value={formik.values.amount}
              onChange={formik.handleChange}
              error={
                formik.touched.amount && Boolean(formik.errors.amount)
              }
              helperText={formik.touched.amount && formik.errors.amount}
              InputProps={{
                endAdornment: <span>د.ع</span>,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <DatePicker
              label="التاريخ"
              value={formik.values.date}
              onChange={(value) => formik.setFieldValue('date', value)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error:
                    formik.touched.date && Boolean(formik.errors.date),
                  helperText: formik.touched.date && formik.errors.date,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>طريقة الدفع</InputLabel>
              <Select
                name="payment_method"
                value={formik.values.payment_method}
                onChange={formik.handleChange}
                error={
                  formik.touched.payment_method &&
                  Boolean(formik.errors.payment_method)
                }
              >
                <MenuItem value="cash">نقدي</MenuItem>
                <MenuItem value="bank_transfer">تحويل بنكي</MenuItem>
                <MenuItem value="cheque">شيك</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="reference_number"
              label="الرقم المرجعي"
              value={formik.values.reference_number}
              onChange={formik.handleChange}
              error={
                formik.touched.reference_number &&
                Boolean(formik.errors.reference_number)
              }
              helperText={
                formik.touched.reference_number &&
                formik.errors.reference_number
              }
            />
          </Grid>

          {(formik.values.payment_method === 'bank_transfer' ||
            formik.values.payment_method === 'cheque') && (
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
          )}

          {formik.values.payment_method === 'cheque' && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  name="cheque_number"
                  label="رقم الشيك"
                  value={formik.values.cheque_number}
                  onChange={formik.handleChange}
                  error={
                    formik.touched.cheque_number &&
                    Boolean(formik.errors.cheque_number)
                  }
                  helperText={
                    formik.touched.cheque_number &&
                    formik.errors.cheque_number
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <DatePicker
                  label="تاريخ الشيك"
                  value={formik.values.cheque_date}
                  onChange={(value) =>
                    formik.setFieldValue('cheque_date', value)
                  }
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error:
                        formik.touched.cheque_date &&
                        Boolean(formik.errors.cheque_date),
                      helperText:
                        formik.touched.cheque_date &&
                        formik.errors.cheque_date,
                    },
                  }}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <TextField
              fullWidth
              name="notes"
              label="ملاحظات"
              multiline
              rows={4}
              value={formik.values.notes}
              onChange={formik.handleChange}
              error={
                formik.touched.notes && Boolean(formik.errors.notes)
              }
              helperText={formik.touched.notes && formik.errors.notes}
            />
          </Grid>
        </Grid>
      </FormCard>
    </>
  );
}

export default CustomerPaymentForm;
