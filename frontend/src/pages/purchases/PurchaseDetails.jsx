import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { arSD } from 'date-fns/locale';

function PurchaseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: purchase, isLoading } = useQuery(['purchase', id], async () => {
    const response = await axios.get(`/api/purchases/${id}`);
    return response.data;
  });

  const handlePrint = async () => {
    try {
      const response = await axios.get(`/api/purchases/${id}/print`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `فاتورة-شراء-${purchase.invoice_number}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error printing invoice:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'مكتملة';
      case 'pending':
        return 'معلقة';
      case 'cancelled':
        return 'ملغية';
      default:
        return status;
    }
  };

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/purchases')}
        >
          العودة إلى قائمة المشتريات
        </Button>
        {purchase.status !== 'completed' && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/purchases/${id}/edit`)}
          >
            تعديل الفاتورة
          </Button>
        )}
        <Button
          variant="outlined"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
        >
          طباعة
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                تفاصيل الفاتورة
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  رقم الفاتورة
                </Typography>
                <Typography variant="h6">{purchase.invoice_number}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  التاريخ
                </Typography>
                <Typography>
                  {format(new Date(purchase.date), 'PPpp', { locale: arSD })}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  المورد
                </Typography>
                <Typography>{purchase.supplier_name}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  الحالة
                </Typography>
                <Chip
                  label={getStatusLabel(purchase.status)}
                  color={getStatusColor(purchase.status)}
                />
              </Box>

              {purchase.notes && (
                <Box sx={{ mb: 2 }}>
                  <Typography color="textSecondary" gutterBottom>
                    ملاحظات
                  </Typography>
                  <Typography>{purchase.notes}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                معلومات المورد
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  اسم المورد
                </Typography>
                <Typography>{purchase.supplier_name}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  رقم الهاتف
                </Typography>
                <Typography>{purchase.supplier_phone}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  العنوان
                </Typography>
                <Typography>{purchase.supplier_address}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                المنتجات
              </Typography>
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
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {purchase.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.product_name}</TableCell>
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
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2, textAlign: 'left' }}>
                <Typography variant="h6">
                  المجموع الكلي: {purchase.total_iqd.toLocaleString()} د.ع /{' '}
                  {purchase.total_usd.toLocaleString()} $
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

export default PurchaseDetails;
