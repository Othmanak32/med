import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useQuery, useMutation } from '@tanstack/react-query';
import FormCard from '../../components/common/FormCard';
import LoadingButton from '../../components/common/LoadingButton';

const validationSchema = Yup.object({
  type: Yup.string().required('نوع الحركة مطلوب'),
  quantity: Yup.number()
    .positive('يجب أن تكون الكمية أكبر من صفر')
    .required('الكمية مطلوبة'),
  notes: Yup.string(),
});

function StockMovement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { data: product } = useQuery(['product', id], async () => {
    const response = await axios.get(`/api/products/${id}`);
    return response.data;
  });

  const mutation = useMutation(
    async (values) => {
      await axios.post(`/api/products/${id}/movements`, values);
    },
    {
      onSuccess: () => {
        navigate(`/products/${id}`);
      },
      onError: (error) => {
        setError(
          error.response?.data?.detail || 'حدث خطأ أثناء تسجيل حركة المخزون'
        );
      },
    }
  );

  const formik = useFormik({
    initialValues: {
      type: '',
      quantity: '',
      notes: '',
    },
    validationSchema,
    onSubmit: mutation.mutate,
  });

  return (
    <>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/products/${id}`)}
        sx={{ mb: 3 }}
      >
        العودة إلى تفاصيل المنتج
      </Button>

      <FormCard
        title="تسجيل حركة مخزون"
        subtitle={product?.name}
        actions={
          <>
            <Button onClick={() => navigate(`/products/${id}`)}>
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
            <FormControl fullWidth>
              <InputLabel>نوع الحركة</InputLabel>
              <Select
                name="type"
                value={formik.values.type}
                onChange={formik.handleChange}
                error={formik.touched.type && Boolean(formik.errors.type)}
              >
                <MenuItem value="in">وارد</MenuItem>
                <MenuItem value="out">صادر</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              name="quantity"
              label="الكمية"
              type="number"
              value={formik.values.quantity}
              onChange={formik.handleChange}
              error={formik.touched.quantity && Boolean(formik.errors.quantity)}
              helperText={formik.touched.quantity && formik.errors.quantity}
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

export default StockMovement;
