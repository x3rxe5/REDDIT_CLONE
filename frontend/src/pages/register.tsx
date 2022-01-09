import React from "react";
import { Formik,Form } from "formik";
import { Wrapper } from "../components/Wrapper";
import { InputField } from "../components/InputField";
import { Box, Button } from "@chakra-ui/react";
import { useRegisterMutation } from "../generated/graphql";
import { toErrorMap } from "../utils/toErrorMap";
import { useRouter } from "next/router";


interface registerProps{}



const register:React.FC<registerProps> = ({}) => {

  const router = useRouter();

  const [,register] = useRegisterMutation();

  return(
    <>
      <Wrapper variant="small"> 
        <Formik 
          initialValues={{ username:"", email:"", password:"" }}
          onSubmit={ async (values,{ setErrors }) => {            
            const response = await register(values);         
            console.log(response);
            if(response.data.register.errors){            
              setErrors(toErrorMap(response.data.register.errors));
            }else if(response.data?.register.user){
              router.push("/");
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <InputField 
                name="username"
                placeholder="username"
                label="Username"    
              />
              <Box mt={4}>
               <InputField 
                name="email"
                placeholder="use your proper email"
                label="Email"
              />
              </Box>
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
                Submit
              </Button>
            </Form>
          )}
        </Formik>
      </Wrapper>
    </>
  )
}

export default register;