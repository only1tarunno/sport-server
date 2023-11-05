require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.PORT || 5000;

const app = express();
const cors = require("cors");

// middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.USER}:${process.env.KEY}@cluster0.a27cvav.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const dbConnect = async () => {
  try {
    client.connect();
    console.log(" Database Connected Successfully✅ ");
  } catch (error) {
    console.log(error.name, error.message);
  }
};
dbConnect();

const serviceCollection = client.db("clubfit").collection("serviceCollection");

// show all services
app.get("/services", async (req, res) => {
  const cursor = serviceCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});

// add a service
app.post("/services", async (req, res) => {
  const product = req.body;
  const result = await serviceCollection.insertOne(product);
  res.send(result);
});

// serch start here
app.post("/search", async (req, res) => {
  const { query } = req.body;
  if (!req.body) {
    const results = await serviceCollection.find().toArray();
    return res.json(results);
  }
  const filter = {
    $or: [
      { serviceName: { $regex: query, $options: "i" } }, // Case-insensitive title search
    ],
  };
  const results = await serviceCollection.find(filter).toArray();

  res.json(results);
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port);
