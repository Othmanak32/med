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
import { ArrowBack, Edit as EditIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';
import { arSD } from 'date-fns/locale';

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: product, isLoading } = useQuery(['product', id], async () => {
    const response = await axios.get(`/api/products/${id}`);
    return response.data;
  });

  const { data: movements } = useQuery(
    ['product-movements', id],
    async () => {
      const response = await axios.get(`/api/products/${id}/movements`);
      return response.data;
    },
    { enabled: !!id }
  );

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/products')}
        >
          العودة إلى قائمة المنتجات
        </Button>
        <Button
          variant="contained"
          startIcon={<EditIcon />}
          onClick={() => navigate(`/products/${id}/edit`)}
        >
          تعديل المنتج
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <Box
              sx={{
                width: '100%',
                height: 300,
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              <img
                src={product.image_url || '/placeholder.png'}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </Box>
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {product.name}
              </Typography>
              <Typography color="textSecondary" gutterBottom>
                رمز المنتج: {product.sku}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    السعر (د.ع)
                  </Typography>
                  <Typography variant="h6">
                    {product.price_iqd.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="textSecondary">
                    السعر ($)
                  </Typography>
                  <Typography variant="h6">
                    {product.price_usd.toLocaleString()}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary">
                    المخزون الحالي
                  </Typography>
                  <Typography
                    variant="h6"
                    color={
                      product.current_stock <= 10 ? 'error.main' : 'success.main'
                    }
                  >
                    {product.current_stock} قطعة
                  </Typography>
                </Grid>
              </Grid>
              {product.description && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="textSecondary">
                    الوصف
                  </Typography>
                  <Typography>{product.description}</Typography>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                حركة المخزون
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>التاريخ</TableCell>
                      <TableCell>النوع</TableCell>
                      <TableCell>الكمية</TableCell>
                      <TableCell>الرصيد</TableCell>
                      <TableCell>ملاحظات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movements?.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {format(
                            new Date(movement.date),
                            'PPpp',
                            { locale: arSD }
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              movement.type === 'in'
                                ? 'وارد'
                                : 'صادر'
                            }
                            color={
                              movement.type === 'in'
                                ? 'success'
                                : 'error'
                            }
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {movement.type === 'in' ? '+' : '-'}
                          {movement.quantity}
                        </TableCell>
                        <TableCell>{movement.balance}</TableCell>
                        <TableCell>{movement.notes}</TableCell>
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

export default ProductDetails;
