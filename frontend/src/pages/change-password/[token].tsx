import { Box, Button, Flex, Link } from "@chakra-ui/react";
import { Form, Formik } from "formik"; 
import { NextPage } from "next";
import { withUrqlClient } from "next-urql";
import {  useRouter } from "next/router";
import { useState } from "react";
import { InputField } from "../../components/InputField";
import { Wrapper } from "../../components/Wrapper";
import { useChangePasswordMutation } from "../../generated/graphql";
import createUrqlClient from "../../utils/createUrqlClient";
import { toErrorMap } from "../../utils/toErrorMap";
import NextLink from "next/link";

const ChangePassword:NextPage<{token:string}> = ({token}) => {
  const router = useRouter();
  const [,changePassword] = useChangePasswordMutation();
  const [tokenError,setTokenError] = useState<boolean | string>();

  return(
    <>
      <Wrapper variant="small"> 
        <Formik
          initialValues={{ newPassword:"" }}
          onSubmit={ async (values,{ setErrors }) => {

            const response = await changePassword ({ newPassword:values.newPassword,token}); 
            
            if(response.data.changePassword.errors){
              const errorMap = toErrorMap(response.data.changePassword.errors)
              if("token" in errorMap){
                setTokenError(errorMap.token);
              }
              setErrors(errorMap);
            }else if(response.data.changePassword.user){              
              router.push("/");
            }

          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <InputField
                name="newPassword"
                placeholder="new Password"
                label="New Password"
                type="password"
              />
              {
                tokenError 
                ? ( 
                  <Flex>
                    <Box mr={2} color="red.300">{tokenError}</Box>
                    <NextLink href="/forgot-password">
                      <Link>
                        Click here to new password
                      </Link>
                    </NextLink>
                  </Flex>             
                )
                : null   
              }                                    
              <Button
                mt={4}                
                size='sm'
                height='48px'
                width='400px'
                border='1px'
                borderColor='green.500'                
                type="submit"
                isLoading={isSubmitting}
              >
                Change Password
              </Button>
            </Form>
          )}
        </Formik>
      </Wrapper>
    </>
  )
}

ChangePassword.getInitialProps = ({ query }) => {
  return{
    token:query.token as string
  }
}

export default withUrqlClient(createUrqlClient,{ ssr:false })(ChangePassword);