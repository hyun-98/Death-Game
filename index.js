const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Death Game Server Running");
});

app.listen(3000, () => {
  console.log("Server running");
});