import { isAuth } from "./../middleware/isAuth";
import { MyContext } from "./../types";
import { Arg, Ctx, Field, InputType, Int, Mutation, Query, Resolver, UseMiddleware } from "type-graphql";
import { Post } from "../entities/Post";

@InputType()
class PostInput{
  @Field()
  title:string;

  @Field()
  text:string;
}


@Resolver()
export class PostResolver{

  @Query(() => [Post])  
  posts():Promise<Post[]>{
    return Post.find();
  }

  @Query(() => Post, {nullable:true})  
  post( 
    @Arg("id",() => Int) id: number):Promise<Post | undefined>{
    return Post.findOne({id});
  }

  // Create Post Mutation
  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async createPost(
    @Arg("input") input:PostInput,
    @Ctx() { req } : MyContext
  ):Promise<Post>{      
    
    return await Post.create({
      ...input,
      creatorId:req.session.userId
    }).save();
  }

  @Mutation(() => Post,{ nullable:true})
  @UseMiddleware(isAuth)
  async updatePost(

    @Arg("id") id: number,
    @Arg("title",() => String,{ nullable: true }) title: string
    ):Promise<Post|null>{
    
    const post = await Post.findOne(id);
    if(!post){
      return null;
    }
    if(typeof title !== "undefined"){
      await Post.update({id},{title});
    }
    return post;

  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg("id") id: number):Promise<boolean>{
    
    try{
      await Post.delete({id});
    }catch(e){
      return false;
    }
    return true;

  }


}