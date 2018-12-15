var SuperHero   = require ("./models/superHero"),
	Comments    = require ("./models/comments"),
	mongoose    = require ("mongoose") ;

var super_array = [
					{
						name: "Spiderman",
						image: "http://media.comicbook.com/2018/04/spider-man-1099203.jpeg",
						description : "Spider Man PS4 4K"
					}
				  ] ;

var comments_array = [
						{
							text: "This Spider Man Game is so Lit !",
							author: "Danny"
						}
					 ] ;					 

//seed the database
function seedDB (){
	
	SuperHero.remove ({}, function (err){
	
		if (err)
			console.log (err) ;
		else{		
			 console.log ("Removed Every Super Hero :'( \n") ;
			 /* super_array.forEach (function (super_item) {
				
					SuperHero.create (super_item, function (err, superHero) {
									  
						if (err)
							console.log (err) ;
						else {											
							  console.log ("Seeded a new Super Hero :D\n") ;
							  //comments_array.forEach (function (comment){
									
									Comments.create ({text:"This game is so lit!", 
													  author: "Danny"}, function (err, comm){
										
											if (err)
												console.log ("Failed to create a comment\n") ;
											else {
													console.log ("Created a comment!\n") ;
													console.log (comm) ;
													//console.log (superHero) ;
													superHero.comments.push (comm) ;
													superHero.save () ;							
													console.log (superHero) ;
											}
									}) ;
							   //}) ;							
						}
					}) ;
			}) ; */
		}
	}) ;
}

module.exports= seedDB ;



										
				  