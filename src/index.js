import express from 'express'
import server from './server'
import mongoose from 'mongoose'
import dotenv from "dotenv"
import passport from 'passport'
import { facebookPassportConfig } from './utils/passport'
import { facebookAuth } from './utils/socilProvidersAuth'
dotenv.config()



//เรียกค่าที่เก็บไว้ในไฟล .env มาใช้งาน
const { DB_USER, DB_PASSWORD, DB_NAME, PORT } = process.env
facebookPassportConfig()
console.log({PORT})
//---------------------------------------------------------


const createServer = async () => {
  try{
    await mongoose.connect(`mongodb+srv://${DB_USER}:${DB_PASSWORD}@graphql-basic-jndj6.mongodb.net/${DB_NAME}?retryWrites=true&w=majority`,{ useUnifiedTopology: true, useNewUrlParser: true  })
  
          const app = express()

          app.get('/auth/facebook', passport.authenticate('facebook'))

          app.get(
            '/auth/facebook/callback',
            passport.authenticate('facebook', {
              session: false,
              failureRedirect: 'http://localhost:3000/register/signIn',
            }),
            facebookAuth
          )

          server.applyMiddleware({ app });
          app.listen({ port: PORT }, () =>
            console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath+'ql'}`)
          )
  } catch (error) {
    console.log('this error ' + error)
  }
}

createServer()

