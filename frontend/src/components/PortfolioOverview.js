import React, { useState } from 'react';
import {Link} from 'react-router-dom';
import { Container, Card, CardContent, TextField, Button, Typography, IconButton, Box} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
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

  


const PortfolioOverview = () => {
  const [formData, setFormData] = useState({
    email: '', 
    cashAccounts: '',
    realEstate: '',
    stocks: '',
    bonds: '',
    savings: '',
    liabilities: '',
    loans: '',
    crypto: '',
  });

  const [file, setFile] = useState(null);
  const [userFinanceApiUrl, setUserFinanceApiUrl] = useState('');

  useEffect(() => {
    const fetchApiUrl = async () => {
      try {
        const response = await fetch('https://fetchurlbucket.s3.amazonaws.com/apiConfig.json');
        const config = await response.json();
        setUserFinanceApiUrl(config.userFinanceApiUrl); 
      } catch (error) {
        console.error('Failed to load API URL:', error);
      }
    };

    fetchApiUrl();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    } else {
      setFile(null);
    }
  };

  const getPresignedUrl = async (file) => {
    const response = await fetch(`${userFinanceApiUrl}/get-presigned-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileType: file.type }),
    });
    if (!response.ok) throw new Error('Failed to fetch the presigned URL');
    return response.json();
  };

  const uploadFileToS3 = async (file, url, key) => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type
      },
      body: file,
    });
    if (!response.ok) throw new Error('Failed to upload file to S3');
    return key;  
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    let imageKey = null;

    try {
      if (file) {
        const presignedData = await getPresignedUrl(file);
        console.log(presignedData) 
        imageKey = await uploadFileToS3(file,presignedData.uploadURL, presignedData.key); 
        
      }

      const payload = JSON.stringify({
        email: formData.email,
        imageKey: imageKey,  
        financialData: {
          cashAccounts: formData.cashAccounts,
          realEstate: formData.realEstate,
          stocks: formData.stocks,
          bonds: formData.bonds,
          savings: formData.savings,
          liabilities: formData.liabilities,
          loans: formData.loans,
          crypto: formData.crypto,
        },
      });

      const response = await fetch(`${userFinanceApiUrl}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
      });

      if (!response.ok) throw new Error('Failed to submit the form');

      const responseData = await response.json();
      console.log('Response:', responseData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

   
   const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
   const chartData = Object.keys(formData)
     .filter(key => key !== 'email' && formData[key]) 
     .map((key, index) => ({
       name: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
       value: Number(formData[key]),
       fillColor: CHART_COLORS[index % CHART_COLORS.length]
     }));

  

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
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem button component={Link} to="/portfolio-overview">
          <ListItemIcon>
            <AccountBalanceWalletIcon />
          </ListItemIcon>
          <ListItemText primary="Portfolio" />
        </ListItem>
      </List>
    </Drawer>
    
    <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', mt: 4, ml: `${drawerWidth}px` }}>
      <Box sx={{ width: '100%' }}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Portfolio Overview
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                margin="normal"
                required
              />
              {Object.keys(formData).filter(key => key !== 'email' && key !== 'image').map((key) => (
                <TextField
                  fullWidth
                  label={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                  type="number"
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  margin="normal"
                  key={key}
                />
              ))}
              <div>
                <label htmlFor="icon-button-file">
                  <input 
                    accept="image/*" 
                    id="icon-button-file" 
                    type="file" 
                    style={{ display: 'none' }} 
                    onChange={handleFileChange}
                  />
                  <IconButton 
                    color="primary" 
                    aria-label="upload picture" 
                    component="span"
                  >
                    <PhotoCamera />
                  </IconButton>
                  Upload Image
                </label>
              </div>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                sx={{ mt: 2 }}
              >
                Submit
              </Button>
            </form>
          </CardContent>
        </Card>
        <Box sx={{ height: '400px', width: '100%', mt: 2 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                dataKey="value"
                isAnimationActive={false}
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fillColor} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Box>
    </Container>
  </ThemeProvider>
);};
       



export default PortfolioOverview;
