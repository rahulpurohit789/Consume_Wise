import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';

const ProductConsumptionChecker = () => {
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:5000/api/check-consumption', {
        product_name: productName
      });
      setResult(response.data);
    } catch (err) {
      setError('Failed to analyze product. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ maxWidth: 600, width: '100%', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom align="center">
          Product Consumption Checker
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom align="center">
          Enter a product name to check if it's safe to consume
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Product Name"
            variant="outlined"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            disabled={loading}
            sx={{ mb: 2 }}
          />
          
          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading || !productName.trim()}
            sx={{ mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Check Product'}
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Box sx={{ mt: 3 }}>
            <Alert
              icon={result.is_consumable ? <CheckCircleIcon /> : <CancelIcon />}
              severity={result.is_consumable ? 'success' : 'warning'}
            >
              <Typography variant="body1">
                {result.is_consumable
                  ? 'This product appears to be safe for consumption.'
                  : 'This product may not be safe for consumption.'}
              </Typography>
              {result.explanation && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {result.explanation}
                </Typography>
              )}
            </Alert>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductConsumptionChecker; 