import { ApiInfo, ApiServer, Context, controller, Hook, HttpResponseNoContent, Options } from '@foal/core';
import { AuthController } from './Auth.controller';
import { GroupController } from './Group.controller';
import { OpenApiController } from './openapi.controller';
import { PermissionController } from './Permission.controller';
import { UserController } from './User.controller';

@Hook(() => response => {
  // Every response of this controller and its sub-controllers will be added this header.
  response.setHeader('Access-Control-Allow-Origin', '*');
})
@ApiInfo({
  title: 'A Great API',
  version: '1.0.0'
})
@ApiServer({
  url: '/api'
})
export class ApiController {

  subControllers = [
    controller('/user', UserController),
    controller('/auth', AuthController),
    controller('/permission', PermissionController),
    controller('/group', GroupController),
    controller('/swagger', OpenApiController),
  ];

  @Options('*')
  options(ctx: Context) {
    const response = new HttpResponseNoContent();
    response.setHeader('Access-Control-Allow-Methods', 'HEAD, GET, POST, PUT, PATCH, DELETE');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return response;
  }

  // Some other routes (ex: @Get('/users'), etc)

}