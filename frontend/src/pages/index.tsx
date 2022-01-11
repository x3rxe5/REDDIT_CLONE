import React from "react";
import { NavBar } from "../components/Navbar";
import { withUrqlClient } from "next-urql";
import createUrqlClient  from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";

interface indexProps{}



const index:React.FC<indexProps> = () => {
  const [{data}] = usePostsQuery();
  // const [_,res] = useHelloQuery();
  return(
    <>
      <NavBar />
      <h1>Hello World</h1>
      {!data ? <div>loading ... </div> : data.posts.map(el => {    
          return <div key={el.id}>{el.title}</div>
        })
      }
    </>
  )
}

export default withUrqlClient(createUrqlClient,{ ssr:true })(index);
