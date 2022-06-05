import {
  ApiOperationDescription, ApiOperationId, ApiOperationSummary, ApiResponse,
  ApiUseTag, Context, Delete, Get, hashPassword, HttpResponseCreated,
  HttpResponseNoContent, HttpResponseNotFound, HttpResponseOK, HttpResponseUnauthorized, Patch, Post,
  Put, ValidateBody, ValidatePathParam, ValidateQueryParam, verifyPassword
} from '@foal/core';
import { getSecretOrPrivateKey } from '@foal/jwt';
import { Group } from '@foal/typeorm';
import { sign } from 'jsonwebtoken';

import { getRepository } from 'typeorm';
import { promisify } from 'util';

import { Auth, User } from '../entities';



@ApiUseTag('Auth')
export class AuthController {

  @Post('/register')
  @ApiOperationId('register')
  @ApiOperationSummary('Register')
  @ApiResponse(400, { description: 'Invalid Auth.' })
  @ApiResponse(201, { description: 'Auth successfully created. Returns the Auth.' })
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
  async register(ctx: Context) {
    const user = new User();
    user.password = await hashPassword(ctx.request.body.password);
    user.name = ctx.request.body.name;
    user.email = ctx.request.body.email;
    const userGroup = await getRepository(Group).findOne({ codeName: 'User' });
    if (userGroup) {
      user.groups = [userGroup];
    }
    await user.save();
    return new HttpResponseOK({
      token: await this.createJWT(user),
      user
    });
  }
  @Post()
  @ApiOperationId('login')
  @ValidateBody({
    additionalProperties: false,
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
    required: ['email', 'password'],
    type: 'object',
  })
  async login(ctx: Context) {
    const { email, password } = ctx.request.body;
    const user = await getRepository(User).findOneOrFail({ email: email }, { relations: ['groups', 'userPermissions'] });
    if (!await verifyPassword(password, user.password)) {
      return new HttpResponseUnauthorized();
    }
    return new HttpResponseOK({
      token: await this.createJWT(user),
      user
    });

  }
  private async createJWT(user: User): Promise<string> {
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      id: user.id,
    };

    return promisify(sign as any)(
      payload,
      getSecretOrPrivateKey(),
      { expiresIn: '1m' }
    );
  }
}
