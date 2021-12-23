const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcrypt');
const axios = require('axios').default;
const app = express();

const port = process.env.PORT || 3000;

const myDataBase = "web2-taak";




const uri = "mongodb+srv://admin:1234@cluster0.fgewj.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  //const collection = client.db("web2-taak").collection("best-planet");
  // perform actions on the collection object
 
});

app.use(cors())
    .use(morgan("dev"))
    .use(express.json()
    .use(express.static('public'))
);

//get top planets
app.get('/planets', async (req,res) => {

    try{
        //connect to the db
        await client.connect();

        const db = client.db(myDataBase).collection('planets');
        const bpl = await db.find({}).toArray();

        //Send back the data with the response
        res.status(200).send(bpl);
    }catch(error){
        console.log(error)
        res.status(500).send({
            error: 'Something went wrong!',
            value: error
        });
    }finally {
        await client.close();
    }
});

//put planets votes
app.put('/planets/:id', async (req,res) => {
    

    try{
         //connect to the db
        await client.connect();

         //retrieve the planets collection data
        const colli = client.db('web2-taak').collection('planets');
         
        
         // Create the new planet object
        let newChallenge = {
          
            votes: req.body.votes,
            
        }
        
         // Insert into the database
        let updateResult = await colli.updateOne({_id: ObjectId(req.params.id)}, 
        {$set: newChallenge});

         //Send back successmessage
        res.status(201).json(updateResult);
        return;
    }catch(error){
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    }finally {
        await client.close();
    }
});

                /**************************COMMENTS******************************/


//get comments
app.get('/comments', async (req,res) => {

    try{
        //connect to the db
        await client.connect();

        //connect to comment collection data
        const db = client.db(myDataBase).collection('comments');
        const com = await db.find({}).toArray();

        //Send back the data with the response
        res.status(200).send(com);
    }catch(error){
        console.log(error)
        res.status(500).send({
            error: 'Something went wrong!',
            value: error
        });
    }finally {
        await client.close();
    }
});


//post comments
app.post('/comments', async (req, res) => {

    try{
        //connect to the db
        await client.connect();

        //retrieve the comments collection data
        const colli = client.db(myDataBase).collection('comments');
        
        // add the new comment 
        let newComment = {
            userId: req.body.userId,
            comment: req.body.comment,
            likes: req.body.likes,
            dislikes: req.body.dislikes
        }
        
        // Insert into the database
        let insertResult = await colli.insertOne(newComment);

        //Send back successmessage
        res.status(201).send(`comment succesfully saved with id `);
        return;
    }catch(error){
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    }finally {
        await client.close();
    }
});

//Update COMMENTS
app.put('/comments/:id', async (req,res) => {
    
    // Check for id in url
    if(!req.params.id){
        res.status(400).send({
            error: 'Bad Request',
            value: 'Missing id in url'
        });
        return;
    }

    try{
         //connect to the db
        await client.connect();

         //retrieve the comments collection data
        const colli = client.db('web2-taak').collection('comments');

         // Validation for comments
        const comm = await colli.findOne({_id: ObjectId(req.params.id)});
        if(!comm){
            res.status(400).send({
                error: 'Bad Request',
                value: `Challenge does not exist with id ${req.params.id}`
            });
            return;
        } 
         // Create the new comments object
        let newChallenge = {
            
            comment: req.body.comment,
            likes: req.body.likes,
            dislikes: req.body.dislikes
        }

        // Insert into the database
        let updateResult = await colli.updateOne({_id: ObjectId(req.params.id)}, 
        {$set: newChallenge});

         //Send back successmessage
        res.status(201).json(updateResult);
        return;
    }catch(error){
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    }finally {
        await client.close();
    }
});


//DELETE COMMENTS
app.delete('/comments/:id', async (req,res) => {
 
    try{
         //connect to the db
        await client.connect();

         //retrieve the comments collection data
        const colli = client.db('web2-taak').collection('comments');

         // Validation for double 
        let result = await colli.deleteOne({_id: ObjectId(req.params.id)});
         //Send back successmessage
        res.status(201).json(result);
        return;
    }catch(error){
        console.log(error);
        res.status(500).send({
            error: 'Something went wrong',
            value: error
        });
    }finally {
        await client.close();
    }
});


/***********************************LOGIN / REGISTER*******************************************/
//Add user
app.post('/register', async (req, res) => {
    await client.connect();
    const db = client.db(myDataBase);
    const user = {
        ...req.body
    }
    db.collection('login-data').find({
        email: user.email
    }).toArray().then(found => {
        console.log(found)

        if (found.length > 0) {

            res.json({
                message: 'email already used'
            })
        } else {
            bcrypt.hash(user.password, 7, (err, hashedPassword) => {
                user.password = hashedPassword

                db.collection('login-data').insertOne(user, (err, doc) => {
                    res.json({
                        message: 'user inserted'
                    })
                })

            })
        }
    })

})

//login
app.post('/login', async (req, res) => {
    const user = { ...req.body }
    await client.connect()
    const db = client.db(myDataBase);
    db.collection('login-data').findOne({ email: user.email })
        .then(found => {
            if (found) {
                bcrypt.compare(user.password, 
                    found.password, (err, match) => {
                    if (match) {
                        res.json({
                            message: {
                                id: found._id,
                                username: found.email
                            }
                        })
                    } else {
                        res.json({
                            message: 'wrong '
                        })
                    }
                })
            }
            else {
                res.json({
                    message: 'user  not exist'
                })
            }
        })
})



app.listen(port, () => {
    console.log(`listening to port ${port}`)

})