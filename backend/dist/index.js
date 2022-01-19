"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const apollo_server_express_1 = require("apollo-server-express");
const type_graphql_1 = require("type-graphql");
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const ioredis_1 = __importDefault(require("ioredis"));
const express_session_1 = __importDefault(require("express-session"));
const constant_1 = require("./constant");
const cors_1 = __importDefault(require("cors"));
const typeorm_1 = require("typeorm");
const dotenv_1 = __importDefault(require("dotenv"));
const Users_1 = require("./entities/Users");
const Post_1 = require("./entities/Post");
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: "./src/config.env" });
const main = async () => {
    const conn = await typeorm_1.createConnection({
        type: "postgres",
        database: process.env.DATABASE_NAME,
        username: process.env.DATABASE_USERNAME,
        password: process.env.DATABASE_PASSWORD,
        logging: true,
        synchronize: true,
        migrations: [path_1.default.join(__dirname, "./migrations/*")],
        entities: [
            Post_1.Post,
            Users_1.Users
        ]
    });
    conn.runMigrations();
    const app = express_1.default();
    let RedisStore = require("connect-redis")(express_session_1.default);
    let redis = new ioredis_1.default();
    app.set('trust proxy', true);
    app.use(cors_1.default({
        origin: [
            "http://localhost:3000",
            "https://studio.apollographql.com"
        ],
        credentials: true,
    }));
    app.use(express_session_1.default({
        name: constant_1.COOKIE_NAME,
        store: new RedisStore({
            client: redis,
            disableTouch: true
        }),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
            secure: constant_1.__prod__,
            sameSite: 'lax'
        },
        saveUninitialized: false,
        secret: 'keyboard cat',
        resave: false
    }));
    const apolloServer = new apollo_server_express_1.ApolloServer({
        schema: await type_graphql_1.buildSchema({
            resolvers: [
                hello_1.HelloResolver,
                post_1.PostResolver,
                user_1.UserResolver
            ],
            validate: false,
        }),
        context: ({ req, res }) => ({ req, res, redis })
    });
    await apolloServer.start();
    apolloServer.applyMiddleware({
        app,
        cors: false
    });
    app.listen(process.env.PORT, () => {
        console.log("App is Listening on Port 4000");
    });
};
main().catch(err => {
    console.log("Error Occured -> ", err);
});
//# sourceMappingURL=index.js.map