import { __prod__ } from "./constant";
import { Post } from "./entities/Post";
import { Users } from "./entities/Users";
import { MikroORM } from "@mikro-orm/core";
import path from "path";

export default {
  migrations:{
    path:path.join(__dirname,"./migrations"),
    pattern:/^[\w-]+\d+\.[tj]s$/,
  },
  entities:[Post,Users],
  user:"xerxes",
  password:"3911",
  dbName:"lireddit",
  type:"postgresql",
  debug:!__prod__
} as Parameters<typeof MikroORM.init>[0];
