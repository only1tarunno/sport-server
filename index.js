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
    origin: [
      "http://localhost:5173",
      "https://fitness-and-sports-f762a.web.app",
      "https://fitness-and-sports-f762a.firebaseapp.com",
    ],
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

// our middlewares
const verifyToken = (req, res, next) => {
  const token = req?.cookies?.token;
  // no token
  if (!token) {
    return res.status(401).send({ message: "UnAuthorized" });
  }
  // token verify
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "UnAuthorized" });
    }
    req.user = decoded;
    next();
  });
};

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
const bookingCollection = client.db("clubfit").collection("bookingCollection");

// auth related api
app.post("/jwt", async (req, res) => {
  const user = req.body;

  const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
    expiresIn: "1h",
  });
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .send({ token: true });
});

app.post("/logout", async (req, res) => {
  const user = req.body;

  res.clearCookie("token", { maxAge: 0 }).send({ logout: "sucess" });
});

// service related Api
// show all services
app.get("/services", async (req, res) => {
  const cursor = serviceCollection.find();
  const result = await cursor.toArray();
  res.send(result);
});

// show a single service
app.get("/services/:id", verifyToken, async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await serviceCollection.findOne(query);
  res.send(result);
});

// add a service
app.post("/services", async (req, res) => {
  const product = req.body;
  const result = await serviceCollection.insertOne(product);
  res.send(result);
});

// search start here
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

// my services related api
app.get("/myservices", verifyToken, async (req, res) => {
  let query = {};
  if (req.query?.email) {
    query = {
      email: req.query.email,
    };
  }
  const result = await serviceCollection.find(query).toArray();
  res.send(result);
});

// UPDATE SERVICE
app.patch("/myservices/:id", async (req, res) => {
  const id = req.params.id;

  const filter = { _id: new ObjectId(id) };
  const updatedService = req.body;

  const updateDoc = {
    $set: {
      ...updatedService,
    },
  };
  const result = await serviceCollection.updateOne(filter, updateDoc);
  res.send(result);
});

// my service delete
app.delete("/myservices/:id", async (req, res) => {
  const id = req.params.id;

  const query = { _id: new ObjectId(id) };
  const result = await serviceCollection.deleteOne(query);
  res.send(result);
});

// booking
app.get("/bookings", verifyToken, async (req, res) => {
  if (req.query.email !== req.user.email) {
    return res.status(403).send({ message: "forbidden" });
  }

  let query = {};
  if (req.query?.email) {
    query = {
      userEmail: req.query.email,
    };
  }
  const result = await bookingCollection.find(query).toArray();
  res.send(result);
});

// booking add
app.post("/bookings", async (req, res) => {
  const booking = req.body;

  const result = await bookingCollection.insertOne(booking);
  res.send(result);
});

// pending work api
app.get("/pendings", verifyToken, async (req, res) => {
  if (req.query.email !== req.user.email) {
    return res.status(403).send({ message: "forbidden" });
  }

  let query = {};
  if (req.query?.email) {
    query = {
      email: req.query.email,
    };
  }
  const result = await bookingCollection.find(query).toArray();
  res.send(result);
});
// UPDATE pending work status
app.patch("/bookings/:id", async (req, res) => {
  const id = req.params.id;

  const filter = { _id: new ObjectId(id) };
  const updatedService = req.body;
  const updateDoc = {
    $set: {
      workStatus: updatedService.value,
    },
  };
  const result = await bookingCollection.updateOne(filter, updateDoc);
  res.send(result);
});

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port);
