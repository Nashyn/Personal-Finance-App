import React, { useState } from 'react';
import { Container, Box, Card, CardContent, TextField, Button, Typography, MenuItem, Grid } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

const theme = createTheme({
    palette: {
      primary: {
        main: '#00b4d8',
      },
      secondary: {
        main: '#ff6392',
      },
      background: {
        default: '#f4f4f4',
      },
    },
    typography: {
      fontFamily: [
        '"Helvetica Neue"',
        'Arial',
        'sans-serif'
      ].join(','),
      h6: {
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.05)',
            borderRadius: 12,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& label.Mui-focused': {
              color: '#00b4d8',
            },
            '& .MuiInput-underline:after': {
              borderBottomColor: '#00b4d8',
            },
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: '#cccccc',
              },
              '&:hover fieldset': {
                borderColor: '#00b4d8',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00b4d8',
              },
            },
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: '#121212', 
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            color: 'white', 
          },
        },
      },
    },
  });

const drawerWidth = 240;


const TaxCalculator = () => {
  const [formData, setFormData] = useState({
    province: '',
    employmentIncome: '',
    selfEmploymentIncome: '',
    otherIncome: '',
    rrspContribution: '',
    capitalGains: '',
    eligibleDividends: '',
    email: '',
  });

  const [taxResult, setTaxResult] = useState(null);
  const [apiUrl, setApiUrl] = useState('');  

  useEffect(() => {
    const fetchApiUrl = async () => {
      try {
        const response = await fetch('https://fetchurlbucket.s3.amazonaws.com/apiConfig.json');
        const config = await response.json();
        setApiUrl(config.taxCalculationApiUrl);  
      } catch (error) {
        console.error('Failed to load API URL:', error);
      }
    };

    fetchApiUrl();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "province" || name === "email" ? value : parseFloat(value) || 0,
    });
  };
  

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    const queryParams = new URLSearchParams({
        email: formData.email,
        province: formData.province,
        employmentIncome: formData.employmentIncome,
        selfEmploymentIncome: formData.selfEmploymentIncome,
        otherIncome: formData.otherIncome,
        rrspContribution: formData.rrspContribution,
        capitalGains: formData.capitalGains,
        eligibleDividends: formData.eligibleDividends
      }).toString();


    
    const response = await fetch(`${apiUrl}/calculate-tax?${queryParams}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    //   body: JSON.stringify(formData),
    });

    const data = await response.json();
    if (response.ok) {
      setTaxResult(data.taxDetails);
    } else {
      console.error(data.error);
     
    }
  };

  return (
    <ThemeProvider theme={theme}>
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          color: 'white', 
        },
      }}
      variant="permanent"
      anchor="left"
    >
      <List>
        <ListItem button component={Link} to="/">
          <ListItemIcon  >
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Home"  />
        </ListItem>
        <ListItem button component={Link} to="/portfolio-overview">
          <ListItemIcon>
            <AccountBalanceWalletIcon />
          </ListItemIcon>
          <ListItemText primary="Portfolio" />
        </ListItem>
      </List>
    </Drawer>    
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Card>
          <Typography variant="h6" gutterBottom>
            Canadian Tax Calculator
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Province"
                  name="province"
                  value={formData.province}
                  onChange={handleInputChange}
                  margin="normal"
                >
                  <MenuItem value="">Select a province</MenuItem>
                  <MenuItem value="Alberta">Alberta</MenuItem>
                  <MenuItem value="British Columbia">British Columbia</MenuItem>
                  <MenuItem value="Manitoba">Manitoba</MenuItem>
                  <MenuItem value="New Brunswick">New Brunswick</MenuItem>
                  <MenuItem value="Newfoundland and Labrador">Newfoundland and Labrador</MenuItem>
                  <MenuItem value="Northwest Territories">Northwest Territories</MenuItem>
                  <MenuItem value="Nova Scotia">Nova Scotia</MenuItem>
                  <MenuItem value="Nunavut">Nunavut</MenuItem>
                  <MenuItem value="Ontario">Ontario</MenuItem>
                  <MenuItem value="Prince Edward Island">Prince Edward Island</MenuItem>
                  <MenuItem value="Saskatchewan">Saskatchewan</MenuItem>
                  <MenuItem value="Yukon">Yukon</MenuItem>
                  </TextField>
                </Grid>

        <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Employment Income"
                    type="number"
                    name="employmentIncome"
                    value={formData.employmentIncome}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Self-Employment Income"
                    type="number"
                    name="selfEmploymentIncome"
                    value={formData.selfEmploymentIncome}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Other Income"
                        type="number"
                        name="otherIncome"
                        value={formData.otherIncome}
                        onChange={handleInputChange}
                        margin="normal"
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="RRSP Contribution"
                        type="number"
                        name="rrspContribution"
                        value={formData.rrspContribution}
                        onChange={handleInputChange}
                        margin="normal"
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Capital Gains"
                        type="number"
                        name="capitalGains"
                        value={formData.capitalGains}
                        onChange={handleInputChange}
                        margin="normal"
                    />
                </Grid>

                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Eligible Dividends"
                        type="number"
                        name="eligibleDividends"
                        value={formData.eligibleDividends}
                        onChange={handleInputChange}
                        margin="normal"
                    />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    margin="normal"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    type="submit"
                    fullWidth
                  >
                    Calculate
                  </Button>
                </Grid>
              </Grid>
            </form>

            {taxResult && (
  <Box sx={{ mt: 2 }}>
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Tax Results
        </Typography>
        <Typography variant="body1">
          <strong>Province:</strong> {taxResult.province}
        </Typography>
        <Typography variant="body1">
          <strong>Total Income:</strong> {taxResult.totalIncome}
        </Typography>
        <Typography variant="body1">
          <strong>Total Tax:</strong> {taxResult.totalTax}
        </Typography>
        <Typography variant="body1">
          <strong>After Tax Income:</strong> {taxResult.afterTaxIncome}
        </Typography>
      </CardContent>
    </Card>
  </Box>
  
            )}
</Card>
</Container>
  </ThemeProvider>
  );

};

export default TaxCalculator;
