import { Context, Delete, Get, HttpResponseNoContent, HttpResponseOK, Post, Put, ValidateBody, ValidatePathParam } from '@foal/core';
import { JWTRequired } from '@foal/jwt';
import { fetchUserWithPermissions, Permission } from '@foal/typeorm';
import { getRepository } from 'typeorm';
import { User } from '../entities';
@JWTRequired({
  user: fetchUserWithPermissions(User)
}) 
export class PermissionController {

  @Get('/')
  async index(ctx: Context) {
    const permissions = await getRepository(Permission).find();
    return new HttpResponseOK(permissions);
  }

  @Post()
  @ValidateBody({
    additionalProperties: false,
    properties: {
      name: { type: 'string' },
      codeName: { type: 'string' },
    },
    required: ['codeName', 'name'],
    type: 'object',
  })
  async store(ctx: Context) {
    const permission = new Permission();
    permission.codeName = ctx.request.body.codeName;
    permission.name = ctx.request.body.name;
    await permission.save()
    return new HttpResponseOK({ permission });
  }
  @Put('/:id')
  @ValidatePathParam('id', { type: 'number' })
  @ValidateBody({
    additionalProperties: false,
    properties: {
      name: { type: 'string' },
      codeName: { type: 'string' },
    },
    required: ['codeName', 'name'],
    type: 'object',
  })
  async update(ctx: Context) {
    const permission = await getRepository(Permission).findOneOrFail({ id: ctx.request.params.id });
    permission.codeName = ctx.request.body.codeName;
    permission.name = ctx.request.body.name;
    await permission.save()


    return new HttpResponseOK({ permission });
  }
  @Get('/:id')
  @ValidatePathParam('id', { type: 'number' })
  async show(ctx: Context) {
    const permission = await getRepository(Permission).findOneOrFail({ id: ctx.request.params.id });
    return new HttpResponseOK(permission);
  }
  @Delete('/:id')
  @ValidatePathParam('id', { type: 'number' })
  async delete(ctx: Context) {
    const permission = await getRepository(Permission).findOneOrFail({ id: ctx.request.params.id });
    await permission.remove();
    return new HttpResponseNoContent();
  }
}
