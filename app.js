// Requiring the modules
require('dotenv').config();
const express = require('express');
const bodyParser =  require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const encrypt = require('mongoose-encryption');


// Creating the app constant for using the express functions
const app = express();

console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

// Connect to the Database
mongoose.set('strictQuery', true);
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});

// Creating the Users Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String
});


userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields: ["password"]});

// Create the user
const User = new mongoose.model("User",userSchema);

// Creating the get route for root
app.get("/",function(req,res){
  res.render("home");
});

// Creating the get route for login
app.get("/login",function(req,res){
  res.render("login");
});

// Creating the get route for register
app.get("/register",function(req,res){
  res.render("register");
});

// Creating the post route for register
app.post("/register",function(req,res){
  const newUser = new User({
    email: req.body.username,
    password: req.body.password
  });
  newUser.save(function(err){
    if(err){
      console.log(err);
    }
    else{
      res.render("secrets");
    }
  });
});

// Creating the post route for login
app.post("/login",function(req,res){
  const username = req.body.username;
  const password = req.body.password;

  User.findOne({email:username},function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        if(foundUser.password === password){
          res.render("secrets");
        }
      }
    }
  });
});

// listening port
app.listen(3000,function(){
  console.log("Server started at port 3000");
});
