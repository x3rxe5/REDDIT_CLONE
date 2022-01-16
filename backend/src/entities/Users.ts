
import { Field, ObjectType } from "type-graphql";
import { BaseEntity, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class Users extends BaseEntity{

  @Field()
  @PrimaryGeneratedColumn()
  id!:number;

  @Field(() =>  String)
  @CreateDateColumn()
  createdAt :Date;

  @Field(() =>  String)
  @UpdateDateColumn()
  updatedAt : Date;

  @Field()
  @Column({ type:"text", unique:true})
  username!: string;

  @Field()
  @Column({ type:"text", unique:true})
  email!: string;


  @Column({ type:"text" })
  password!: string;

  // Relation
  @OneToMany(() => Post,post => post.creator)
  posts:Post[];

}