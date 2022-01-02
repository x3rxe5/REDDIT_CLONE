import { User } from "../entities/User";
import { MyContext } from "src/types";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Resolver } from "type-graphql";
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

  @Field(() => User,{nullable:true})
  user?: User;

}

@Resolver()
export class UserResolver{

  @Mutation(() => User)
  async register(
    @Arg("options") options:UsernameAndPasswordInput,
    @Ctx() {em}:MyContext
  ):Promise<User>{

    const hashedPassword = await argon2.hash(options.password);
    const user = await em.create(User,{
      username:options.username,
      email:options.email,
      password:hashedPassword
    });
    await em.persistAndFlush(user);
    return user;

  }

  @Mutation(() => UserResponse)
  async login(
    @Arg("options") option:UsernameAndPasswordInput,
    @Ctx() {em}:MyContext
  ):Promise<UserResponse>{

    const user = await em.findOne(User,{ username:option.username })
    if(!user){
      return{
        errors:[{
          field:"username",
          message:"Username does not exists"
        }]
      }
    }
    const valid = await argon2.verify(user.password,option.password);
    if(!valid){
      return{
        errors:[{
          field:"password",
          message:"Password does not match"
        }]
      }
    }

    return {
      user
    };
  }
}