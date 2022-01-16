import React from "react";
import { withUrqlClient } from "next-urql";
import createUrqlClient  from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";
import { Link } from "@chakra-ui/react";
import NextLink from "next/link";

interface indexProps{}



const index:React.FC<indexProps> = () => {

  const [{data}] = usePostsQuery();

  return(
    <Layout>
      <NextLink href="/create-post">
        <Link>Create Post</Link>
      </NextLink>
      <br />
      {!data ? <div> ... </div> : data.posts.map(el => {    
          return <div key={el.id}>{el.title}</div>
        })
      }
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient,{ ssr:true })(index);
