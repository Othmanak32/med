import { Card, CardContent, Typography, Box } from '@mui/material';

function StatsCard({
  title,
  value,
  icon,
  trend,
  color = 'primary',
}) {
  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography
              color="textSecondary"
              gutterBottom
              variant="overline"
            >
              {title}
            </Typography>
            <Typography variant="h4" color={`${color}.main`}>
              {value}
            </Typography>
            {trend && (
              <Typography
                color={trend.type === 'positive' ? 'success.main' : 'error.main'}
                sx={{
                  alignItems: 'center',
                  display: 'flex',
                  mt: 1,
                }}
                variant="body2"
              >
                {trend.value}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              backgroundColor: `${color}.light`,
              borderRadius: 1,
              p: 1,
              color: `${color}.main`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default StatsCard;
