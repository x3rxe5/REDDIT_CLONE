import { Users } from "../entities/Users";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2";
import * as EmailValidator from "email-validator";
import { sendEmail } from "./../utils/sendEmail";
import { v4 } from "uuid";
import { COOKIE_NAME, FORGOT_PASSWORD_PREFIX } from "./../constant";
import { HtmlCreator } from "./../utils/htmlCreator";
import { getConnection } from "typeorm";

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
    @Ctx() { redis } : MyContext
  ){
    
    if(!EmailValidator.validate(email)){
      return false;
    }
    
    const person = await Users.findOne({where:{ email }});

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

    const html:string = HtmlCreator(token);

    await sendEmail(email,html);
    return true;
  }


  //me Query
  @Query(() => Users, { nullable:true })
  me(
    @Ctx() { req }:MyContext
  ){
    
    if(!req.session.userId){
      return null;
    }

    return Users.findOne(req.session.userId);
  }



  // Register Method
  @Mutation(() => UserResponse)
  async register(
    @Arg("options") options:UsernameAndPasswordInput,
    @Ctx() { req }:MyContext
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
    
    let user:Users;
    
    try{
      const result = await getConnection().createQueryBuilder().insert().into(Users).values({
        username:options.username,
        email:options.email,
        password:hashedPassword
      }).returning("*").execute();

      console.log(result);      
      user = result.raw[0];
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
    @Ctx() { req }:MyContext
  ):Promise<UserResponse>{

    try{
      let user:Users | undefined; 
      const checker:boolean = EmailValidator.validate(usernameOrEmail);
      if(checker){
        // user = await em.findOne(Users,{email:usernameOrEmail});
        user = await Users.findOne({ where : {email:usernameOrEmail}});
      }else{
        user = await Users.findOne({ where : {username:usernameOrEmail}});
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
    @Ctx() { redis,req } : MyContext
  ):Promise<UserResponse>{

    if(newPassword.length <=2 || newPassword.length > 50){
      return errorMessageResponse("newPassword","password length is short than 2 or greater than 50");
    }

    const userId = await redis.get(FORGOT_PASSWORD_PREFIX+token);

    if(!userId){
      return errorMessageResponse("token","token expired or userid is not valid");
    }

    // const user = await em.findOne(Users, { id: parseInt(userId) });
    const user = await Users.findOne(parseInt(userId));

    if(!user){
      return errorMessageResponse("user","user no longer exist");
    }
    
    // Update the password 
    await Users.update({id:parseInt(userId)},{
      password:await argon2.hash(newPassword)
    });

    await redis.del(FORGOT_PASSWORD_PREFIX+token);

    req.session.userId = user.id;

    return {
      user
    }

  }

}