import React,{ InputHTMLAttributes } from "react";
import { FormControl, FormErrorMessage, FormLabel, Input, Textarea } from "@chakra-ui/react";
import { useField } from "formik";



type InputFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label:string;
  name:string;
  textarea?:boolean;
}



export const InputField:React.FC<InputFieldProps> = ({
  label,
  textarea,
  size:_,
  ...props
}) => {
  let C:typeof Input | typeof Textarea | null = Input;
  if(textarea){
    C = Textarea;
  }
  const [field,meta] = useField(props);
  
  return(    
    <>            
      <FormControl isInvalid={!!meta.error}>
        <FormLabel htmlFor={field.name}>{label}</FormLabel>
        <C
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