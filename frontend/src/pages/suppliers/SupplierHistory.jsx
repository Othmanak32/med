import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  ArrowBack,
  Visibility as VisibilityIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { arSD } from 'date-fns/locale';
import PageHeader from '../../components/common/PageHeader';

function SupplierHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: supplier } = useQuery(['supplier', id], async () => {
    const response = await axios.get(`/api/suppliers/${id}`);
    return response.data;
  });

  const { data: transactions } = useQuery(
    ['supplier-transactions', id, startDate, endDate, searchQuery],
    async () => {
      const response = await axios.get(`/api/suppliers/${id}/transactions`, {
        params: {
          start_date: startDate?.toISOString(),
          end_date: endDate?.toISOString(),
          search: searchQuery,
        },
      });
      return response.data;
    }
  );

  const handlePrint = async () => {
    try {
      const response = await axios.get(
        `/api/suppliers/${id}/transactions/print`,
        {
          params: {
            start_date: startDate?.toISOString(),
            end_date: endDate?.toISOString(),
          },
          responseType: 'blob',
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `كشف-حساب-${supplier?.name}-${format(
          new Date(),
          'yyyy-MM-dd'
        )}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error printing statement:', error);
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

  const getTransactionLink = (transaction) => {
    switch (transaction.type) {
      case 'purchase':
        return `/purchases/${transaction.reference_id}`;
      case 'return':
        return `/purchases/${transaction.reference_id}/returns/${transaction.id}`;
      default:
        return null;
    }
  };

  return (
    <>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/suppliers/${id}`)}
        sx={{ mb: 3 }}
      >
        العودة إلى تفاصيل المورد
      </Button>

      <PageHeader
        title={`سجل معاملات ${supplier?.name}`}
        actionText="طباعة كشف الحساب"
        actionIcon={<PrintIcon />}
        onActionClick={handlePrint}
      />

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="من تاريخ"
                value={startDate}
                onChange={setStartDate}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <DatePicker
                label="إلى تاريخ"
                value={endDate}
                onChange={setEndDate}
                slotProps={{
                  textField: { fullWidth: true },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="بحث"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>نوع المعاملة</TableCell>
                  <TableCell>الرقم المرجعي</TableCell>
                  <TableCell>التفاصيل</TableCell>
                  <TableCell>المبلغ</TableCell>
                  <TableCell>الرصيد</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions?.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.date), 'PPp', {
                        locale: arSD,
                      })}
                    </TableCell>
                    <TableCell>
                      {getTransactionTypeLabel(transaction.type)}
                    </TableCell>
                    <TableCell>{transaction.reference_number}</TableCell>
                    <TableCell>{transaction.details}</TableCell>
                    <TableCell
                      sx={{
                        color:
                          transaction.amount < 0
                            ? 'success.main'
                            : 'error.main',
                      }}
                    >
                      {transaction.amount.toLocaleString()} د.ع
                    </TableCell>
                    <TableCell
                      sx={{
                        color:
                          transaction.balance < 0
                            ? 'success.main'
                            : 'error.main',
                      }}
                    >
                      {transaction.balance.toLocaleString()} د.ع
                    </TableCell>
                    <TableCell>
                      {getTransactionLink(transaction) && (
                        <Tooltip title="عرض التفاصيل">
                          <IconButton
                            size="small"
                            onClick={() =>
                              navigate(getTransactionLink(transaction))
                            }
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, textAlign: 'left' }}>
            <Typography variant="h6">
              الرصيد الحالي:{' '}
              <span
                style={{
                  color:
                    supplier?.balance < 0
                      ? 'var(--mui-palette-success-main)'
                      : 'var(--mui-palette-error-main)',
                }}
              >
                {supplier?.balance.toLocaleString()} د.ع
              </span>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </>
  );
}

export default SupplierHistory;
