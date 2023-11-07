const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json())
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}));
app.use(cookieParser())

const verifyToken = (req, res, next) => {
    const token = req?.cookies?.token;
    console.log('token here', token);
    if (!token) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ message: 'bad unauthorized access' })
        }
        else {
            req.decoded = decoded;
            next()
        }
    })
}


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aw2xu1p.mongodb.net/?retryWrites=true&w=majority`;


const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // await client.connect();

        const blogsCollection = client.db("blogs").collection("blog")
        const newsletterCollection = client.db("newsletters").collection("newsletter")
        const categoryCollection = client.db("categories").collection("category")
        const wishlistCollection = client.db("wishlists").collection("wishlist")
        const commentsCollection = client.db("comments").collection("comment")
        // jwt authorization

        app.post('/jwt', async (req, res) => {
            const user = req.body;
            console.log(user);
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    secure: false,
                    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict"
                })
                .send(token)
        })

        // for blogs

        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            const result = await blogsCollection.insertOne(blog);
            res.send(result);
        })



        // app.get('/blogs',async(req,res)=>{
        //     const result = await blogsCollection.find(req.body).toArray()
        //     res.send(result)
        // })

        app.get('/blogs/sort', async (req, res) => {
            const result = await blogsCollection.find().sort({ currentDate: -1, currentTime: -1 }).toArray()
            res.send(result)
        })

        app.get('/blogs', async (req, res) => {
            let queryObj = {};
            const category = req.query.category
            if (category) {
                queryObj.category = category
            }
            const result = await blogsCollection.find(queryObj).toArray()
            res.send(result)
        })

        // for blog details

        app.get('/blogDetails/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await blogsCollection.findOne(query)
            res.send(result)
        })

        // blog updates

        app.get('/updates/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await blogsCollection.findOne(query);
            res.send(result);
        })

        app.put('/updates/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updatedCards = req.body;
            const cards = {
                $set: {
                    img: updatedCards.img,
                    title: updatedCards.title,
                    category: updatedCards.category,
                    shortDescription: updatedCards.shortDescription,
                    longDescription: updatedCards.longDescription,
                }
            }
            const result = await blogsCollection.updateOne(filter, cards, options);
            res.send(result);
        })

        // blog category

        app.post('/blogs/categories', async (req, res) => {
            const result = await categoryCollection.insertOne(req.body)
            res.send(result)
        })

        app.get('/blogs/categories', async (req, res) => {
            const result = await categoryCollection.find().toArray()
            res.send(result)
        })

        // for newsletter

        app.post('/newsletter', async (req, res) => {
            const newsletter = req.body;
            const result = await newsletterCollection.insertOne(newsletter)
            res.send(result)
        })

        // for wishlist

        app.post('/wishlist', async (req, res) => {
            const wishlist = req.body;
            const result = await wishlistCollection.insertOne(wishlist)
            res.send(result)
        })

        app.get('/wishlist', verifyToken, async (req, res) => {
            const email = req.query.email
            if (!email) {
                res.send([])
            }
            // check valid user
            const decodedEmail = req.decoded.email
            console.log(decodedEmail);
            if (email !== decodedEmail) {
                res.status(403).send({ message: 'Forbidden Access' })
            }
            const query = { email: email }
            const result = await wishlistCollection.find(query).toArray()
            res.send(result)
        })
        app.delete('/wishlist/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await wishlistCollection.deleteOne(query);
            res.send(result);
        })

        // for comments

        app.post('/comments', async (req, res) => {
            const result = await commentsCollection.insertOne(req.body)
            res.send(result)
        })

        app.get('/comments', async (req, res) => {
            const result = await commentsCollection.find().toArray()
            res.send(result)
        })

        app.get('/comments/:id',async(req,res)=>{
            const id = req.params.id;
            console.log(id);
            const query = {blogsId: id}
            const result = await commentsCollection.find(query).toArray()
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('server is running properly')
})

app.listen(port, (req, res) => {
    console.log(`server is running on port : ${port}`);
})