// 3p
import { hashPassword } from '@foal/core';
import { Group, Permission } from '@foal/typeorm';
import { createConnection, getConnection, getManager } from 'typeorm';

// App
import { User } from '../app/entities';

export const schema = {
  additionalProperties: false,
  properties: {
    email: { type: 'string', format: 'email' },
    groups: { type: 'array', items: { type: 'string' }, uniqueItems: true, default: [] },
    password: { type: 'string' },
    userPermissions: { type: 'array', items: { type: 'string' }, uniqueItems: true, default: [] },
  },
  required: ['email', 'password'],
  type: 'object',
};

export async function main(args) {
  
  const user = new User();
  user.userPermissions = [];
  user.groups = [];
  user.email = args.email;
  user.password = await hashPassword(args.password);

  await createConnection();

  for (const codeName of args.userPermissions as string[]) {
    const permission = await Permission.findOne({ codeName });
    if (!permission) {
      console.log(`No permission with the code name "${codeName}" was found.`);
      return;
    }
    user.userPermissions.push(permission);
  }

  for (const codeName of args.groups as string[]) {
    const group = await Group.findOne({ codeName });
    if (!group) {
      console.log(`No group with the code name "${codeName}" was found.`);
      return;
    }
    user.groups.push(group);
  }

  try {
    console.log(
      await getManager().save(user)
    );
  } catch (error) {
    console.log(error);
  } finally {
    await getConnection().close();
  }
}