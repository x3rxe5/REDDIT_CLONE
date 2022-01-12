import { Users } from "../entities/Users";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2";
import * as EmailValidator from "email-validator";
import { sendEmail } from "./../utils/sendEmail";
import { v4 } from "uuid";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "./../constant";

// import { EntityManager } from "@mikro-orm/postgresql";

@InputType()
class UsernameAndPasswordInput{

  @Field()
  username:string

  @Field(() => String,{nullable:true})
  email?:string

  @Field()
  password:string;
}

@ObjectType()
class FieldError{
  @Field()
  field:string;

  @Field()
  message:string;
}

@ObjectType()
class UserResponse{

  @Field(() => [FieldError], { nullable:true })
  errors?:  FieldError[];

  @Field(() => Users,{nullable:true})
  user?: Users;

}

/*
* errorMessageResponse(@param1,@param2):UserResponse {error field return}
*/

const errorMessageResponse = (_f:string,_m:string):UserResponse => {
  return {
    errors:[{
      field:_f,
      message:_m
    }]
  }
}

// Main() resolver here

@Resolver()
export class UserResolver{

  @Mutation(() =>  Boolean)
  async forgotPassword(
    @Arg("email") email:string,
    @Ctx() { em, redis } : MyContext
  ){
    
    if(!EmailValidator.validate(email)){
      return false;
    }
    
    const person = await em.findOne(Users,{email:email});

    if(!person){
      return false;
    }

    const token:string= v4();

    await redis.set(
      FORGOT_PASSWORD_PREFIX+token,
      person.id,
      'ex',
      1000 * 60 * 60 * 24 * 3
    ); // 3 days

    const html:string = `
      <html>
        <body>
          <h4>Please follow the link for reset password </h4><br />
          <h5>Referal link expire in 3 days </h5>
          <a href="http://localhost:3000/change-password/${token}">Reset Password</a>
        </body>
      </html>
    `

    await sendEmail(email,html);
    return true;
  }

  @Query(() => Users, { nullable:true })
  async me(
    @Ctx() {req,em}:MyContext
  ){
    console.log('This is req session and userid => ', req.session.userId);
    if(!req.session.userId){
      return null;
    }
    const user = await em.findOne(Users, { id: req.session.userId});
    return user;
  }



  // Register Method
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options:UsernameAndPasswordInput,
    @Ctx() { em,req }:MyContext
  ):Promise<UserResponse>{

  
    if(options.username.length <= 5){
      return errorMessageResponse("username","Username Length Must be greater than 5");
    }

    if(options.password.length < 6 && options.password.length > 50){
      return errorMessageResponse("password","Password length must be greater than 6 and less than 50");
    }

    if(options.email){
      const checker:boolean = EmailValidator.validate(options.email);
      if(!checker){
        return errorMessageResponse("email","not valid email address");
      }
    }

    const hashedPassword = await argon2.hash(options.password);
    
    const user = await em.create(Users,{
      username:options.username,
      email:options.email,
      password:hashedPassword
    });

    
    
    try{
      // const result = await  (em as EntityManager).createQueryBuilder(Users).getKnexQuery().insert({
      //   username:options.username,
      //   email:options.email,
      //   password:hashedPassword,
      //   updated_at:new Date(),
      //   created_at:new Date()
      // }).returning("*")
      
      await em.persistAndFlush(user);
    }catch(e){
      console.log(e);
      if(e.code === "23505" || e.details.includes("already exists")){
        return errorMessageResponse(
          "Username",
          "Username already taken"
        )
      }

      return errorMessageResponse("error",e.message);
    }   
    
    // Cookie Enabled 
    req.session.userId = user.id;

    return {
      user
    };

  }

  // Login method
  @Mutation(() => UserResponse)
  async login(
    @Arg("usernameOrEmail") usernameOrEmail:string,
    @Arg("password") password:string,
    @Ctx() {em,req}:MyContext
  ):Promise<UserResponse>{

    try{
      let user:Users | null; 
      const checker:boolean = EmailValidator.validate(usernameOrEmail);
      if(checker){
        user = await em.findOne(Users,{email:usernameOrEmail});
      }else{
        user = await em.findOne(Users,{ username:usernameOrEmail });
      }


      if(!user){        
        return errorMessageResponse("username","user/email does not exists");
      }

      const valid = await argon2.verify(user.password,password);

      if(!valid){
        return errorMessageResponse("password","password does not match");
      }

      req.session.userId = user.id;
      
      return {
        user
      };
      
    }catch(error){
      return errorMessageResponse("error",error.message);
    }

  }

  // Logout mutation 
  @Mutation(() => Boolean)
  logout(
    @Ctx() {req,res}:MyContext
  ){

    return new Promise((resp) => 
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME,{ path:"/"});
        if(err){        
          console.log(err);
          resp(false);
          return;
        }
        resp(true);
    }));
  }


  /// Change Password menu
  @Mutation(() => UserResponse)
  async changePassword(
    @Arg("token") token:string,
    @Arg("newPassword") newPassword:string,
    @Ctx() { em,redis,req } : MyContext
  ):Promise<UserResponse>{

    if(newPassword.length <=2 || newPassword.length > 50){
      return errorMessageResponse("newPassword","password length is short than 2 or greater than 50");
    }

    const userId = await redis.get(FORGOT_PASSWORD_PREFIX+token);

    if(!userId){
      return errorMessageResponse("token","token expired or userid is not valid");
    }

    const user = await em.findOne(Users, { id: parseInt(userId) });

    if(!user){
      return errorMessageResponse("user","user no longer exist");
    }

    user.password = await argon2.hash(newPassword);

    await em.persistAndFlush(user);
    await redis.del(FORGOT_PASSWORD_PREFIX+token);

    req.session.userId = user.id;

    return {
      user
    }

  }

}