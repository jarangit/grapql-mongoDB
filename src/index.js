import express from 'express'
import server from './server'
import mongoose from 'mongoose'



const DB_USER = 'jaran'
const DB_PASSWORD = "5YnuRixGyMDnwoV0"
const DB_NAME ='ecommerce'
const PORT = 4444

const createServer = async () => {
  try{
    await mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@graphql-basic-jndj6.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`,{ useUnifiedTopology: true })
    
          const app = express()
          server.applyMiddleware({ app });
          app.listen({ port: PORT }, () =>
            console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath+'ql'}`)
          )
  } catch (error) {
    console.log(error)
  }
}

//testttttt
createServer()

