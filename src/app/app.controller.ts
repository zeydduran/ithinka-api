import { Context, controller, Hook, HttpResponse, HttpResponseInternalServerError, HttpResponseNoContent, HttpResponseServerError, IAppController, Options } from '@foal/core';
import { createConnection } from 'typeorm';

import { ApiController } from './controllers';
@Hook(ctx => response => {
  response.setHeader('Access-Control-Allow-Origin', ctx.request.get('Origin') || '*');
  response.setHeader('Access-Control-Allow-Credentials', 'true');
})
export class AppController implements IAppController {
  subControllers = [
    controller('/api', ApiController),
  ];
  @Options('*')

  options(ctx: Context) {
    const response = new HttpResponseNoContent();
    response.setHeader('Access-Control-Allow-Methods', 'HEAD, GET, POST, PUT, PATCH, DELETE');
    // You may need to allow other headers depending on what you need.
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return response;
  }
  handleError(error: Error, ctx: Context): HttpResponse | Promise<HttpResponse> {

    return new HttpResponseInternalServerError({
      error,
      message: error.message,
      path: ctx.request.path,
    })
  }
  async init() {
    await createConnection();
  }

}
