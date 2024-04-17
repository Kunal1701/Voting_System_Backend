const express = require('express');
require('dotenv').config();
const userRoutes = require('./routes/userRoutes')
const candidateRoutes = require('./routes/candidateRoutes')
const app = express();
const db = require('./db')
app.use(express.json());

app.use("/user",userRoutes);
app.use("/candidates",candidateRoutes);

const port = process.env.PORT || 3000;

app.listen(port,()=>{
    console.log("Running on",port);
})

