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
import { format } from 'date-fns';
import { arSD } from 'date-fns/locale';

function RecentTransactions({ transactions }) {
  const getTransactionColor = (type) => {
    switch (type) {
      case 'sale':
        return 'success';
      case 'purchase':
        return 'primary';
      case 'return':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTransactionLabel = (type) => {
    switch (type) {
      case 'sale':
        return 'مبيعات';
      case 'purchase':
        return 'مشتريات';
      case 'return':
        return 'مرتجع';
      default:
        return type;
    }
  };

  return (
    <Card>
      <CardHeader title="آخر المعاملات" />
      <CardContent>
        <List>
          {transactions.map((transaction) => (
            <ListItem key={transaction.id}>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle2">
                      {transaction.description}
                    </Typography>
                    <Chip
                      label={getTransactionLabel(transaction.type)}
                      color={getTransactionColor(transaction.type)}
                      size="small"
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="body2" color="textSecondary">
                      {format(new Date(transaction.date), 'PPpp', { locale: arSD })}
                    </Typography>
                    <Typography
                      variant="body2"
                      color={transaction.type === 'sale' ? 'success.main' : 'primary.main'}
                      fontWeight="bold"
                    >
                      {transaction.amount.toLocaleString()} د.ع
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

export default RecentTransactions;
