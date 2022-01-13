export const HtmlCreator = (token:string):string => {
 return `
  <html>
    <body>
      <h4>Please follow the link for reset password </h4><br />
      <h5>Referal link expire in 3 days </h5>
      <a href="http://localhost:3000/change-password/${token}">Reset Password</a>
    </body>
  </html>
`
  
}