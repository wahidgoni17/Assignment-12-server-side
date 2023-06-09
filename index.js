const express = require("express");
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const cors = require("cors");
const port = process.env.PORT || 5050;

// middlewares
app.use(cors());
app.use(express.json());

const verifyJWT = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ error: true, message: "entry forbidden" });
    }
    req.decoded = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@wahiddatabase1.1tmbx62.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const usersCollection = client.db("campDb").collection("users");
    const classCollection = client.db("campDb").collection("classes");
    const cartCollection = client.db("campDb").collection("carts")
    const instructorCollection = client.db("campDb").collection("instructors");
    // verify admin
    const verifyAdmin = async(req, res, next) =>{
      const email = req.decoded.email
      const query = {email: email}
      const user = await usersCollection.findOne(query)
      if(user?.role !== "admin"){
        return res.status(403).send({error: true, message: "only for admin"})
      }
      next()
    }
    const verifyInstructor = async(req, res, next) =>{
      const email = req.decoded.email
      const query = {email: email}
      const user = await usersCollection.findOne(query)
      if(user?.role !== "instructor"){
        return res.status(403).send({error: true, message: "only for Instructor"})
      }
      next()
    }

    // web access token api
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "2h",
      });
      res.send({ token });
    });

    // users api
    app.get("/users", verifyJWT, verifyAdmin, async(req, res)=>{
      const result = await usersCollection.find().toArray()
      res.send(result)
    })
    app.post("/users", async(req, res)=>{
      const user = req.body
      const query = {email : user.email}
      const existingUser = await usersCollection.findOne(query)
      if(existingUser){
        return res.send({message: "user already exists"})
      }
      const result = await usersCollection.insertOne(user)
      res.send(result)
    })
    app.delete("/users/:id", verifyJWT, verifyAdmin, async(req, res) =>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await usersCollection.deleteOne(query)
      res.send(result)
    })
    // Admin api
    app.patch('/users/admin/:id', verifyJWT, verifyAdmin, async(req, res) =>{
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const updateToAdmin = {
        $set: {
          role: "admin"
        }
      }
      const result = await usersCollection.updateOne(filter, updateToAdmin)
      res.send(result)
    })
    app.get('/users/admin/:email', verifyJWT, async(req,res)=>{
      const email = req.params.email
      if(req.decoded.email !== email){
        res.send({admin: false})
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { admin: user?.role === "admin" };
      res.send(result);
    })

    // instructor api
    app.patch('/users/instructor/:id', verifyJWT, verifyAdmin, async(req, res) =>{
      const id = req.params.id
      const filter = {_id: new ObjectId(id)}
      const updateToInstructor = {
        $set: {
          role: "instructor"
        }
      }
      const result = await usersCollection.updateOne(filter, updateToInstructor)
      res.send(result)
    })

    app.get('/users/instructor/:email', verifyJWT, async(req,res)=>{
      const email = req.params.email
      if(req.decoded.email !== email){
        res.send({instructor: false})
      }
      const query = { email: email };
      const user = await usersCollection.findOne(query);
      const result = { instructor: user?.role === "instructor" };
      res.send(result);
    })

    //classes api
    app.get("/class", async(req, res) =>{
      const result = await classCollection.find().toArray()
      res.send(result)
    })
    // carts api
    app.post("/carts", async(req, res) =>{
      const item = req.body
      const result = await cartCollection.insertOne(item)
      res.send(result)
    })

    //instructors api
    app.get("/instructors", async(req, res) =>{
      const result = await instructorCollection.find().toArray()
      res.send(result)
    })

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
  res.send("Fluentia is talking");
});

app.listen(port, () => {
  console.log(`Fluentia server is talking on ${port}`);
});
