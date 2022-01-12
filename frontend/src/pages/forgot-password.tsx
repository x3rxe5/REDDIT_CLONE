import React, { useState } from "react";
import NextLink from "next/link";
import { Box, Button, Flex, Link } from "@chakra-ui/react";
import { withUrqlClient } from "next-urql";
import createUrqlClient from "../utils/createUrqlClient";
import { Wrapper } from "../components/Wrapper";
import { Form, Formik } from "formik";
import { InputField } from "../components/InputField";
import { useForgotPasswordMutation } from "../generated/graphql";


const ForgotPassword:React.FC<{}> = ({ }) => {
  
  const [,forgotPassword] = useForgotPasswordMutation();
  const [msg,setMsg] = useState<string | boolean>();

  return ( 
    <> 
       <Wrapper variant="small"> 
        <Formik
          initialValues={{ email:"" }}
          onSubmit={ async (values,{ setErrors }) => {            
            const response = await forgotPassword({ email : values.email})            
            if(response.data.forgotPassword){
              setMsg(response.data.forgotPassword);
            }
          }}
        >
          {({ isSubmitting }) => msg ? (
            <>
              <Flex mt={3}>
                <Box mb="2">
                  <h3>Please Check your inbox to reset your password</h3>
                </Box>
                <NextLink href="/">
                  <Link color="red.300" ml={3}>
                    Home
                  </Link>
                </NextLink>
              </Flex>
            </>
          ):(
            <Form>
              <InputField 
                name="email"
                placeholder="email"
                label="Registered email"
              />                                    
              <Button
                variant="solid"
                color="green.300"
                mt={4}                
                size='sm'
                height='48px'
                width='100px'
                border='1px'
                borderColor='green.500'                
                type="submit"
                isLoading={isSubmitting}
              >
                Send it 
              </Button>          
            </Form>
            
          )}
        </Formik>
      </Wrapper>
    </> 
  )
}


export default withUrqlClient(createUrqlClient)(ForgotPassword);