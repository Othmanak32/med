import { useState } from 'react';
import {
  Box,
  Card,
  IconButton,
  TextField,
  InputAdornment,
  Typography,
} from '@mui/material';
import {
  DataGrid,
  arSD,
  GridToolbarContainer,
  GridToolbarExport,
} from '@mui/x-data-grid';
import { Search as SearchIcon } from '@mui/icons-material';

function CustomToolbar() {
  return (
    <GridToolbarContainer>
      <GridToolbarExport />
    </GridToolbarContainer>
  );
}

function DataTable({
  rows,
  columns,
  loading,
  searchField,
  onSearchChange,
  error,
}) {
  const [pageSize, setPageSize] = useState(10);

  return (
    <Card>
      {searchField && (
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <TextField
            placeholder="بحث..."
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            size="small"
          />
        </Box>
      )}

      {error ? (
        <Box sx={{ p: 2 }}>
          <Typography color="error">
            حدث خطأ أثناء تحميل البيانات. يرجى المحاولة مرة أخرى.
          </Typography>
        </Box>
      ) : (
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          pagination
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          rowsPerPageOptions={[5, 10, 25, 50]}
          disableSelectionOnClick
          autoHeight
          localeText={arSD.components.MuiDataGrid.defaultProps.localeText}
          components={{
            Toolbar: CustomToolbar,
          }}
          sx={{
            '& .MuiDataGrid-cell': {
              direction: 'rtl',
            },
          }}
        />
      )}
    </Card>
  );
}

export default DataTable;
