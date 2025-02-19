import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json()); 

app.get('/oauth', async (req, res) => {
  const code = req.query.code; 

  if (!code) {
    return res.status(400).send('Error: Missing code');
  }

  try {
    //  Get the access token using the code
    const tokenResponse = await axios.post('https://appsumo.com/openid/token/', {
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      code: code,
      redirect_uri: process.env.REDIRECT_URI,
      grant_type: 'authorization_code'
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    // Extract tokens
    const { access_token, refresh_token } = tokenResponse.data;

    const licenseResponse = await axios.get(`https://appsumo.com/openid/license_key/?access_token=${access_token}`);

    const licenseData = licenseResponse.data;
    res.json({
      success : true,
      access_token: access_token,
      refresh_token : refresh_token,
      licenseData: licenseResponse.key,
    });

  } catch (error) {
    console.error('OAuth or License fetch error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/login', (req, res) => {
  const authorizationUrl = `https://appsumo.com/openid/authorize/?client_id=${process.env.CLIENT_ID}&redirect_uri=${process.env.REDIRECT_URI}&response_type=code&scope=read_license`;
  res.redirect(authorizationUrl);
});

app.post('/refresh-token', async (req, res) => {
    const { refresh_token } = req.body;
  
    try {
      const response = await axios.post('https://appsumo.com/openid/token/', {
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        refresh_token: refresh_token,
        grant_type: 'refresh_token'
      });

      const { access_token, refresh_token: newRefreshToken } = response.data;
      res.json({ access_token, refresh_token: newRefreshToken });
    } catch (error) {
      console.error('Error refreshing token:', error);
      res.status(500).send('Failed to refresh token');
    }
  });
  

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
