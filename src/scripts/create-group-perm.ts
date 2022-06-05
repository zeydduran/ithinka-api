// 3p
import { Group, Permission } from '@foal/typeorm';
import { createConnection } from 'typeorm';

export const schema = {
  additionalProperties: false,
  properties: {
    /* To complete */
  },
  required: [ /* To complete */ ],
  type: 'object',
};

export async function main(args: any) {
  const connection = await createConnection();

  try {
    const view = new Permission();
    view.codeName = 'view-users';
    view.name = 'Permission to view users';
    await view.save();
    const detail = new Permission();
    detail.codeName = 'detail-users';
    detail.name = 'Permission to detail users';
    await detail.save();
    const create = new Permission();
    create.codeName = 'create-users';
    create.name = 'Permission to create users';
    await create.save();
    const update = new Permission();
    update.codeName = 'update-users';
    update.name = 'Permission to update users';
    await update.save();
    const remove = new Permission();
    remove.codeName = 'delete-users';
    remove.name = 'Permission to delete users';
    await remove.save();

    const admin = new Group();
    admin.codeName = 'Admin';
    admin.name = 'Admin User';
    admin.permissions = [view,create,update,remove,detail];
    await admin.save();
    const user = new Group();
    user.codeName = 'User';
    user.name = 'Standart User';
    user.permissions = [view,detail];
    await user.save();

  } catch (error) {
    console.error(error);
  } finally {
    await connection.close();
  }
}
