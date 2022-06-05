// std
import { ok, strictEqual } from 'assert';

// 3p
import { Context, createController, getHttpMethod, getPath, isHttpResponseOK } from '@foal/core';

// App
import { PermissionController } from './Permission.controller';

describe('PermissionController', () => {

  let controller: PermissionController;

  beforeEach(() => controller = createController(PermissionController));

  describe('has a "foo" method that', () => {

    it('should handle requests at GET /.', () => {
      strictEqual(getHttpMethod(PermissionController, 'foo'), 'GET');
      strictEqual(getPath(PermissionController, 'foo'), '/');
    });

    it('should return an HttpResponseOK.', () => {
      const ctx = new Context({});
      ok(isHttpResponseOK(controller.foo(ctx)));
    });

  });

});
