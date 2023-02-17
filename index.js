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
      const lastUsers = req.query.lastUsers || false;
      const totalUsers = req.query.totalUsers || false;
      const query = {};
      let result;
      const cursor = usersCollection.find(query);
      const count = await usersCollection.estimatedDocumentCount();
      if (lastUsers) {
        result = await cursor
          .skip(count >= 4 ? count - 4 : 0)
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

    app.put("/user", async (req, res) => {
      const user = req.body;
      const options = { upsert: true };
      const filter = { _id: new ObjectId(user.body.id) };
      const updateDoc = {
        $set: {
          name: user.body.name,
          group: user.body.group,
        },
      };
      const result = await usersCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.send({ result });
    });

    app.delete("/user", async (req, res) => {
      const id = req.query.id;
      const query = { _id: new ObjectId(id) };
      let result;
      const cursor = await usersCollection.deleteOne(query);
      if (cursor.deletedCount === 1) {
        result = {
          deleteMessage: "Successfully deleted one document.",
          deletedCount: 1,
        };
      } else {
        result = {
          deleteMessage: "No documents matched the query. Deleted 0 documents.",
          deletedCount: 0,
        };
      }
      res.send({ result });
    });

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
