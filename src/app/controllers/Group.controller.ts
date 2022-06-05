import { Context, Delete, Get, HttpResponseNoContent, HttpResponseOK, Post, Put, ValidateBody, ValidatePathParam } from '@foal/core';
import { JWTRequired } from '@foal/jwt';
import { fetchUserWithPermissions, Group, Permission } from '@foal/typeorm';
import { getRepository } from 'typeorm';
import { User } from '../entities';

@JWTRequired({
  user: fetchUserWithPermissions(User)
})
export class GroupController {
  @Get('/')
  async index(ctx: Context) {
    const groups = await getRepository(Group).find();
    return new HttpResponseOK({ groups });
  }
  @Post()
  @ValidateBody({
    additionalProperties: false,
    properties: {
      name: { type: 'string' },
      codeName: { type: 'string' },
      permission: { type: 'array' }
    },
    required: ['codeName', 'name'],
    type: 'object',
  })
  async store(ctx: Context) {
    const perms = await getRepository(Permission).findByIds(ctx.request.body.permission);
    const group = new Group();
    group.codeName = ctx.request.body.codeName;
    group.name = ctx.request.body.name;
    group.permissions = perms;
    await group.save();
    return new HttpResponseOK({ group });
  }
  @Put('/:id')
  @ValidatePathParam('id', { type: 'number' })
  @ValidateBody({
    additionalProperties: false,
    properties: {
      name: { type: 'string' },
      codeName: { type: 'string' },
      permission: { type: 'array' }
    },
    
    required: ['codeName', 'name'],
    type: 'object',
  })
  async update(ctx: Context) {

    const perms = await getRepository(Permission).findByIds(ctx.request.body.permission);
    const group = await getRepository(Group).findOneOrFail({ id: ctx.request.params.id });;
    group.codeName = ctx.request.body.codeName;
    group.name = ctx.request.body.name;
    group.permissions = perms;
    await group.save();
    return new HttpResponseOK({ group });
  }

  @Get('/:id')
  @ValidatePathParam('id', { type: 'number' })
  async show(ctx: Context<User>) {
    const group = await getRepository(Group).findOneOrFail({ where: { id: ctx.request.params.id }, relations: ['permissions'] });

    console.log(ctx.user);
    
    return new HttpResponseOK({ group });
  }
  @Delete('/:id')
  @ValidatePathParam('id', { type: 'number' })
  async delete(ctx: Context<User>) {
    const group = await getRepository(Group).findOneOrFail({ where: { id: ctx.request.params.id }, relations: ['permissions'] });
    await group.remove();
    return new HttpResponseNoContent();
  }

}
