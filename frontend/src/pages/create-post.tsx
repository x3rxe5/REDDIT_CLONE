import { Alert, AlertIcon, AlertTitle, Box, Button, CloseButton, Flex, FormControl, FormLabel, Link, Textarea } from "@chakra-ui/react";
import { Form, Formik } from "formik";
import { useRouter } from "next/router";
import React, { useEffect } from "react";
import { InputField } from "../components/InputField";
import { useCreatePostMutation, useMeQuery } from "../generated/graphql";
import { withUrqlClient } from "next-urql";
import createUrqlClient from "../utils/createUrqlClient";
import { Layout } from "../components/Layout";
import { useIsAuth } from "../utils/useIsAuth";

interface createPostProps{}



const CreatePost:React.FC<createPostProps> = ({}) => {
  
  const router = useRouter();
  const [,createPost]  = useCreatePostMutation();

  useIsAuth();

  return(
    <>
      <Layout variant="small">
      <Formik
          initialValues={{ title:"",text:"" }}
          onSubmit={ async (values,{ setErrors }) => {            
            const {error} = await createPost({input:values});            
            if(!error){
              router.push("/");
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <InputField 
                name="title"
                placeholder="Enter a title here"
                label="Title"
              />
              <Box mt={4}>

              </Box>
              <InputField
                textarea
                name="text"
                placeholder="supportive text here"
                label="Text"
              />
              {/* <FormControl mt={4}>
                <FormLabel htmlFor="text">Text</FormLabel>                                
                  <Textarea 
                    name="text"
                    placeholder="supportive text add here"
                    label="text"
                  />                  
              </FormControl> */}
              
              <Button
                variant="solid"
                colorScheme="teal"
                mt={4}                
                size='sm'
                height='48px'
                width='100px'
                border='1px'
                borderColor='green.500'                
                type="submit"
                isLoading={isSubmitting}
              >
                Submit Post
              </Button>
            </Form>
          )}
        </Formik>
      </Layout>
    </>
  )
}

export default withUrqlClient(createUrqlClient)(CreatePost);