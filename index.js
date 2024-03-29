const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');



// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fh4wlpf.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (!authHeader) {
        return res.status(401).send({ message: 'Unauthorized access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden access' })
        }
        req.decoded = decoded;
        next();
    });
}

async function run() {
    try {
        await client.connect();
        const userCollection = client.db('cyber_slice').collection('user');
        const partsCollection = client.db('cyber_slice').collection('parts');
        const reviewCollection = client.db('cyber_slice').collection('reviews');
        const orderCollection = client.db('cyber_slice').collection('order');
        const profileCollection = client.db('cyber_slice').collection('profile');

        const verifyAdmin = async (req, res, next) => {
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester });
            if (requesterAccount.role === 'admin') {
                next();
            }
            else {
                res.status(403).send({ message: 'Forbidden' });
            }
        }

        // ------------------ USERS -------------------

        // to get all users
        app.get('/user', verifyJWT, verifyAdmin, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users);
        });


        // to add user to database
        app.put('/user/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            };
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET);
            res.send({ result, token });
        });


        // to give user a admin role
        app.put('/user/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const filter = { email: email };
            const updateDoc = {
                $set: { role: 'admin' },
            };
            const result = await userCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        // to remove a user from the admin role
        app.put('/admin/:email', verifyJWT, verifyAdmin, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const update = { $set: { role: 'user' } };
            const options = { returnOriginal: false };
            const result = await userCollection.findOneAndUpdate(query, update, options);
            res.send(result);
        });

        // to get admins
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin';
            res.send({ admin: isAdmin })
        });


        // ---------------------------------------------



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

        // to add a parts
        app.post('/parts', verifyJWT, verifyAdmin, async (req, res) => {
            const parts = req.body;
            const result = await partsCollection.insertOne(parts);
            res.send(result);
        });

        // to delete a parts
        app.delete('/parts/:id', verifyJWT, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await partsCollection.deleteOne(query);
            res.send(result);
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

        // to get all orders
        app.get('/order', verifyJWT, verifyAdmin, async (req, res) => {
            const orders = await orderCollection.find().toArray();
            res.send(orders);
        });

        // to get order of an individual user
        app.get('/order/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const cursor = orderCollection.find(query);
            const order = await cursor.toArray();
            res.send(order);


        });

        // to post an order
        app.post('/order', async (req, res) => {
            const order = req.body;
            const result = await orderCollection.insertOne(order);
            res.send(result);
        });

        // to delete an order
        app.delete('/order/:id', verifyJWT, async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result);
        });

        // ----------------------------------------------



        // ------------------ PROFILE ---------------------

        // to get profile of an individual user
        app.get('/profile/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const query = { email: email };
            const cursor = profileCollection.find(query);
            const profile = await cursor.toArray();
            res.send(profile);
        });

        // to post a profile
        app.post('/profile', async (req, res) => {
            const profile = req.body;
            const result = await profileCollection.insertOne(profile);
            res.send(result);
        });

        // update profile
        app.put('/profile/:email', async (req, res) => {
            const email = req.params.email;
            const updatedProfile = req.body;
            const filter = { email: email };
            const options = { upsert: true };
            const updatedDoc = {
                $set: {
                    education: updatedProfile.education,
                    location: updatedProfile.location,
                    phone: updatedProfile.phone,
                    linkedin: updatedProfile.linkedin
                }
            };
            try {
                const result = await profileCollection.updateOne(filter, updatedDoc, options);
                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send('Failed to update profile');
            }

        })

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