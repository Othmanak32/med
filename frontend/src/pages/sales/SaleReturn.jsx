import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Grid,
  TextField,
  Button,
  Box,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { useQuery, useMutation } from '@tanstack/react-query';
import FormCard from '../../components/common/FormCard';
import LoadingButton from '../../components/common/LoadingButton';

const validationSchema = Yup.object({
  items: Yup.array()
    .of(
      Yup.object({
        product_id: Yup.string().required(),
        quantity: Yup.number()
          .positive('يجب أن تكون الكمية أكبر من صفر')
          .required('الكمية مطلوبة')
          .max(Yup.ref('max_quantity'), 'الكمية تتجاوز الكمية المباعة'),
        reason: Yup.string().required('سبب الإرجاع مطلوب'),
      })
    )
    .min(1, 'يجب اختيار منتج واحد على الأقل'),
});

function SaleReturn() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [error, setError] = useState('');
  const [selectedItems, setSelectedItems] = useState({});

  const { data: sale, isLoading } = useQuery(['sale', id], async () => {
    const response = await axios.get(`/api/sales/${id}`);
    return response.data;
  });

  const mutation = useMutation(
    async (values) => {
      await axios.post(`/api/sales/${id}/return`, values);
    },
    {
      onSuccess: () => {
        navigate(`/sales/${id}`);
      },
      onError: (error) => {
        setError(
          error.response?.data?.detail || 'حدث خطأ أثناء تسجيل المرتجع'
        );
      },
    }
  );

  const formik = useFormik({
    initialValues: {
      items: [],
    },
    validationSchema,
    onSubmit: (values) => {
      const returnItems = values.items.filter(
        (item) => item.quantity > 0 && item.reason
      );
      mutation.mutate({ items: returnItems });
    },
  });

  const handleItemSelect = (item, checked) => {
    const newSelectedItems = { ...selectedItems };
    if (checked) {
      newSelectedItems[item.product_id] = true;
      const items = [...formik.values.items];
      items.push({
        product_id: item.product_id,
        quantity: '',
        max_quantity: item.quantity,
        reason: '',
      });
      formik.setFieldValue('items', items);
    } else {
      delete newSelectedItems[item.product_id];
      const items = formik.values.items.filter(
        (i) => i.product_id !== item.product_id
      );
      formik.setFieldValue('items', items);
    }
    setSelectedItems(newSelectedItems);
  };

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/sales/${id}`)}
        sx={{ mb: 3 }}
      >
        العودة إلى تفاصيل الفاتورة
      </Button>

      <FormCard
        title="إرجاع مبيعات"
        subtitle={`فاتورة رقم: ${sale.invoice_number}`}
        actions={
          <>
            <Button onClick={() => navigate(`/sales/${id}`)}>
              إلغاء
            </Button>
            <LoadingButton
              variant="contained"
              onClick={formik.handleSubmit}
              loading={mutation.isLoading}
            >
              تأكيد الإرجاع
            </LoadingButton>
          </>
        }
      >
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox disabled />
                </TableCell>
                <TableCell>المنتج</TableCell>
                <TableCell>الكمية المباعة</TableCell>
                <TableCell>كمية الإرجاع</TableCell>
                <TableCell>سبب الإرجاع</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sale.items.map((item) => {
                const formikItem = formik.values.items.find(
                  (i) => i.product_id === item.product_id
                );
                return (
                  <TableRow key={item.product_id}>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={!!selectedItems[item.product_id]}
                        onChange={(e) =>
                          handleItemSelect(item, e.target.checked)
                        }
                      />
                    </TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {selectedItems[item.product_id] && (
                        <TextField
                          size="small"
                          type="number"
                          value={formikItem?.quantity || ''}
                          onChange={(e) => {
                            const index = formik.values.items.findIndex(
                              (i) => i.product_id === item.product_id
                            );
                            const items = [...formik.values.items];
                            items[index] = {
                              ...items[index],
                              quantity: e.target.value,
                            };
                            formik.setFieldValue('items', items);
                          }}
                          error={
                            formikItem?.quantity > item.quantity
                          }
                          helperText={
                            formikItem?.quantity > item.quantity &&
                            'الكمية تتجاوز الكمية المباعة'
                          }
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {selectedItems[item.product_id] && (
                        <TextField
                          size="small"
                          value={formikItem?.reason || ''}
                          onChange={(e) => {
                            const index = formik.values.items.findIndex(
                              (i) => i.product_id === item.product_id
                            );
                            const items = [...formik.values.items];
                            items[index] = {
                              ...items[index],
                              reason: e.target.value,
                            };
                            formik.setFieldValue('items', items);
                          }}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {formik.touched.items && formik.errors.items && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {formik.errors.items}
          </Alert>
        )}
      </FormCard>
    </>
  );
}

export default SaleReturn;
