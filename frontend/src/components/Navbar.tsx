import { Box,Link,Flex, Button, Heading } from "@chakra-ui/react"
import NextLink from "next/link";
import { useRouter } from "next/router";
import { useLogoutMutation, useMeQuery } from "../generated/graphql";
import { isServer } from "../utils/isServer";


interface NavbarProps{}


export const NavBar:React.FC<NavbarProps> = ({}) => {
  const router = useRouter();
  console.log("This is path => ",router.pathname);
  const [{fetching:logoutFetching},logout] = useLogoutMutation();
  const [{data,fetching}] = useMeQuery({
    pause:isServer(),
  });
  let body = null;  

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
        <Flex align="center">
          <NextLink href="/create-post">
            {/* <Link mr={2}>Create Post</Link> */}
            <Button mr={4}>
              Create Post
            </Button>
          </NextLink>
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
      <Flex bg="tan" p={4} >
        <Flex align="center" maxW={800} flex={1} m="auto">
          <NextLink href="/"> 
            <Link>
              { 
                router.pathname !== "/" 
                ? <Heading color="whiteAlpha.800">BiReddit</Heading> 
                : <Heading color="whiteAlpha.800">The Hutch</Heading>
              }            
            </Link>
          </NextLink>
          <Box ml={'auto'}>
            {body}
          </Box>
        </Flex>
      </Flex>
    </>
  )
}