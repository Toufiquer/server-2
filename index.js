const express = require("express");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
app.use(cors());
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

app.get("/", (req, res) => {
  res.send({ test: "Hello World!" });
});

const uri = `mongodb+srv://${process.env.DB_USER_NAME}:${process.env.DB_USER_PASSWORD}@cluster0.qnam06a.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    client.connect();
    const usersCollection = client.db("usersCollection").collection("users");

    app.post("/addUser", async (req, res) => {
      const { name, group } = req.body;
      const result = await usersCollection.insertOne({ name, group });
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const currentPage = req.query.currentPage || 1;
      const userPerPage = req.query.userPerPage || 6;
      const lastUser = req.query.lastUser || false;
      const totalUsers = req.query.totalUsers || false;
      const query = {};
      let result;
      const cursor = usersCollection.find(query);
      const count = await cursor.count();
      if (lastUser) {
        result = await cursor
          .skip(count - 4)
          .limit(4)
          .toArray();
      } else if (totalUsers) {
        result = count;
      } else {
        result = await cursor
          .skip(+currentPage * +userPerPage)
          .limit(+userPerPage)
          .toArray();
      }
      res.send({ result });
    });

    app.get("/user", async (req, res) => {
      const id = req.query.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.findOne(query);
      res.send({ result });
    });

    // app.get("/totalUsers", async (req, res) => {
    //   const query = {};

    //   res.send({ result });
    // });

    console.log("mongo is connected");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);
app.listen(port, () => {
  console.log("Server is running on port ", port);
});
