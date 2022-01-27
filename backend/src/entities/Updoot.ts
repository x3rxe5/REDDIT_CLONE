import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { Users } from "./Users";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class Updoot extends BaseEntity{


  @Column({ type:"int" })
  value:number

  // Relations

  @ManyToOne(() => Users,users => users.updoots)
  users:Users;

  @Field()
  @PrimaryColumn() 
  userId: number;

  @Field(() => Post)
  @ManyToOne(() => Post,post => post.updoots)
  post:Post;

  @Field()
  @PrimaryColumn()
  postId: number;

}