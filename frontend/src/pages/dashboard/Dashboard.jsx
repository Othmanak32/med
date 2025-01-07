import { useState, useEffect } from 'react';
import { Grid, Box } from '@mui/material';
import {
  TrendingUp,
  ShoppingCart,
  LocalShipping,
  AccountBalance,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import StatsCard from '../../components/common/StatsCard';
import SalesChart from '../../components/dashboard/SalesChart';
import TopProducts from '../../components/dashboard/TopProducts';
import LowStockAlert from '../../components/dashboard/LowStockAlert';
import RecentTransactions from '../../components/dashboard/RecentTransactions';

function Dashboard() {
  const { data: dashboardData, isLoading } = useQuery(
    ['dashboard'],
    async () => {
      const response = await axios.get('/api/dashboard');
      return response.data;
    }
  );

  const salesChartData = {
    labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
    datasets: [
      {
        label: 'المبيعات',
        data: dashboardData?.monthlySales || [],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'المشتريات',
        data: dashboardData?.monthlyPurchases || [],
        borderColor: 'rgb(54, 162, 235)',
        tension: 0.1,
      },
    ],
  };

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <Box sx={{ py: 3 }}>
      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="إجمالي المبيعات"
            value={`${dashboardData.totalSales.toLocaleString()} د.ع`}
            icon={<TrendingUp />}
            color="success"
            trend={{
              type: 'positive',
              value: '+15% من الشهر الماضي',
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="المبيعات اليومية"
            value={`${dashboardData.dailySales.toLocaleString()} د.ع`}
            icon={<ShoppingCart />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="المشتريات"
            value={`${dashboardData.totalPurchases.toLocaleString()} د.ع`}
            icon={<LocalShipping />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="صافي الربح"
            value={`${dashboardData.netProfit.toLocaleString()} د.ع`}
            icon={<AccountBalance />}
            color="info"
            trend={{
              type: 'positive',
              value: '+10% من الشهر الماضي',
            }}
          />
        </Grid>

        {/* Charts and Lists */}
        <Grid item xs={12} md={8}>
          <SalesChart data={salesChartData} />
        </Grid>
        <Grid item xs={12} md={4}>
          <TopProducts products={dashboardData.topProducts} />
        </Grid>
        <Grid item xs={12} md={8}>
          <RecentTransactions transactions={dashboardData.recentTransactions} />
        </Grid>
        <Grid item xs={12} md={4}>
          <LowStockAlert products={dashboardData.lowStockProducts} />
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
