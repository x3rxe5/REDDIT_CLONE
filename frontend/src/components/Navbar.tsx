import { Box,Link,Flex, Button } from "@chakra-ui/react"
import NextLink from "next/link";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";

interface NavbarProps{}


export const NavBar:React.FC<NavbarProps> = ({}) => {
  const [{fetching:logoutFetching},logout] = useLogoutMutation();
  const [{data,fetching}] = useMeQuery({
    pause:isServer(),
  });
  let body = null;

  console.log(data);

  if(fetching){

  }else if(data === undefined){
   body = ( 
    <>
    <NextLink href="/login">  
      <Link mr={2} color="white" >Login</Link>
    </NextLink>
    <NextLink href="/register">
      <Link color="white" >Register</Link>
    </NextLink>
  </>
    ) 
  }else if(!data.me){
    body = (
      <>
        <NextLink href="/login">  
          <Link mr={2} color="white" >Login</Link>
        </NextLink>
        <NextLink href="/register">
          <Link color="white" >Register</Link>
        </NextLink>
    </>
    );
  }else{
    body = (
      <>
        <Flex>
          <Box mr={2}>
            {data.me.username}
          </Box>
          <Button 
            variant="link" 
            onClick={() => {
              logout() 
            }}
            isLoading={logoutFetching}
          >Logout</Button>
        </Flex>
      </>
    )
  }


  return(
    <>
      <Flex bg="tan" p={4}>
        <Box ml={'auto'}>
          {body}
        </Box>
      </Flex>
    </>
  )
}