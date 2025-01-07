import { Card, CardContent, CardHeader, CardActions, Divider } from '@mui/material';

function FormCard({
  title,
  subtitle,
  actions,
  children,
}) {
  return (
    <Card>
      <CardHeader
        title={title}
        subheader={subtitle}
        titleTypographyProps={{ variant: 'h6' }}
      />
      <Divider />
      <CardContent>{children}</CardContent>
      {actions && (
        <>
          <Divider />
          <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
            {actions}
          </CardActions>
        </>
      )}
    </Card>
  );
}

export default FormCard;
