import React from "react";
import { NavBar } from "./Navbar";
import { Wrapper } from "./Wrapper";

interface LayoutProps{
  variant?:"small" | "regular";
}

export const Layout:React.FC<LayoutProps> = ({
  children,
  variant
}) => {
  return(
    <>
      <NavBar />
      <Wrapper variant={variant}>
        {children}
      </Wrapper>
    </>
  )
}