import { Button, CircularProgress } from '@mui/material';

function LoadingButton({
  loading,
  children,
  ...props
}) {
  return (
    <Button
      disabled={loading}
      {...props}
    >
      {loading ? (
        <CircularProgress size={24} color="inherit" />
      ) : (
        children
      )}
    </Button>
  );
}

export default LoadingButton;
