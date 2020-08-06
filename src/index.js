import express from 'express'
import server from './server'
import mongoose from 'mongoose'
import dotenv from "dotenv"
dotenv.config()



//เรียกค่าที่เก็บไว้ในไฟล .env มาใช้งาน
const { DB_USER, DB_PASSWORD, DB_NAME, PORT } = process.env
console.log({PORT})
//---------------------------------------------------------


const createServer = async () => {
  try{
    await mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@graphql-basic-jndj6.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`,{ useUnifiedTopology: true, useNewUrlParser: true  })
  
          const app = express()
          server.applyMiddleware({ app });
          app.listen({ port: PORT }, () =>
            console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
          )
  } catch (error) {
    console.log('this error ' + error)
  }
}

createServer()

