import { EntityManager,Connection, IDatabaseDriver } from "@mikro-orm/core"
import { Request,Response } from "express"
import { Session } from "inspector";

export type MyContext = {
  em: EntityManager<any> & EntityManager<IDatabaseDriver<Connection>>;
  req: Request & { session:Session | undefined }//& { session?: Express.Session | undefined , userId?:Express.Session };
  res: Response;
}