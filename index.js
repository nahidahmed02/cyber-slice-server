const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fh4wlpf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run() {
    try {
        await client.connect();
        const partsCollection = client.db('cyber_slice').collection('parts');
        const reviewCollection = client.db('cyber_slice').collection('reviews');
        const orderCollection = client.db('cyber_slice').collection('order');
        const profileCollection = client.db('cyber_slice').collection('profile');


        // ------------------ PARTS -------------------

        // to get all parts
        app.get('/parts', async (req, res) => {
            const parts = await partsCollection.find().toArray();
            res.send(parts);
        });

        // to get particular part
        app.get('/parts/:id', async (req, res) => {
            const { id } = req.params;
            const query = { _id: ObjectId(id) };
            const part = await partsCollection.findOne(query);
            res.send(part);
        });

        // ----------------------------------------------



        // ------------------ REVIEWS --------------------

        // to get all the reviews
        app.get('/reviews', async (req, res) => {
            const reviews = await reviewCollection.find().toArray();
            res.send(reviews);
        });

        // to post a review
        app.post('/review', async (req, res) => {
            const review = req.body;
            const result = await reviewCollection.insertOne(review);
            res.send(result);
        });

        // ----------------------------------------------



        // ------------------ ORDERS --------------------

        // to post an order
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        // ----------------------------------------------



        // ------------------ PROFILE ---------------------

        // to post a profile
        app.post('/profile', async (req, res) => {
            const profile = req.body;
            const result = await profileCollection.insertOne(profile);
            res.send(result);
        });

        // ----------------------------------------------

    }
    finally {

    }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('cyber slice server is running');
});

app.listen(port, () => {
    console.log('listening to port', port);
});