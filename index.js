const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const port = process.env.port || 5000;

//MiddleWare
app.use(express.json());
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
    res.send(result);
  }
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
