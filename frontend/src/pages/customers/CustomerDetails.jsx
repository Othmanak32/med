import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import {
  ArrowBack,
  Edit as EditIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { arSD } from 'date-fns/locale';

function CustomerDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: customer, isLoading } = useQuery(['customer', id], async () => {
    const response = await axios.get(`/api/customers/${id}`);
    return response.data;
  });

  const { data: recentTransactions } = useQuery(
    ['customer-transactions', id],
    async () => {
      const response = await axios.get(`/api/customers/${id}/transactions`, {
        params: { limit: 5 },
      });
      return response.data;
    },
    { enabled: !!id }
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'active':
        return 'نشط';
      case 'inactive':
        return 'غير نشط';
      default:
        return status;
    }
  };

  const getTransactionTypeLabel = (type) => {
    switch (type) {
      case 'sale':
        return 'مبيعات';
      case 'payment':
        return 'دفع';
      case 'return':
        return 'مرتجع';
      default:
        return type;
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
          onClick={() => navigate('/customers')}
        >
          العودة إلى قائمة العملاء
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/customers/${id}/edit`)}
        >
          تعديل البيانات
        </Button>
        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => navigate(`/customers/${id}/history`)}
        >
          سجل المعاملات
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                معلومات العميل
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  اسم العميل
                </Typography>
                <Typography variant="h6">{customer.name}</Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  رقم الهاتف
                </Typography>
                <Typography>{customer.phone}</Typography>
              </Box>

              {customer.email && (
                <Box sx={{ mb: 2 }}>
                  <Typography color="textSecondary" gutterBottom>
                    البريد الإلكتروني
                  </Typography>
                  <Typography>{customer.email}</Typography>
                </Box>
              )}

              {customer.address && (
                <Box sx={{ mb: 2 }}>
                  <Typography color="textSecondary" gutterBottom>
                    العنوان
                  </Typography>
                  <Typography>{customer.address}</Typography>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  الحالة
                </Typography>
                <Chip
                  label={getStatusLabel(customer.status)}
                  color={getStatusColor(customer.status)}
                />
              </Box>

              {customer.notes && (
                <Box sx={{ mb: 2 }}>
                  <Typography color="textSecondary" gutterBottom>
                    ملاحظات
                  </Typography>
                  <Typography>{customer.notes}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                الإحصائيات المالية
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  إجمالي المبيعات
                </Typography>
                <Typography variant="h6">
                  {customer.total_sales.toLocaleString()} د.ع
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  الرصيد الحالي
                </Typography>
                <Typography
                  variant="h6"
                  color={customer.balance < 0 ? 'error' : 'success'}
                >
                  {customer.balance.toLocaleString()} د.ع
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  الحد الائتماني
                </Typography>
                <Typography variant="h6">
                  {customer.credit_limit.toLocaleString()} د.ع
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Typography variant="h6">آخر المعاملات</Typography>
                <Button
                  onClick={() => navigate(`/customers/${id}/history`)}
                >
                  عرض الكل
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>التاريخ</TableCell>
                      <TableCell>نوع المعاملة</TableCell>
                      <TableCell>الرقم المرجعي</TableCell>
                      <TableCell>المبلغ</TableCell>
                      <TableCell>الرصيد</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentTransactions?.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(
                            new Date(transaction.date),
                            'PPp',
                            { locale: arSD }
                          )}
                        </TableCell>
                        <TableCell>
                          {getTransactionTypeLabel(transaction.type)}
                        </TableCell>
                        <TableCell>{transaction.reference_number}</TableCell>
                        <TableCell>
                          {transaction.amount.toLocaleString()} د.ع
                        </TableCell>
                        <TableCell>
                          {transaction.balance.toLocaleString()} د.ع
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}

export default CustomerDetails;
