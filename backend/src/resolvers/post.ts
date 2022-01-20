import { isAuth } from "./../middleware/isAuth";
import { MyContext } from "./../types";
import { Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { Post } from "../entities/Post";
import { getConnection } from "typeorm";

@InputType()
class PostInput{
  @Field()
  title:string;

  @Field()
  text:string;
}


@Resolver(Post)
export class PostResolver{

  @FieldResolver(() => String)
  textSnippet(
    @Root() root:Post
  ){
    return root.text.slice(0,50);
  }

  @Query(() => [Post])  
  async posts(
    @Arg("limit",() => Int) limit:number,
    @Arg("cursor",() => String, {nullable:true}) cursor:string | null
  ):Promise<Post[]>{
    const realLimit = Math.min(50,limit);
    const qb = await getConnection().getRepository(Post)
      .createQueryBuilder("p")      
      .orderBy('"createdAt"',"DESC")
      .take(realLimit)      

    if(cursor){
      qb.where('"createdAt" > :cursor ',{
        cursor:new Date(parseInt(cursor))
      });
    }

    return qb.getMany()
    
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