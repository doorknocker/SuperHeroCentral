var express        = require ("express"),
    app            = express (),
	bodyParser     = require ("body-parser") ,
	methodOverride = require ("method-override"),
	mongoose	   = require ("mongoose"),
	flash		   = require ("connect-flash"),
	passport       = require ("passport"),
	LocalStrategy  = require ("passport-local"),
	User           = require ("./models/user"),
 	SuperHero      = require ("./models/superHero"),
	Comments       = require ("./models/comments"),
	seedDB		   = require ("./seeds") ;

app.set ("view engine", "ejs") ;
app.use (express.static (__dirname + "/public")) ;
app.use (flash ()) ;
app.use (methodOverride('_method')) ;
app.use (bodyParser.urlencoded ({extended: true})) ;
//mongoose.connect ("mongodb://localhost/superDB") ;
mongoose.connect ("mongodb://harshit:Pollos@22@ds249372.mlab.com:49372/superherocentral") ;
//
//seedDB () ;
	

//Passport Config
app.use (require ("express-session")({
	secret: "say my name",
	resave: false,
	saveUninitialized: false
})) ;



app.use (passport.initialize ()) ;
app.use (passport.session ()) ;
passport.use (new LocalStrategy (User.authenticate ())) ;
passport.serializeUser (User.serializeUser ()) ;
passport.deserializeUser (User.deserializeUser ()) ;
app.use (function (req, res, next){
	res.locals.curr_user= req.user ;
	res.locals.error= req.flash ("error") ;
	res.locals.success= req.flash ("success") ;
	next () ;
}) ;


//HOME - ROUTE
app.get ("/", function (req, res) {
	
	res.render ("landing") ;
}) ;

//NEW - ROUTE
app.get ("/superheroes/new", isLoggedIn, function (req, res) {
	
	res.render ("superHeroes/addhero", {curr_user: req.user}) ;
}) ;

//SHOW - ROUTE
app.get ("/superheroes/:id", function (req, res) {
	
	SuperHero.findById (req.params.id).populate ("comments").exec (function (err, foundHero){
		
		if(err)
			console.log (err) ;
		else{
			console.log ("Hero is present in Database!") ;
			console.log (foundHero) ;		
			res.render ("superHeroes/showHero", {superHero : foundHero, curr_user: req.user}) ;
		}
	}) ;
}) ;

//INDEX - ROUTE
app.get ("/superheroes", function (req, res){
					 
	SuperHero.find ({}, function (err, super_array){
		if (err)
			console.log (err) ;
		else
			res.render("superHeroes/superheroes", {superheroes : super_array, curr_user: req.user, message: req.flash ("error")}) ;
	}) ;
}) ;

//CREATE - ROUTE
app.post ("/superheroes" , isLoggedIn, function (req, res) {
	
	var hero_name= req.body.name ;
	var hero_pic= req.body.image ;
	var hero_desc= req.body.description ;
	var newHero= { name: hero_name, image: hero_pic , description: hero_desc} ;
	
	SuperHero.create (newHero, function (err, superHero){
		
		if(err)
			console.log (err) ;
		else {
			
			superHero.author.id= req.user._id ;
			superHero.author.username= req.user.username ;
			superHero.save () ;
			console.log ("User Created a new Hero!") ;
			console.log (superHero) ;
		}
	}) ;	
	res.redirect ("/superheroes") ;
}) ;

//COMMENTS
app.get ("/superheroes/:id/comments/new", isLoggedIn, function (req, res) {
	
	SuperHero.findById (req.params.id, function (err, superHero){
		
		if (err)
			console.log (err) ;
		else
			res.render ("comments/new", {superHero : superHero, curr_user: req.user}) ;
	}) ;
}) ;

//COMMENTS - POST
app.post ("/superheroes/:id/comments" , isLoggedIn, function (req, res) {
	
	SuperHero.findById (req.params.id, function (err, superHero){
		
		if (err){
			console.log (err) ;
			res.redirect ("superHeroes/superheroes") ;
		}
		else{
			console.log ("\nHero Found. Adding comment and redirecting...\n") ;
			Comments.create (req.body.comment, function (err, comment){
				
				if (err)
					console.log (err) ;
				else{
					comment.author.id= req.user._id ;
					comment.author.username= req.user.username ;
					comment.save () ;
					superHero.comments.push (comment) ;
					superHero.save () ;
					console.log (comment) ;
					console.log (superHero) ;
					res.redirect ("/superheroes/" + superHero._id) ;
				}
			}) ;
		}
	});
}) ;
					
//AUTH ROUTES
app.get ("/register", function (req, res) {
	res.render ("register", {curr_user: req.user}) ;
}); 

app.post ("/register", function (req, res) {
	
	User.register (new User ({username : req.body.username}), req.body.password, function (err, user){
		
		if (err){
			console.log (err) ;
			req.flash ("error", err.message) ;
			return res.redirect ("/register") ;
		}
		else {
			passport.authenticate ("local")(req, res, function (){
				req.flash ("success", "Welcome to SuperHeroCENTRAL, " + req.user.username + "!") ;
				res.redirect ("/superheroes") ;
			}) ;
		}
	}) ;
}) ;

app.get ("/login", function (req, res) {	
	
	res.render ("login", {message: req.flash ("error")}) ;
}) ;

app.post ("/login", passport.authenticate ("local", 
	{
		successRedirect: "/superheroes",
		failureRedirect: "/login"
	}),
	function (req, res) { }
) ;

app.get ("/logout", function (req, res) {
	
	req.flash ("success", "Logged you out!") ;
	req.logout () ;
	res.redirect ("/superheroes") ;
}) ;

//EDIT - ROUTES
app.get ("/superheroes/:id/edit", checkOwnership, function (req, res) {
	
	SuperHero.findById (req.params.id, function (err, superHero){
		
		res.render ("superHeroes/edit", {superHero : superHero, curr_user: req.user}) ;
	}) ;
}) ;

app.put ("/superheroes/:id", checkOwnership, function (req, res){
	
	SuperHero.findByIdAndUpdate (req.params.id, req.body.hero, function (err, superHero){
		
		if (err)
			res.redirect ("/superheroes") ;
		else{
			req.flash ("success", "SuperHero Updated :)") ;
			res.redirect ("/superheroes/" + req.params.id) ;
		}
	}) ;
}) ;	

// DESTROY - ROUTES

app.delete ("/superheroes/:id", checkOwnership, function (req, res) {
	
	SuperHero.findByIdAndRemove	(req.params.id, function (err) {
		
		if (err)
			res.redirect ("/superheroes") ;
		else{
			req.flash ("success", "SuperHero Deleted! :(") ;
			res.redirect ("/superheroes") ;
		}
	});
}) ;


//COMMENTS - USER ASSOCIATION
app.get ("/superheroes/:id/comments/:comment_id/edit", checkCommentOwnership, function (req, res) {
	
		Comments.findById (req.params.comment_id, function (err, comment){
		
			if (err){
				req.flash ("error", "Could not find comment to edit!") ;
				res.redirect ("back") ;
			}
			else
				res.render ("comments/edit", {superId : req.params.id, comment: comment, curr_user: req.user}) ;
	    });
}) ;


app.put ("/superheroes/:id/comments/:comment_id", checkCommentOwnership, function (req, res) {
	
		Comments.findByIdAndUpdate (req.params.comment_id, req.body.comment, function (err, updatedComment){
			
			if (err){
				req.flash ("Could not find comment") ;
				res.redirect ("back") ;
			}
			else{
				req.flash ("success", "Comment Updated!") ;
				res.redirect ("/superheroes/" + req.params.id) ;
			}
		}) ;
}) ;

//COMMENTS - DESTROY ROUTE
app.delete ("/superheroes/:id/comments/:comment_id", checkCommentOwnership, function (req, res) {

	Comments.findByIdAndRemove (req.params.comment_id, function (err) {

		if (err){
			req.flash ("error", "Coudn't find the comment!") ;
			res.redirect ("back") ;
		}
		else{
			req.flash ("success", "Comment deleted!") ;
			res.redirect ("/superHeroes/" + req.params.id) ; 
		}
	}) ;
}) ;

function isLoggedIn (req, res, next) {
	
	if (req.isAuthenticated ()) 
		return next () ;
	req.flash ("error", "Please login first!") ;
	res.redirect ("/login") ;
}

function checkOwnership (req, res, next){
	
	if(req.isAuthenticated ()){	
		SuperHero.findById (req.params.id, function (err, superHero){
		
			if (err || !superHero){
				req.flash ("error", "Sorry, we are not able to fetch your SuperHero! :(") ;
				res.redirect ("back") ;
			}
			else{
			    if (superHero.author.id.equals (req.user._id))
					next () ;
				else{
					req.flash ("error", "You don't have permission to do that!") ;
					res.redirect ("back") ; 
				}
			}
		}) ;
	}
	else{
		req.flash ("error", "You don't have ownership of this superHero!") ;
		res.redirect ("back") ;	
	}
}

function checkCommentOwnership (req, res, next){
	
	if(req.isAuthenticated ()){	
		Comments.findById (req.params.comment_id, function (err, comment){
		
			if (err || !comment){
				req.flash ("error", "Comment not found!") ;
				res.redirect ("back") ;
			}
			else{
			    if (comment.author.id.equals (req.user._id))
					next () ;
				else
					res.redirect ("back") ; 
				
			}
		}) ;
	}
	else{
		req.flash ("error", "You don't have ownership of this comment!") ;
		res.redirect ("back") ;	
	}
}

//LISTEN
app.listen (3000, function (){

	console.log ("Server Listening !") ;
}) ;

	


