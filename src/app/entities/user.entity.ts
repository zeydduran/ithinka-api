import { hashPassword } from '@foal/core';
import { UserWithPermissions } from '@foal/typeorm';
import { BaseEntity, BeforeInsert, BeforeUpdate, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User extends UserWithPermissions {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  

  @Column()
  password: string;


  @Column({ type: 'timestamp', default: () => 'NOW()' })
  created_at: string


}
export { Group, Permission } from '@foal/typeorm';
