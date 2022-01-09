import { Formik } from "formik";
import React from "react";
import { Wrapper } from "../components/Wrapper";

interface loginProps {}

const login:React.FC<loginProps> = ({}) => {  
  return(
    <>
      <Wrapper variant="small">
        <Formik 
          initialValues={{ username:"",password:"" }}
          onSubmit={ async (values,{setErrors}) => {
            console.log(values);
          }}
        >
          
        </Formik>
      </Wrapper>
    </>
  )
}

export default login;