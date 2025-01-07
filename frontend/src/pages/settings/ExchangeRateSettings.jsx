import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format } from 'date-fns';

const validationSchema = Yup.object({
  usd_to_iqd_rate: Yup.number()
    .required('Exchange rate is required')
    .positive('Exchange rate must be positive'),
  effective_date: Yup.date().nullable(),
});

export default function ExchangeRateSettings() {
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  // Fetch exchange rates
  const { data: rates, isLoading } = useQuery({
    queryKey: ['exchangeRates'],
    queryFn: async () => {
      const response = await axios.get('/api/exchange-rates/');
      return response.data;
    },
  });

  // Mutation for creating new exchange rate
  const createRate = useMutation({
    mutationFn: async (values) => {
      const response = await axios.post('/api/exchange-rates/', values);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['exchangeRates']);
      formik.resetForm();
    },
    onError: (error) => {
      setError(error.response?.data?.detail || 'An error occurred');
    },
  });

  const formik = useFormik({
    initialValues: {
      usd_to_iqd_rate: '',
      effective_date: null,
    },
    validationSchema,
    onSubmit: (values) => {
      createRate.mutate(values);
    },
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Exchange Rate Settings
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <form onSubmit={formik.handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              id="usd_to_iqd_rate"
              name="usd_to_iqd_rate"
              label="USD to IQD Rate"
              type="number"
              value={formik.values.usd_to_iqd_rate}
              onChange={formik.handleChange}
              error={formik.touched.usd_to_iqd_rate && Boolean(formik.errors.usd_to_iqd_rate)}
              helperText={formik.touched.usd_to_iqd_rate && formik.errors.usd_to_iqd_rate}
            />
            <DateTimePicker
              label="Effective Date"
              value={formik.values.effective_date}
              onChange={(value) => formik.setFieldValue('effective_date', value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  error={formik.touched.effective_date && Boolean(formik.errors.effective_date)}
                  helperText={formik.touched.effective_date && formik.errors.effective_date}
                />
              )}
            />
            <Button
              variant="contained"
              type="submit"
              disabled={createRate.isLoading}
            >
              Add New Rate
            </Button>
          </Box>
        </form>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Rate (USD to IQD)</TableCell>
              <TableCell>Effective Date</TableCell>
              <TableCell>Last Updated</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!isLoading &&
              rates?.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{rate.usd_to_iqd_rate}</TableCell>
                  <TableCell>
                    {format(new Date(rate.effective_date), 'PPpp')}
                  </TableCell>
                  <TableCell>
                    {format(new Date(rate.updated_at), 'PPpp')}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
