import {
  Card,
  CardHeader,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Typography,
  Box,
  Chip,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

function LowStockAlert({ products }) {
  return (
    <Card>
      <CardHeader
        title="تنبيهات المخزون"
        action={
          <Chip
            icon={<WarningIcon />}
            label={`${products.length} منتجات`}
            color="warning"
          />
        }
      />
      <CardContent>
        <List>
          {products.map((product) => (
            <ListItem key={product.id}>
              <ListItemText
                primary={product.name}
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      الكمية المتوفرة:
                    </Typography>
                    <Typography
                      variant="body2"
                      color={product.current_stock === 0 ? 'error' : 'warning.main'}
                      fontWeight="bold"
                    >
                      {product.current_stock} قطعة
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

export default LowStockAlert;
