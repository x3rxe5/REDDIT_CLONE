import { Updoot } from "./../entities/Updoot";
import { Arg, Ctx, Field, FieldResolver, InputType, Int, Mutation, ObjectType, Query, Resolver, Root, UseMiddleware } from "type-graphql";
import { getConnection } from "typeorm";
import { Post } from "../entities/Post";
import { isAuth } from "./../middleware/isAuth";
import { MyContext } from "./../types";

@InputType()
class PostInput{
  @Field()
  title:string;

  @Field()
  text:string;
}

@ObjectType()
class PaginatedPosts{
  @Field(() => [Post])
  posts:Post[]

  @Field()
  hasMore:boolean;
}


@Resolver(Post)
export class PostResolver{

  @FieldResolver(() => String)
  textSnippet(
    @Root() root:Post
  ){
    return root.text.slice(0,50);
  }
  @Query(() => PaginatedPosts)  
  async posts(
    @Arg("limit",() => Int) limit:number,
    @Arg("cursor",() => String, {nullable:true}) cursor:string | null,
    @Ctx() { req }:MyContext
  ):Promise<PaginatedPosts>{

    const realLimit = Math.min(50,limit);
    const addLimit = realLimit + 1;
    const { userId } = req.session;

    const replacements:any[] = [addLimit];

    if(cursor){
      replacements.push(new Date(parseInt(cursor)));
    }    
    console.log("This is req.session -> ", req);
    // const posts = await getConnection().query(
    //   `
    // select p.*
    // from post p
    // ${cursor ? `where p."createdAt" < $2` : ""}
    // order by p."createdAt" DESC
    // limit $1
    // `,
    //   replacements
    // );

    const posts = await getConnection().query(`
      select p.*,
      json_build_object(
        'id',u.id,
        'username',u.username,
        'email',u.email
      ) creator
      from post p
      inner join users u on u.id = p."creatorId"
      ${cursor ? `where p."createdAt" < $3` : ""}  
      order by p."createdAt" DESC
      limit $1
    `,replacements);

    // const qb = await getConnection().getRepository(Post)
    //   .createQueryBuilder("p")
    //   .innerJoinAndSelect("p.creator","u",'u.id = p."creatorId"')
    //   .orderBy('p."createdAt"',"DESC")
    //   .take(addLimit)      

    // if(cursor){
    //   qb.where('p."createdAt" > :cursor ',{
    //     cursor:new Date(parseInt(cursor))
    //   });
    // }

    // const posts = await qb.getMany();

    return {
      posts:posts.slice(0,realLimit),
      hasMore:posts.length === addLimit
    } 
    
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

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg("postId", () => Int) postId: number,
    @Arg("value", () => Int) value: number,
    @Ctx() { req }: MyContext
  ) {
    const isUpdoot = value !== -1;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;
    console.log("This is req Object -> ",req);
    const updoot = await Updoot.findOne({ where: { postId, userId } });

    // the user has voted on the post before
    // and they are changing their vote
    if (updoot && updoot.value !== realValue) {
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
            update updoot
            set value = $1
            where "postId" = $2 and "userId" = $3
        `,
          [realValue, postId, userId]
        );

        await tm.query(
          `
          update post
          set points = points + $1
          where id = $2
        `,
          [realValue, postId]
        );
      });
    } else if (!updoot) {
      // has never voted before
      await getConnection().transaction(async (tm) => {
        await tm.query(
          `
          insert into updoot ("userId", "postId", value)
          values ($1, $2, $3)
        `,
          [userId, postId, realValue]
        );

        await tm.query(
          `
          update post
          set points = points + $1
          where id = $2
      `,
          [realValue, postId]
        );
      });
    }
    return true;
  }


}