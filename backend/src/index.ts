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
  
  // console.log("this is redisClient ->",redisClient);

  // Express middleware setting
  app.use(session({
    name:"qid",
    store: new RedisStore({ client: redisClient }), //{ client:redisClient }
    cookie:{
      maxAge:1000 * 60 * 60 *24 * 365 * 10, // 10 years
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
  apolloServer.applyMiddleware({
    app,
    cors: { credentials: true, origin: "https://studio.apollographql.com" },
  });


  app.listen(4000, () => {
    console.log("App is Listening on Port 4000");
  })
}

main();

