
const express = require('express')
const path = require('path')
const app = express()
const DB = require( './db' )
const print = console.log

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use( express.static( __dirname  ) )

var IS_LOCKED = false

const db = new DB()
app.get('/', async (req, res) => {
    var data = await db.connect()
    res.sendFile( path.join( __dirname, 'main.html' ) )
})

app.post('/submit', async (req, res) => {
    let user = await db.get_user( req.body.name )
    if(user) {
        res.send({id: user})
        return
    }
    user = await db.add_user( req.body.name )
    res.send({ id: user.insertedId })
})

app.get('/logged', (req, res) => {
    res.sendFile( path.join(__dirname, 'logged.html' ))
})

app.post('/send', async (req, res) => {
    let {senderId, recieverId, content} = req.body
    let date = new Date()
    await db.insert_message( senderId, recieverId, content, date )
    await db.increase_recieved( senderId )
    await db.increase_recieved( recieverId )
    await db.insert_message( senderId, senderId, content, date )
})


app.get('/events', async (req, res) => {
    let userId = (req.query.userId)
    res.setHeader('Content-Type', 'text/event-stream').setHeader('Cache-Control', 'no-cache').setHeader('Connection', 'keep-alive');

    const sendEvent = async (  ) => {
        IS_LOCKED = true
        let users = await db.get_users( userId )
        let num_recieved = await db.get_num_recieved( userId )
        let messages = null
        if(num_recieved > 0){
            print("Getting messages")
            messages = await db.get_messages( userId )
            await db.reset_num_recieved( userId )
        }
        IS_LOCKED = false
        res.write(`data: ${JSON.stringify({ users, messages })}\n\n`);
    };
    const interval = setInterval(async () => {
        await sendEvent();
    }, 1000);

    req.on('close', () => {
        clearInterval(interval);
        console.log('SSE connection closed');
    });
})

app.listen( 3002, () => {  } )

