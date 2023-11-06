const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json())
app.use(cors())



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.aw2xu1p.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const blogsCollection = client.db("blogs").collection("blog")

        app.post('/blogs',async(req,res)=>{
            const blog = req.body;
            const result = await blogsCollection.insertOne(blog);
            res.send(result);
        })

        app.get('/blogs',async(req,res)=>{
            const result = await blogsCollection.find(req.body).toArray()
            res.send(result)
        })

        app.get('/blogs',async(req,res)=>{
            let sortObj = {};
            const sortField = req.query.sortField
            const sortOrder = req.query.sortOrder
            if(sortField && sortOrder){
                sortObj[sortField] = sortOrder
            }
            const result = await blogsCollection.sort(sortObj).toArray()
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