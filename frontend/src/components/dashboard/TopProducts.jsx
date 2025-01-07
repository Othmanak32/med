import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';

function TopProducts({ products }) {
  const maxQuantity = Math.max(...products.map((product) => product.quantity));

  return (
    <Card>
      <CardHeader title="المنتجات الأكثر مبيعاً" />
      <CardContent>
        <List>
          {products.map((product) => (
            <ListItem key={product.id} sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <Box sx={{ width: '100%', mb: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {product.name}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="textSecondary">
                    {product.quantity} قطعة
                  </Typography>
                  <Typography variant="body2" color="primary">
                    {product.revenue.toLocaleString()} د.ع
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={(product.quantity / maxQuantity) * 100}
                />
              </Box>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default TopProducts;
