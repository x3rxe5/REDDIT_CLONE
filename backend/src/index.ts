import 'reflect-metadata';
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema }  from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from './resolvers/user';
// import { createClient } from "ioredis";
import Redis from "ioredis";
import session from "express-session";
import { COOKIE_NAME, __prod__ } from './constant';
import { MyContext } from './types';
import cors from "cors";
import { createConnection } from "typeorm";
import dotenv from "dotenv";
import { Users } from './entities/Users';
import { Post } from './entities/Post';



// environment variables
dotenv.config({path:"./src/config.env"});
// global module configuration
// declare module 'express-session' {
//   interface SessionData {
//     userId: Users;
//   }
// }

const main = async () => {
  
  // typeorm configuration

  await createConnection({
    type:"postgres",
    database:process.env.DATABASE_NAME,
    username:process.env.DATABASE_USERNAME,
    password:process.env.DATABASE_PASSWORD,
    logging:true,
    synchronize:true,
    entities:[
      Post,
      Users
    ]
  });

  

  // Express server configuration
  const app = express();

  // redis client and store
  let RedisStore = require("connect-redis")(session);
  let redis = new Redis(/*{ legacyMode: true}*/);
  //await redis.connect();

  // Proxy for Cookie settings
  app.set('trust proxy', true);
  // cors settings

  app.use(cors({
    origin:[
      "http://localhost:3000",
      "https://studio.apollographql.com"
    ],
    credentials:true,
  }))


  
  app.use(session({
    name:COOKIE_NAME,
    store: new RedisStore({ 
      client: redis,
      disableTouch:true 
    }),
    cookie:{
      maxAge: 1000 * 60 * 60 *24 * 365 * 10, // 10 years
      httpOnly:true,
      secure:__prod__,
      sameSite:'lax'
    },
    saveUninitialized:false,
    secret:'keyboard cat',
    resave:false
  }));
  
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers:[
        HelloResolver,
        PostResolver,
        UserResolver
      ],
      validate:false,
    }),
    context:({req,res}):MyContext => ({ req ,res,redis })
  });

  await apolloServer.start();

  apolloServer.applyMiddleware({
    app,
    cors:false
  });

  app.listen(process.env.PORT, () => {
    console.log("App is Listening on Port 4000");
  })
}

main().catch(err => {
  console.log("Error Occured -> ",err);
});

