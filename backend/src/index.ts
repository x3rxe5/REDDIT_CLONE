import 'reflect-metadata';
import { MikroORM } from "@mikro-orm/core";
import microConfig from "./mikro-orm.config"
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { buildSchema }  from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from './resolvers/user';
import { createClient } from "redis";
import session from "express-session";
import { __prod__ } from './constant';
import { MyContext } from './types';
import cors from "cors";


// global module configuration
// declare module 'express-session' {
//   interface SessionData {
//     userId: Users;
//   }
// }

const main = async () => {
  const orm = await MikroORM.init(microConfig);
  await orm.getMigrator().up();

  // Express server configuration
  const app = express();

  // redis client and store
  let RedisStore = require("connect-redis")(session);
  let redisClient = createClient({ 
    legacyMode: true
  });
  await redisClient.connect();

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

  // console.log("this is redisClient ->",redisClient);
  // Express middleware setting
  
  app.use(session({
    name:"qid",
    store: new RedisStore({ 
      client: redisClient,
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
    context:({req,res}):MyContext => ({ em: orm.em ,req ,res })
  });

  await apolloServer.start();

  // const corsOptions = {
  //   origin: "http://localhost:3000" ,
  //   credentials: true
  // }

  apolloServer.applyMiddleware({
    app,
    cors:false
  });

  app.listen(4000, () => {
    console.log("App is Listening on Port 4000");
  })
}

main().catch(err => {
  console.log("Error Occured -> ",err);
});

