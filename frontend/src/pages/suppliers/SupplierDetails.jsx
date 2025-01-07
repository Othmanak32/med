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

function SupplierDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: supplier, isLoading } = useQuery(['supplier', id], async () => {
    const response = await axios.get(`/api/suppliers/${id}`);
    return response.data;
  });

  const { data: recentTransactions } = useQuery(
    ['supplier-transactions', id],
    async () => {
      const response = await axios.get(`/api/suppliers/${id}/transactions`, {
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
      case 'purchase':
        return 'مشتريات';
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
          onClick={() => navigate('/suppliers')}
        >
          العودة إلى قائمة الموردين
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/suppliers/${id}/edit`)}
        >
          تعديل البيانات
        </Button>
        <Button
          variant="outlined"
          startIcon={<HistoryIcon />}
          onClick={() => navigate(`/suppliers/${id}/history`)}
        >
          سجل المعاملات
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                معلومات المورد
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  اسم المورد
                </Typography>
                <Typography variant="h6">{supplier.name}</Typography>
              </Box>

              {supplier.company_name && (
                <Box sx={{ mb: 2 }}>
                  <Typography color="textSecondary" gutterBottom>
                    اسم الشركة
                  </Typography>
                  <Typography>{supplier.company_name}</Typography>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  رقم الهاتف
                </Typography>
                <Typography>{supplier.phone}</Typography>
              </Box>

              {supplier.email && (
                <Box sx={{ mb: 2 }}>
                  <Typography color="textSecondary" gutterBottom>
                    البريد الإلكتروني
                  </Typography>
                  <Typography>{supplier.email}</Typography>
                </Box>
              )}

              {supplier.address && (
                <Box sx={{ mb: 2 }}>
                  <Typography color="textSecondary" gutterBottom>
                    العنوان
                  </Typography>
                  <Typography>{supplier.address}</Typography>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  الحالة
                </Typography>
                <Chip
                  label={getStatusLabel(supplier.status)}
                  color={getStatusColor(supplier.status)}
                />
              </Box>

              {supplier.notes && (
                <Box sx={{ mb: 2 }}>
                  <Typography color="textSecondary" gutterBottom>
                    ملاحظات
                  </Typography>
                  <Typography>{supplier.notes}</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                المعلومات المالية
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  إجمالي المشتريات
                </Typography>
                <Typography variant="h6">
                  {supplier.total_purchases.toLocaleString()} د.ع
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  الرصيد الحالي
                </Typography>
                <Typography
                  variant="h6"
                  color={supplier.balance < 0 ? 'success' : 'error'}
                >
                  {supplier.balance.toLocaleString()} د.ع
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  الحد الائتماني
                </Typography>
                <Typography variant="h6">
                  {supplier.credit_limit.toLocaleString()} د.ع
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography color="textSecondary" gutterBottom>
                  مدة السداد
                </Typography>
                <Typography variant="h6">
                  {supplier.payment_terms} يوم
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {(supplier.bank_name || supplier.bank_account) && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  المعلومات البنكية
                </Typography>
                <Divider sx={{ mb: 2 }} />

                {supplier.bank_name && (
                  <Box sx={{ mb: 2 }}>
                    <Typography color="textSecondary" gutterBottom>
                      اسم البنك
                    </Typography>
                    <Typography>{supplier.bank_name}</Typography>
                  </Box>
                )}

                {supplier.bank_account && (
                  <Box sx={{ mb: 2 }}>
                    <Typography color="textSecondary" gutterBottom>
                      رقم الحساب
                    </Typography>
                    <Typography>{supplier.bank_account}</Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
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
                  onClick={() => navigate(`/suppliers/${id}/history`)}
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

export default SupplierDetails;
