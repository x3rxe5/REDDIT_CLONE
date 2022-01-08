import { Users } from "../entities/Users";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import argon2 from "argon2";

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
    @Ctx() {em}:MyContext
  ):Promise<UserResponse>{

  
    if(options.username.length <= 5){
      return errorMessageResponse("Username length","Username Length Must be greater than 5");
    }

    if(options.password.length < 6 && options.password.length > 50){
      return errorMessageResponse("Password","Password length must be greater than 6 and less than 50");
    }

    const hashedPassword = await argon2.hash(options.password);
    
    const user = await em.create(Users,{
      username:options.username,
      email:options.email,
      password:hashedPassword
    });
    
    try{
      await em.persistAndFlush(user);
    }catch(e){

      if(e.code === "23505" || e.details.includes("already exists")){
        return errorMessageResponse(
          "Username",
          "Username already taken"
        )
      }

      return errorMessageResponse("error",e.message);

    }   

    return {
      user
    };

  }

  // Login method
  @Mutation(() => UserResponse)
  async login(
    @Arg("options") option:UsernameAndPasswordInput,
    @Ctx() {em,req}:MyContext
  ):Promise<UserResponse>{

    try{

      const user = await em.findOne(Users,{ username:option.username })

      if(!user){        
        return errorMessageResponse("Username/Password","Username/Password does not exists");
      }

      const valid = await argon2.verify(user.password,option.password);

      if(!valid){
        return errorMessageResponse("Username/Password","Username/Password does not exists");
      }

      req.session.userId = user.id;
      
      return {
        user
      };
      
    }catch(error){
      return errorMessageResponse("error",error.message);
    }

  }

}