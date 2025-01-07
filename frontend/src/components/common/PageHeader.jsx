import { Box, Typography, Button } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

function PageHeader({
  title,
  actionText,
  onActionClick,
  children,
}) {
  return (
    <Box
      sx={{
        mb: 3,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        justifyContent: 'space-between',
        gap: 2,
      }}
    >
      <Typography variant="h5" component="h1" fontWeight="bold">
        {title}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        {children}
        {actionText && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={onActionClick}
          >
            {actionText}
          </Button>
        )}
      </Box>
    </Box>
  );
}

export default PageHeader;
