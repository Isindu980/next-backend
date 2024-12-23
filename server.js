require('dotenv').config();
import express, { json } from 'express';
import { sign } from 'jsonwebtoken';
import { MongoClient, ServerApiVersion } from 'mongodb';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const dbName = 'test';
const usersCollectionName = 'auth';

async function run() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error", error);
  }
}
run().catch(console.error);

const JWT_SECRET = process.env.JWT_SECRET;

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const user = await client.db(dbName).collection(usersCollectionName).findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'User does not exist.' });
    }

    if (user.password !== password) {
      return res.status(400).json({ success: false, message: 'Incorrect password.' });
    }

    const token = sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      userData: user
    });
  } catch (error) {
    console.error("Error during login process:", error);
    res.status(500).json({ success: false, message: 'Server error during login process.' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
