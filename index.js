const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const port = process.env.PORT || 5050;

// middlewares
app.use(cors());
app.use(express.json());



app.get("/", (req, res) => {
  res.send("Fluentia is talking");
});

app.listen(port, () => {
  console.log(`Fluentia server is talking on ${port}`);
});
