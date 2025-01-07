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
} from '@mui/material';
import { PhotoCamera, ArrowBack } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useQuery, useMutation } from '@tanstack/react-query';
import FormCard from '../../components/common/FormCard';
import LoadingButton from '../../components/common/LoadingButton';

const validationSchema = Yup.object({
  name: Yup.string().required('اسم المنتج مطلوب'),
  sku: Yup.string().required('رمز المنتج مطلوب'),
  price_iqd: Yup.number()
    .positive('يجب أن يكون السعر أكبر من صفر')
    .required('السعر بالدينار العراقي مطلوب'),
  price_usd: Yup.number()
    .positive('يجب أن يكون السعر أكبر من صفر')
    .required('السعر بالدولار مطلوب'),
  current_stock: Yup.number()
    .min(0, 'لا يمكن أن يكون المخزون سالباً')
    .required('المخزون مطلوب'),
  description: Yup.string(),
});

function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');

  const { data: product, isLoading } = useQuery(
    ['product', id],
    async () => {
      if (id) {
        const response = await axios.get(`/api/products/${id}`);
        return response.data;
      }
      return null;
    },
    { enabled: !!id }
  );

  const mutation = useMutation(
    async (values) => {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        if (key !== 'image') {
          formData.append(key, values[key]);
        }
      });
      if (values.image) {
        formData.append('image', values.image);
      }

      if (id) {
        await axios.put(`/api/products/${id}`, formData);
      } else {
        await axios.post('/api/products', formData);
      }
    },
    {
      onSuccess: () => {
        navigate('/products');
      },
      onError: (error) => {
        setError(error.response?.data?.detail || 'حدث خطأ أثناء حفظ المنتج');
      },
    }
  );

  const formik = useFormik({
    initialValues: {
      name: '',
      sku: '',
      price_iqd: '',
      price_usd: '',
      current_stock: '',
      description: '',
      image: null,
    },
    validationSchema,
    onSubmit: mutation.mutate,
  });

  useEffect(() => {
    if (product) {
      formik.setValues({
        ...product,
        image: null,
      });
      setImagePreview(product.image_url);
    }
  }, [product]);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      formik.setFieldValue('image', file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/products')}
        sx={{ mb: 3 }}
      >
        العودة إلى قائمة المنتجات
      </Button>

      <FormCard
        title={id ? 'تعديل منتج' : 'إضافة منتج جديد'}
        actions={
          <>
            <Button onClick={() => navigate('/products')}>إلغاء</Button>
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
          <Grid item xs={12}>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 3,
              }}
            >
              <Box
                sx={{
                  width: 200,
                  height: 200,
                  borderRadius: 1,
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2,
                  overflow: 'hidden',
                }}
              >
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Product preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <PhotoCamera sx={{ fontSize: 40, color: 'grey.400' }} />
                )}
              </Box>
              <Button
                component="label"
                variant="outlined"
                startIcon={<PhotoCamera />}
              >
                {imagePreview ? 'تغيير الصورة' : 'إضافة صورة'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              name="name"
              label="اسم المنتج"
              value={formik.values.name}
              onChange={formik.handleChange}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              name="sku"
              label="رمز المنتج"
              value={formik.values.sku}
              onChange={formik.handleChange}
              error={formik.touched.sku && Boolean(formik.errors.sku)}
              helperText={formik.touched.sku && formik.errors.sku}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              name="price_iqd"
              label="السعر (د.ع)"
              type="number"
              value={formik.values.price_iqd}
              onChange={formik.handleChange}
              error={formik.touched.price_iqd && Boolean(formik.errors.price_iqd)}
              helperText={formik.touched.price_iqd && formik.errors.price_iqd}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              name="price_usd"
              label="السعر ($)"
              type="number"
              value={formik.values.price_usd}
              onChange={formik.handleChange}
              error={formik.touched.price_usd && Boolean(formik.errors.price_usd)}
              helperText={formik.touched.price_usd && formik.errors.price_usd}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              name="current_stock"
              label="المخزون الحالي"
              type="number"
              value={formik.values.current_stock}
              onChange={formik.handleChange}
              error={
                formik.touched.current_stock &&
                Boolean(formik.errors.current_stock)
              }
              helperText={
                formik.touched.current_stock && formik.errors.current_stock
              }
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              name="description"
              label="وصف المنتج"
              multiline
              rows={4}
              value={formik.values.description}
              onChange={formik.handleChange}
              error={
                formik.touched.description && Boolean(formik.errors.description)
              }
              helperText={formik.touched.description && formik.errors.description}
            />
          </Grid>
        </Grid>
      </FormCard>
    </>
  );
}

export default ProductForm;
