var mongoose=require ("mongoose") ;

var superSchema= new mongoose.Schema({
	name: String,
	image: String,
	description: String,
	comments: [
				{
					type: mongoose.Schema.Types.ObjectId,
					ref:  "Comments"
				}
			  ],
	author: {
				id: {
						type: mongoose.Schema.Types.ObjectId,
						ref: "User"
				},
				username: String
	}
}) ;
module.exports = mongoose.model ("SuperHero", superSchema) ;