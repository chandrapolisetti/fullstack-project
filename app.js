const express = require('express');
const request = require('request');
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Firebase Admin SDK initialization
const serviceAccount = require('./key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-ylhq4%40project-chandra-b3992.iam.gserviceaccount.com', // Replace with your Firebase project URL
});

const db = admin.firestore();

app.set('view engine', 'ejs');
app.use(express.static('songs'));
app.use(bodyParser.urlencoded({ extended: true }));

// Routes for user signup and login
app.get('/', (req, res) => {
  res.render('login', { message: '' });
});

app.get('/signup', (req, res) => {
  res.render('signup', { message: '' });
});

app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.render('signup', { message: 'All fields are required.' });
  }

  // Check if the user already exists in Firestore
  const userRef = db.collection('users').doc(username);
  const userSnapshot = await userRef.get();

  if (userSnapshot.exists) {
    return res.render('signup', { message: 'Username already exists. Please choose another one.' });
  }

  // Create a new user in Firestore
  await userRef.set({ email, password });

  res.render('login', { message: 'Signup successful. Please log in.' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render('login', { message: 'Username and password are required.' });
  }

  // Check if the user exists in Firestore and the password matches
  const userRef = db.collection('users').doc(username);
  const userSnapshot = await userRef.get();

  if (!userSnapshot.exists || userSnapshot.data().password !== password) {
    return res.render('login', { message: 'Invalid username or password. Please try again.' });
  }

  // Display a success message
  res.render('dashboard', { message: 'Login successful.', username: username });
});

app.get('/search', (req, res) => {
  const cityName = req.query.city;
  const apiKey = 'hxnXcXt3A0jJKkahJuak6UtUm7Hn0YW1XbEd69gk'; // Replace with your actual API key
  const apiUrl = `https://api.api-ninjas.com/v1/airports?name=${cityName}`;

  request.get({
    url: apiUrl,
    headers: {
      'X-Api-Key': apiKey,
    },
  }, function(error, response, body) {
    if (error) {
      console.error('Request failed:', error);
      res.status(500).send('An error occurred while fetching airport data. Please check your input and try again.');
    } else if (response.statusCode != 200) {
      console.error('Error:', response.statusCode, body.toString('utf8'));
      res.status(response.statusCode).send('An error occurred while fetching airport data.');
    } else {
      const airportData = JSON.parse(body);
      res.render('airport', { airportData });
    }
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
