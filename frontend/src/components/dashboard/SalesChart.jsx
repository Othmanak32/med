import { Card, CardContent, CardHeader, Box } from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      rtl: true,
      labels: {
        font: {
          family: 'Cairo',
        },
      },
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        font: {
          family: 'Cairo',
        },
      },
    },
    x: {
      ticks: {
        font: {
          family: 'Cairo',
        },
      },
    },
  },
};

function SalesChart({ data }) {
  return (
    <Card>
      <CardHeader title="المبيعات الشهرية" />
      <CardContent>
        <Box sx={{ height: 300 }}>
          <Line options={options} data={data} />
        </Box>
      </CardContent>
    </Card>
  );
}

export default SalesChart;
