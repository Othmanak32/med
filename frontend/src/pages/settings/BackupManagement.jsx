import { useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { format, parseISO } from 'date-fns';

export default function BackupManagement() {
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [error, setError] = useState(null);
  const queryClient = useQueryClient();

  // Fetch backups
  const { data: backups, isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: async () => {
      const response = await axios.get('/api/backups/');
      return response.data;
    },
  });

  // Create backup mutation
  const createBackup = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/backups/');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['backups']);
    },
    onError: (error) => {
      setError(error.response?.data?.detail || 'Failed to create backup');
    },
  });

  // Restore backup mutation
  const restoreBackup = useMutation({
    mutationFn: async (backupName) => {
      const response = await axios.post(`/api/backups/${backupName}/restore`);
      return response.data;
    },
    onSuccess: () => {
      setRestoreDialogOpen(false);
      queryClient.invalidateQueries(['backups']);
    },
    onError: (error) => {
      setError(error.response?.data?.detail || 'Failed to restore backup');
    },
  });

  const handleDownload = async (backupName) => {
    try {
      const response = await axios.get(`/api/backups/${backupName}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${backupName}.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      setError('Failed to download backup');
    }
  };

  const handleRestore = (backup) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = () => {
    if (selectedBackup) {
      restoreBackup.mutate(selectedBackup.name);
    }
  };

  const formatSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Backup Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => createBackup.mutate()}
            disabled={createBackup.isLoading}
          >
            {createBackup.isLoading ? (
              <CircularProgress size={24} />
            ) : (
              'Create Backup'
            )}
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Backup Name</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Version</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!isLoading &&
                backups?.map((backup) => (
                  <TableRow key={backup.name}>
                    <TableCell>{backup.name}</TableCell>
                    <TableCell>
                      {format(parseISO(backup.created_at), 'PPpp')}
                    </TableCell>
                    <TableCell>{formatSize(backup.size)}</TableCell>
                    <TableCell>{backup.version}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        onClick={() => handleDownload(backup.name)}
                        title="Download"
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleRestore(backup)}
                        title="Restore"
                      >
                        <RestoreIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Restore Confirmation Dialog */}
      <Dialog
        open={restoreDialogOpen}
        onClose={() => setRestoreDialogOpen(false)}
      >
        <DialogTitle>Confirm Restore</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to restore from backup "{selectedBackup?.name}"?
            This will replace all current data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={confirmRestore}
            color="primary"
            disabled={restoreBackup.isLoading}
          >
            {restoreBackup.isLoading ? (
              <CircularProgress size={24} />
            ) : (
              'Restore'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
