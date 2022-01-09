import React from "react";
import { useQuery } from "urql";
import { useHelloQuery } from "../generated/graphql";

interface indexProps{}



const index:React.FC<indexProps> = () => {
  // const [_,res] = useHelloQuery();

  return(
    <>
      <h1>Hello World</h1>
      <a href="/register">Register</a>
    </>
  )
}

export default index;
