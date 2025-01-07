import { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatCurrency } from '../../utils/currency';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function InventoryAnalysis() {
  const [analysisType, setAnalysisType] = useState('value');

  // Fetch inventory analysis data
  const { data: inventoryData, isLoading, error } = useQuery({
    queryKey: ['inventoryAnalysis', analysisType],
    queryFn: async () => {
      const response = await axios.get('/api/reports/inventory-analysis', {
        params: { analysis_type: analysisType },
      });
      return response.data;
    },
  });

  const stockValueData = {
    labels: inventoryData?.stock_value?.map(item => item.category) || [],
    datasets: [
      {
        label: 'Stock Value by Category',
        data: inventoryData?.stock_value?.map(item => item.total_value) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };

  const turnoverData = {
    labels: inventoryData?.turnover?.map(item => item.product_name) || [],
    datasets: [
      {
        label: 'Inventory Turnover Rate',
        data: inventoryData?.turnover?.map(item => item.turnover_rate) || [],
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
      },
    ],
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">Inventory Analysis</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Analysis Type</InputLabel>
          <Select
            value={analysisType}
            label="Analysis Type"
            onChange={(e) => setAnalysisType(e.target.value)}
          >
            <MenuItem value="value">Stock Value</MenuItem>
            <MenuItem value="turnover">Turnover Rate</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error.message}
        </Alert>
      )}

      <Grid container spacing={3}>
        {analysisType === 'value' && (
          <>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Stock Value by Category
                </Typography>
                <Bar data={stockValueData} options={{ maintainAspectRatio: false, height: 300 }} />
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell align="right">Total Items</TableCell>
                      <TableCell align="right">Total Value</TableCell>
                      <TableCell align="right">Average Item Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryData?.stock_value?.map((item) => (
                      <TableRow key={item.category}>
                        <TableCell>{item.category}</TableCell>
                        <TableCell align="right">{item.total_items}</TableCell>
                        <TableCell align="right">{formatCurrency(item.total_value)}</TableCell>
                        <TableCell align="right">
                          {formatCurrency(item.total_value / item.total_items)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </>
        )}

        {analysisType === 'turnover' && (
          <>
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Inventory Turnover Rate
                </Typography>
                <Bar data={turnoverData} options={{ maintainAspectRatio: false, height: 300 }} />
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Units Sold</TableCell>
                      <TableCell align="right">Average Inventory</TableCell>
                      <TableCell align="right">Turnover Rate</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryData?.turnover?.map((item) => (
                      <TableRow key={item.product_id}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell align="right">{item.units_sold}</TableCell>
                        <TableCell align="right">{item.average_inventory}</TableCell>
                        <TableCell align="right">{item.turnover_rate.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
}
