import React,{ InputHTMLAttributes } from "react";
import { FormControl, FormErrorMessage, FormLabel, Input } from "@chakra-ui/react";
import { useField } from "formik";



type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label:string;
  placeholder:string;
  name:string;
}

export const InputField:React.FC<InputFieldProps> = ({
  label,
  size:_,
  ...props
}) => {
  const [field,meta] = useField(props);
  console.log("This is error from InputField Props -> ",meta);
  return(
    <>
      <FormControl isInvalid={!!meta.error}>
        <FormLabel htmlFor={field.name}>{label}</FormLabel>
        <Input 
          {...field} 
          {...props}
          id={field.name} 
          placeholder={props.placeholder} 
        />
        {meta.error ? <FormErrorMessage>{meta.error}</FormErrorMessage> : null }
      </FormControl>
    </>
  );
}