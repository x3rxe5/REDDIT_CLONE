import { cacheExchange, Resolver } from "@urql/exchange-graphcache";
import gql from "graphql-tag";
import Router from "next/router";
import { dedupExchange, Exchange, fetchExchange } from "urql";
import { pipe, tap } from "wonka";
import { LoginMutation, LogoutMutation, MeDocument, MeQuery, RegisterMutation, VoteMutationVariables } from '../generated/graphql';
import { betterUpdateQuery } from "./betterUpdateQuery";
import { isServer } from "./isServer";

// error Exchange -> 
const errorExchange: Exchange = ({ forward }) => ops$ => {
  return pipe(
    forward(ops$),
    tap(({ error }) => {
      if (error.message.includes("Not Authenticated")) {
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
      cache.resolve(entityKey, fieldName, fieldArgs) as string,
      "posts"
    );

    info.partial = !isItInCache;

    let hasMore = true;
    const results: string[] = [];
    fieldInfos.forEach((fi) => {
      const key = cache.resolve(entityKey, fi.fieldName, fi.arguments) as string;
      const data = cache.resolve(key, "posts") as string[];
      const _hasMore = cache.resolve(key, "hasMore");

      if (!_hasMore) {
        hasMore = _hasMore as boolean;
      }
      results.push(...data);
    })

    // final and return the results;
    return {
      __typename: "PaginatedPosts",
      hasMore,
      posts: results
    };
  }
};

// URQL Client
const createUrqlClient = (ssrExchange: any, ctx: any) => { 
  let cookie = "";
  if(isServer()){
    cookie = ctx.req.headers.cookie;
  }
  return ({
    url: "http://localhost:4000/graphql",
    fetchOptions: {
      credentials: "include" as const,
      headers:cookie ? {
        cookie
      } : undefined
    },
    exchanges: [dedupExchange, cacheExchange({
      keys: {
        PaginatedPosts: () => null
      },
      resolvers: {
        Query: {
          posts: cursorPagination(),
        }
      },
      updates: {
        Mutation: {
          // Test Posts       
          vote: (_result, args, cache, info) => {
            const { postId, value } = args as VoteMutationVariables;
            const data = cache.readFragment(
              gql`
              fragment _ on Post{
                id
                points
              }
            `, { id: postId } as any
            );

            if (data) {
              const newPoints = (data.points as number) + value;
              cache.writeFragment(
                gql`
                fragment __ on Post{
                  points
                }
              `, { id: postId, points: newPoints } as any
              )
            }

          },

          createPost: (_result, args, cache, info) => {
            const allFields = cache.inspectFields("Query");
            const fieldInfos = allFields.filter((info) => info.fieldName === "posts")
            fieldInfos.forEach((fi) => {
              cache.invalidate("Query", "posts", fi.arguments || {});
            })
          },

          login: (_result, args, cache, info) => {
            betterUpdateQuery<LoginMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.login.errors) {
                  return query;
                } else {
                  return {
                    me: result.login.user,
                  }
                }
              }
            );
          },

          register: (_result, args, cache, info) => {
            betterUpdateQuery<RegisterMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              (result, query) => {
                if (result.register.errors) {
                  return query;
                } else {
                  return {
                    me: result.register.user,
                  }
                }
              }
            );
          },

          logout: (_result, args, cache, info) => {
            betterUpdateQuery<LogoutMutation, MeQuery>(
              cache,
              { query: MeDocument },
              _result,
              () => ({ me: null })
            )
          }

        }
      }
    }),
      // errorExchange,
      ssrExchange,
      fetchExchange],
  })
};

export default createUrqlClient;