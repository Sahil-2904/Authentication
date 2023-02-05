// Requiring the modules
require('dotenv').config();
const express = require('express');
const bodyParser =  require('body-parser');
const ejs = require('ejs');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require('mongoose-findorcreate');

// const encrypt = require('mongoose-encryption');
// const md5 = require('md5');
// const bcrypt = require('bcrypt');
// const saltRounds = 10;


// Creating the app constant for using the express functions
const app = express();

// console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(session({
  secret: "This is secret",
  resave: false,
  saveUninitialized: false
}));


app.use(passport.initialize());
app.use(passport.session());

// Connect to the Database
mongoose.set('strictQuery', true);
mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser:true});
// mongoose.set('useCreateIndex',true);

// Creating the Users Schema
const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId:String,
  secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields: ["password"]});

// Create the user
const User = new mongoose.model("User",userSchema);
passport.use(User.createStrategy());

// Serializing and Deserializing User
// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.serializeUser(function(user,done){
  done(null,user.id);
});
passport.deserializeUser(function(id,done){
  User.findById(id,function(err,user){
    done(err,user);
  });
});

// Authenticate using Google
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));


// Creating the get route for root
app.get("/",function(req,res){
  res.render("home");
});

// Route for authenticating using google
app.get("/auth/google",
  passport.authenticate("google",{scope: ["profile"]})
);

// Route for redirecting to login or main page as per authentication
app.get("/auth/google/secrets",
  passport.authenticate("google", {failureRedirect: "/login"}),
  function(req,res){
    res.redirect("/secrets");
  }
);

// Creating the get route for login
app.get("/login",function(req,res){
  res.render("login");
});

// Creating the get route for register
app.get("/register",function(req,res){
  res.render("register");
});

// Submit route for submitting secret
app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else{
    res.redirect("/login");
  }
});

// Taking secrets of users and render it on main page
app.post("/submit",function(req,res){
  const submittedSecret = req.body.secret;
  // console.log(req.user.id);
  User.findById(req.user.id,function(err,foundUser){
    if(err){
      console.log(err);
    }
    else{
      if(foundUser){
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  })
});

// Logout Route
app.get("/logout",function(req,res){
  req.logout(function(err){
    if(err){
      console.log(err);
    }
  });
  res.redirect("/");
})


// Rendering the main page
app.get("/secrets",function(req,res){
  // if(req.isAuthenticated()){
  //   res.render("secrets");
  // }else{
  //   res.redirect("/login");
  // }
  User.find({"secret":{$ne: null}}, function(err,foundUsers){
    if(err){
      console.log(err);
    }
    else{
      if(foundUsers){
        res.render("secrets",{usersWithSecrets: foundUsers});
      }
    }
  })
});

// Creating the post route for register
app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
      if(err){
        console.log(err);
        res.redirect("/register");
      }else{
        passport.authenticate("local")(req,res,function(){
          res.redirect("/secrets");
        })
      }
    })
});

// Creating the post route for login
app.post("/login",function(req,res){
  const user = new User({
    username: req.body.username,
    password: req.body.password
  });
  req.login(user, function(err){
    if(err){
      console.log(err);
    }
    else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      })
    }
  })
});

// listening port
app.listen(3000,function(){
  console.log("Server started at port 3000");
});
