import React from "react";
import { Formik,Form } from "formik";
import { Wrapper } from "../components/Wrapper";
import { InputField } from "../components/InputField";
import { Box, Button } from "@chakra-ui/react";
import { useLoginMutation, useRegisterMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";
import { withUrqlClient } from "next-urql";
import createUrqlClient from "../utils/createUrqlClient";


interface loginProps{}



const login:React.FC<loginProps> = ({}) => {

  const router = useRouter();

  const [,login] = useLoginMutation();

  return(
    <>
      <Wrapper variant="small"> 
        <Formik 
          initialValues={{ username:"", password:"" }}
          onSubmit={ async (values,{ setErrors }) => {            
            const response = await login ({ usernameOrEmail:values.username,password:values.password });
            console.log("This is response -> ",response);
            if(response.data.login.errors){            
              setErrors(toErrorMap(response.data.login.errors));
            }else if(response.data.login.user){              
              router.push("/");
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <InputField 
                name="username"
                placeholder="username or email"
                label="Username/email"
              />                      
              <Box mt={4}>
                <InputField 
                  name="password"
                  placeholder="password"
                  label="Password"    
                  type="password"
                />
              </Box>
              <Button
                mt={4}                
                size='sm'
                height='48px'
                width='100px'
                border='1px'
                borderColor='green.500'                
                type="submit"
                isLoading={isSubmitting}
              >
                Login
              </Button>
            </Form>
          )}
        </Formik>
      </Wrapper>
    </>
  )
}

export default withUrqlClient(createUrqlClient)(login);