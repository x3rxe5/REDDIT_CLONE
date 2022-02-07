import { MyContext } from "src/types";
import { MiddlewareFn, NextFn } from "type-graphql";

export const isAuth:MiddlewareFn<MyContext> = ({context},next:NextFn) => {  
  if(!context.req.session.userId){
    throw new Error("You are not authenticated");
  }
  return next();
}