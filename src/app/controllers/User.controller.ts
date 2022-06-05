import { Context, Delete, Get, hashPassword, HttpResponseCreated, HttpResponseNoContent, HttpResponseOK, Post, Put, ValidateBody, ValidatePathParam } from '@foal/core';
import { JWTRequired } from '@foal/jwt';
import { fetchUserWithPermissions, PermissionRequired } from '@foal/typeorm';
import { getRepository } from 'typeorm';
import { User } from '../entities';
import { RefreshJWT } from '../hooks';

@JWTRequired({
  user: fetchUserWithPermissions(User)
})
@RefreshJWT()
export class UserController {

  @Get('/')
  async index(ctx: Context) {
    const users = await getRepository(User).find({ relations: ["userPermissions", "groups"] });
    return new HttpResponseOK(users);
  }
  @Post()
  @ValidateBody({
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      password: { type: 'string' },
    },
    required: ['email', 'password', 'name'],
    type: 'object',
  })
  @PermissionRequired('create-users')
  async store(ctx: Context) {
    const user = await getRepository(User).save({
      password: await hashPassword(ctx.request.body.password),
      name: ctx.request.body.name,
      email: ctx.request.body.email
    });
    return new HttpResponseOK({ user });
  }
  @Put('/:id')
  @ValidatePathParam('id', { type: 'number' })
  @ValidateBody({
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      password: { type: 'string' },
    },
    required: ['email', 'name'],
    type: 'object',
  })
  @PermissionRequired('update-users')
  async update(ctx: Context) {
    const user = await getRepository(User).findOneOrFail({ id: ctx.request.params.id });
    if (ctx.request.body.password) {
      user.password = await hashPassword(ctx.request.body.password);
    }
    user.name = ctx.request.body.name;
    user.email = ctx.request.body.email;

    await user.save();
    return new HttpResponseCreated(user);
  }

  @Get('/:id')
  @ValidatePathParam('id', { type: 'number' })
  @PermissionRequired('view-users')
  async show(ctx: Context) {
    const user = await getRepository(User).findOneOrFail({ id: ctx.request.params.id }, { relations: ['userPermissions', 'groups'] });
    return new HttpResponseOK(user);
  }

  @Delete('/:id')
  @PermissionRequired('delete-users')
  @ValidatePathParam('id', { type: 'number' })
  async delete(ctx: Context) {
    const user = await getRepository(User).findOneOrFail({ id: ctx.request.params.id });
    await user.remove();
    return new HttpResponseNoContent();
  }

}
