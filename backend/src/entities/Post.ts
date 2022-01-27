import { BaseEntity, Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { Users } from "./Users";
import { Updoot } from "./Updoot";

@ObjectType()
@Entity()
export class Post extends BaseEntity{

  @Field()
  @PrimaryGeneratedColumn()
  id!: number;

  @Field(() =>  String)
  @CreateDateColumn()
  createdAt:Date;

  @Field(() => String)
  @UpdateDateColumn()
  updateAt : Date;
  
  @Field()
  @Column()
  title!: string;

  @Field()
  @Column()
  text!: string;

  @Field()
  @Column({ type: "int",default:0 })
  points!: number;

  // Relations
  @Field()
  @ManyToOne(() => Users,users => users.posts)
  creator:Users;

  @Field()
  @Column()
  creatorId: number;

  @OneToMany(() => Updoot,updoot => updoot.post)
  updoots:Updoot[]
  
}