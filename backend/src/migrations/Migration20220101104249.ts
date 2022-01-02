import { Migration } from '@mikro-orm/migrations';

export class Migration20220101104249 extends Migration {

  async up(): Promise<void> {
    this.addSql('create table "post" ("id" serial primary key, "created_at" timestamptz(0) not null, "update_at" timestamptz(0) not null, "title" text not null);');
  }

}
