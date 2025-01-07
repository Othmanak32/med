import { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { Print as PrintIcon } from '@mui/icons-material';
import axios from 'axios';

export default function PrintButton({
  documentType,
  documentId,
  disabled = false,
  variant = "contained",
  color = "primary",
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handlePrint = async (format = 'pdf', template = 'modern') => {
    try {
      setLoading(true);
      handleClose();

      const response = await axios.get(
        `/api/${documentType}s/${documentId}/pdf`,
        {
          params: { format, template },
          responseType: 'blob',
        }
      );

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `${documentType}_${documentId}.${format}`
      );

      // Append to html link element page
      document.body.appendChild(link);

      // Start download
      link.click();

      // Clean up and remove the link
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error printing document:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        startIcon={loading ? <CircularProgress size={20} /> : <PrintIcon />}
        onClick={handleClick}
        disabled={disabled || loading}
        variant={variant}
        color={color}
      >
        Print
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handlePrint('pdf', 'modern')}>
          Modern PDF
        </MenuItem>
        <MenuItem onClick={() => handlePrint('pdf', 'classic')}>
          Classic PDF
        </MenuItem>
        <MenuItem onClick={() => handlePrint('html', 'modern')}>
          HTML Version
        </MenuItem>
      </Menu>
    </>
  );
}
