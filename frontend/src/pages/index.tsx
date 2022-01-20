import React from "react";
import { withUrqlClient } from "next-urql";
import createUrqlClient  from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";
import { Box, Button, Flex, Heading, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";

interface indexProps{}



const index:React.FC<indexProps> = () => {

  const [{data,fetching}] = usePostsQuery({
    variables:{
      limit:10
    }
  });

  return(
    <Layout>
      <Flex mb={4}>
      <Heading>BiReddit</Heading>
      <NextLink href="/create-post">
        <Link ml="auto">Create Post</Link>
      </NextLink>
      </Flex>
      <br />
      {fetching && !data 
        ? <div> Loading ... </div>   
        : <Stack spacing={8}>
          { data.posts.map(el => {    
            return (
              <>
                <Box key={el.id} p={5} shadow="md" borderWidth={1} mb={3}>
                  <Heading fontSize="xl">{el.title}</Heading>
                  <Text mt={2}>{el.textSnippet}</Text> 
                </Box>
              </>
            )
          })}
        </Stack>
      }
      { data 
        ? <Flex align="center" mt={4}>
            <Button isLoading={fetching} m="auto" my={8} padding={4}>Load more</Button>
          </Flex>
        : null
      }
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient,{ ssr:true })(index);
