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
  Undo as UndoIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { arSD } from 'date-fns/locale';

function SaleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: sale, isLoading } = useQuery(['sale', id], async () => {
    const response = await axios.get(`/api/sales/${id}`);
    return response.data;
  });

  const handlePrint = async () => {
    try {
      const response = await axios.get(`/api/sales/${id}/print`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `فاتورة-${sale.invoice_number}.pdf`);
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
      case 'returned':
        return 'info';
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
      case 'returned':
        return 'مرتجعة';
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
          onClick={() => navigate('/sales')}
        >
          العودة إلى قائمة المبيعات
        </Button>
        {sale.status !== 'completed' && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/sales/${id}/edit`)}
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
        {sale.status === 'completed' && (
          <Button
            variant="outlined"
            color="warning"
            startIcon={<UndoIcon />}
            onClick={() => navigate(`/sales/${id}/return`)}
          >
            إرجاع
          </Button>
        )}
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
                <Typography variant="h6">{sale.invoice_number}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  التاريخ
                </Typography>
                <Typography>
                  {format(new Date(sale.date), 'PPpp', { locale: arSD })}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  العميل
                </Typography>
                <Typography>{sale.customer_name}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  الحالة
                </Typography>
                <Chip
                  label={getStatusLabel(sale.status)}
                  color={getStatusColor(sale.status)}
                />
              </Box>

              {sale.notes && (
                <Box sx={{ mb: 2 }}>
                  <Typography color="textSecondary" gutterBottom>
                    ملاحظات
                  </Typography>
                  <Typography>{sale.notes}</Typography>
                </Box>
              )}
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
                    {sale.items.map((item, index) => (
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
                  المجموع الكلي: {sale.total_iqd.toLocaleString()} د.ع /{' '}
                  {sale.total_usd.toLocaleString()} $
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {sale.returns && sale.returns.length > 0 && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  المرتجعات
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>التاريخ</TableCell>
                        <TableCell>المنتج</TableCell>
                        <TableCell>الكمية</TableCell>
                        <TableCell>السبب</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sale.returns.map((return_item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {format(new Date(return_item.date), 'PPpp', {
                              locale: arSD,
                            })}
                          </TableCell>
                          <TableCell>
                            {return_item.product_name}
                          </TableCell>
                          <TableCell>{return_item.quantity}</TableCell>
                          <TableCell>{return_item.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </>
  );
}

export default SaleDetails;
