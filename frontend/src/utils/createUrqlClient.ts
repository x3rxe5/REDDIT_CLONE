import { dedupExchange, fetchExchange, stringifyVariables } from "urql";
import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import { betterUpdateQuery } from "./betterUpdateQuery";
import { LoginMutation, LogoutMutation, MeDocument, MeQuery, RegisterMutation } from '../generated/graphql';
import { pipe,tap } from "wonka";
import { Exchange } from "urql";
import Router from "next/router";

// error Exchange -> 
const errorExchange:Exchange = ({forward}) => ops$ => {  
  return pipe(
    forward(ops$),
    tap(({error}) => {
      if(error.message.includes("Not Authenticated")){        
        Router.replace("/login");
      }
    })
  )
}

// Cursor Pagination
const cursorPagination = (): Resolver => {
  return (_parent, fieldArgs, cache, info) => {
    const { parentKey: entityKey, fieldName } = info;    
    const allFields = cache.inspectFields(entityKey);      
    const fieldInfos = allFields.filter((info) => info.fieldName === fieldName);
    const size = fieldInfos.length;
    if (size === 0) {
      return undefined;
    }

    //info partial

    const isItInCache = cache.resolve(
      cache.resolve(entityKey,fieldName,fieldArgs) as string,
      "posts"
    );
    
    info.partial = !isItInCache;
    
    let hasMore = true;
    const results:string[] = [];
    fieldInfos.forEach((fi) => {      
      const key = cache.resolve(entityKey,fi.fieldName,fi.arguments) as string;
      const data = cache.resolve(key,"posts") as string[];
      const _hasMore = cache.resolve(key,"hasMore");
      console.log("This is hasMore -> ",hasMore);
      if(!_hasMore){
        hasMore = _hasMore as boolean;
      }
      results.push(...data);
    })

    // final and return the results;
    return {
      __typename:"PaginatedPosts",
      hasMore,
      posts:results
    };
  }
};

// URQL Client
const createUrqlClient = (ssrExchange:any) => ({
  url:"http://localhost:4000/graphql",
  fetchOptions:{
    credentials:"include" as const,
  },
  exchanges:[dedupExchange,cacheExchange({
    keys:{
      PaginatedPosts: () => null
    },
    resolvers:{
      Query:{
        posts:cursorPagination(),
      }
    },
    updates:{
      Mutation:{
        login:(_result,args,cache,info) => {
          betterUpdateQuery<LoginMutation,MeQuery>(
            cache,
            {query:MeDocument},
            _result,
            (result,query) => {
              if(result.login.errors){
                return query;                
              }else{
                return {
                  me:result.login.user,
                }
              }
            }
          );
        },

        register:(_result,args,cache,info) => {
          betterUpdateQuery<RegisterMutation,MeQuery>(
            cache,
            {query:MeDocument},
            _result,
            (result,query) => {
              if(result.register.errors){
                return query;                
              }else{
                return {
                  me:result.register.user,
                }
              }
            }
          );
        },

        logout:(_result,args,cache,info) => {
          betterUpdateQuery<LogoutMutation,MeQuery>(
            cache,
            {query:MeDocument},
            _result,
            () => ({ me:null })
          )
        }
        
      }
    }
  }),
  // errorExchange,
  ssrExchange,
  fetchExchange],
})

export default createUrqlClient;