// 3p
import { Permission } from '@foal/typeorm';
import { createConnection, getConnection } from 'typeorm';

export const schema = {
  additionalProperties: false,
  properties: {
    codeName: { type: 'string', maxLength: 100 },
    name: { type: 'string' },
  },
  required: ['name', 'codeName'],
  type: 'object',
};

export async function main(args: { codeName: string, name: string }) {
  const permission = new Permission();
  permission.codeName = args.codeName;
  permission.name = args.name;

  await createConnection();

  try {
    console.log(
      await permission.save()
    );
  } catch (error) {
    console.log(error);
  } finally {
    await getConnection().close();
  }
  
}