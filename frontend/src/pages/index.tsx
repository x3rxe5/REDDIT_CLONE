import React, { useState } from "react";
import { withUrqlClient } from "next-urql";
import createUrqlClient  from "../utils/createUrqlClient";
import { usePostsQuery } from "../generated/graphql";
import { Layout } from "../components/Layout";
import { Box, Button, Flex, Heading, Link, Stack, Text } from "@chakra-ui/react";
import NextLink from "next/link";
import { ChevronDownIcon, ChevronUpIcon, Icon } from "@chakra-ui/icons";

interface indexProps{}



const index:React.FC<indexProps> = () => {
  const [variables,setVariable] = useState({
    limit:15,
    cursor:null as null | string
  });

  const [{data,fetching}] = usePostsQuery({
    variables
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
          { data.posts.posts.map(el => {    
            return (
              <>
                <Flex key={el.id} p={5} shadow="md" borderWidth={1} mb={3}>
                  <Box mr={3}>
                    <Box>
                      <ChevronUpIcon w={6} h={6} />
                    </Box>
                    <Box ml={2}>
                      {el.points}
                    </Box>
                    <Box>
                      <ChevronDownIcon w={6} h={6} />
                    </Box>
                  </Box>
                  <Box>
                    <Heading fontSize="xl">{el.title}</Heading>
                    <Text> By {el.creator.username}</Text>
                    <Text mt={2}>{el.textSnippet}</Text> 
                  </Box>
                </Flex>
              </>
            )
          })}
        </Stack>
      }
      { data && data.posts.hasMore
        ? (<Flex align="center" mt={4}>
            <Button onClick={() => {
              setVariable({
                limit:variables.limit,
                cursor:data.posts.posts[data.posts.posts.length - 1].createdAt
              })
            }} isLoading={fetching} m="auto" my={8} padding={4}>Load more</Button>
          </Flex>)
        : null
      }
    </Layout>
  )
}

export default withUrqlClient(createUrqlClient,{ ssr:true })(index);
