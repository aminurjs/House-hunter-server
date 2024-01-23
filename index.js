const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.port || 5000;

//MiddleWare
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: ["https://techfirmit.web.app", "http://localhost:5173"],
    credentials: true,
  })
);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sz2xe62.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const usersCollection = client.db("HouseHunter").collection("users");
const houseCollection = client.db("HouseHunter").collection("houses");
const bookingCollection = client.db("HouseHunter").collection("bookingList");

app.post("/register", async (req, res) => {
  const data = req.body;

  const email = data.email;
  console.log(email);
  const query = { email: email };
  const user = await usersCollection.findOne(query);
  if (user) {
    res.status(409).send("Email already used");
  } else {
    const result = await usersCollection.insertOne(data);
    const token = jwt.sign({ email }, process.env.SECRETE, {
      expiresIn: "365days",
    });
    console.log(token);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.send(result);
  }
});

app.post("/login", async (req, res) => {
  const user = req.body;
  const { email } = user;
  const result = await usersCollection.findOne(user, {
    projection: { password: 0 },
  });
  if (!result) {
    res.status(401).send("Email/Password not Match");
  } else {
    const token = jwt.sign({ email }, process.env.SECRETE, {
      expiresIn: "365days",
    });
    console.log(token);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });
    res.status(200).send("Login successful");
  }
});

app.get("/user", async (req, res) => {
  const { token } = req.cookies;
  //   if client does not send token
  if (!token) {
    return res.send(null);
  }
  jwt.verify(token, process.env.SECRETE, async function (err, decoded) {
    if (err) {
      return res.send(null);
    }
    // attach decoded user so that others can get it
    const { email } = decoded;
    const query = { email };
    const user = await usersCollection.findOne(query, {
      projection: { password: 0 },
    });
    if (user) {
      res.send(user);
    } else {
      res.send(null);
    }
  });
});

app.post("/auth/logout", async (req, res) => {
  res.clearCookie("token").send({ success: true });
});
app.post("/add-new-house", async (req, res) => {
  const data = req.body;
  const result = await houseCollection.insertOne(data);
  res.send(result);
});
app.patch("/update-house/:id", async (req, res) => {
  const id = req.params.id;
  const data = req.body;
  const query = { _id: new ObjectId(id) };
  const options = { upsert: true };
  console.log({ ...data });

  const updatedHouse = {
    $set: {
      ...data,
    },
  };
  const result = await houseCollection.updateOne(query, updatedHouse, options);
  res.send(result);
});
app.get("/list-of-houses/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email };
  const result = await houseCollection.find(query).toArray();
  res.send(result);
});
app.delete("/house/delete/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await houseCollection.deleteOne(query);
  res.send(result);
});

app.get("/houses-count", async (req, res) => {
  const count = await houseCollection.estimatedDocumentCount();
  res.send({ count });
});
app.get("/house-details/:id", async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await houseCollection.findOne(query);
  res.send(result);
});
app.get("/all-houses", async (req, res) => {
  const page = parseInt(req.query.page);
  const size = parseInt(req.query.size);
  const houses = await houseCollection
    .find()
    .skip(page * size)
    .limit(size)
    .toArray();
  res.send(houses);
});
app.post("/add-booking", async (req, res) => {
  const data = req.body;
  const result = await bookingCollection.insertOne(data);

  res.send(result);
});
app.get("/my-bookings/:email", async (req, res) => {
  const email = req.params.email;
  const query = { email };
  const result = await bookingCollection.find(query).toArray();
  res.send(result);
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("House Hunter Server is running");
});

app.listen(port, () => {
  console.log(`Server running in the port: ${port}`);
});
