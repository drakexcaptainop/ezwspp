const { MongoClient, ServerApiVersion, Db,  ObjectId } = require('mongodb');
const uri = "";



class DB{
    /**
     * @type {MongoClient}
     */
    client
    /**
     * @type {Db}
     */
    db

    collections = {
        USERS: 'users',
        MESSAGES: 'messages'
    }
    constructor(){
        /** type { MongoClient } */
        this.client  = new MongoClient(uri, {
            serverApi: {
                version: ServerApiVersion.v1,
                strict: false,
                deprecationErrors: true,
            }
        });

        this.db = null
        this.connected = false
          
    }


    async add_user( name ){
        let users = this.db.collection(this.collections.USERS)
        let res = await users.insertOne( { 
            name: name,
            recieved: 0
         } )
        return res
    }

    async increase_recieved(userId){
        userId = new ObjectId(userId)
        let users = this.db.collection(this.collections.USERS)
        return await users.updateOne(
            { _id: userId }, 
            { $inc: { recieved: 1 } } 
        );
    }

    async get_num_recieved(userId){
        userId = new ObjectId(userId)
        let users = this.db.collection(this.collections.USERS)
        let user = await users.findOne( { _id: userId } )
        console.log(`Get num recieved uid: ${userId}, Found user: ${user.recieved}`)
        return user.recieved
    }

    async reset_num_recieved(userId){
        userId = new ObjectId(userId)
        let users = this.db.collection(this.collections.USERS)
        return await users.updateOne( { _id: userId }, {$set: { recieved: 0 }} )
    }

    async insert_message(senderId, recieverId, content, date){
        senderId = new ObjectId(senderId)
        recieverId = new ObjectId( recieverId )
        let messages = this.db.collection(this.collections.MESSAGES)
        return await messages.insertOne( {
            senderId, recieverId, content, date
        } )
    }

    async get_messages(recieverId){
        recieverId = new ObjectId(recieverId)
        let messages = this.db.collection(this.collections.MESSAGES)
        return await messages.find( { recieverId: recieverId } ).toArray()
    }


    async get_users( excempt ){
        excempt = new ObjectId(excempt)
        let users = this.db.collection(this.collections.USERS )
        let rawUsers = await users.find( { _id: {$ne: excempt} } ).toArray()
        return rawUsers
    }

    async get_user( name ){
        let users = this.db.collection(this.collections.USERS )
        let user = await users.findOne( {name} )
        return user?._id
    }

    async connect(){
        if(this.connected) return 1
        try {
            await this.client.connect();
            this.db = this.client.db("db");
            this.connected = true
            return 1
          } catch (e) {
            return e
          }
    }
    async close(){
        return await this.client.close()
    }
}


module.exports = DB