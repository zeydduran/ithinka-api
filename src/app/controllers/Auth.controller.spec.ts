// std
import { notStrictEqual, ok, strictEqual } from 'assert';

// 3p
import {
  Context, createController, getHttpMethod, getPath,
  isHttpResponseCreated, isHttpResponseNoContent,
  isHttpResponseNotFound, isHttpResponseOK
} from '@foal/core';
import { createConnection, getConnection, getRepository } from 'typeorm';

// App
import { Auth, User } from '../entities';
import { AuthController } from './Auth.controller';

describe('AuthController', () => {

  let controller: AuthController;
  let Auth0: Auth;
  let Auth1: Auth;
  let Auth2: Auth;
  let user1: User;
  let user2: User;

  before(() => createConnection());

  after(() => getConnection().close());

  beforeEach(async () => {
    controller = createController(AuthController);

    const AuthRepository = getRepository(Auth);
    const userRepository = getRepository(User);

    await AuthRepository.clear();
    await userRepository.clear();

    [ user1, user2 ] = await userRepository.save([
      {},
      {},
    ]);

    [ Auth0, Auth1, Auth2 ] = await AuthRepository.save([
      {
        owner: user1,
        text: 'Auth 0',
      },
      {
        owner: user2,
        text: 'Auth 1',
      },
      {
        owner: user2,
        text: 'Auth 2',
      },
    ]);
  });

  describe('has a "findAuths" method that', () => {

    it('should handle requests at GET /.', () => {
      strictEqual(getHttpMethod(AuthController, 'findAuths'), 'GET');
      strictEqual(getPath(AuthController, 'findAuths'), undefined);
    });

    it('should return an HttpResponseOK object with the Auth list.', async () => {
      const ctx = new Context({ query: {} });
      ctx.user = user2;
      const response = await controller.findAuths(ctx);

      if (!isHttpResponseOK(response)) {
        throw new Error('The returned value should be an HttpResponseOK object.');
      }

      if (!Array.isArray(response.body)) {
        throw new Error('The response body should be an array of Auths.');
      }

      strictEqual(response.body.length, 2);
      ok(response.body.find(Auth => Auth.text === Auth1.text));
      ok(response.body.find(Auth => Auth.text === Auth2.text));
    });

    it('should support pagination', async () => {
      const Auth3 = await getRepository(Auth).save({
        owner: user2,
        text: 'Auth 3',
      });

      let ctx = new Context({
        query: {
          take: 2
        }
      });
      ctx.user = user2;
      let response = await controller.findAuths(ctx);

      strictEqual(response.body.length, 2);
      ok(response.body.find(Auth => Auth.id === Auth1.id));
      ok(response.body.find(Auth => Auth.id === Auth2.id));
      ok(!response.body.find(Auth => Auth.id === Auth3.id));

      ctx = new Context({
        query: {
          skip: 1
        }
      });
      ctx.user = user2;
      response = await controller.findAuths(ctx);

      strictEqual(response.body.length, 2);
      ok(!response.body.find(Auth => Auth.id === Auth1.id));
      ok(response.body.find(Auth => Auth.id === Auth2.id));
      ok(response.body.find(Auth => Auth.id === Auth3.id));
    });

  });

  describe('has a "findAuthById" method that', () => {

    it('should handle requests at GET /:AuthId.', () => {
      strictEqual(getHttpMethod(AuthController, 'findAuthById'), 'GET');
      strictEqual(getPath(AuthController, 'findAuthById'), '/:AuthId');
    });

    it('should return an HttpResponseOK object if the Auth was found.', async () => {
      const ctx = new Context({
        params: {
          AuthId: Auth2.id
        }
      });
      ctx.user = user2;
      const response = await controller.findAuthById(ctx);

      if (!isHttpResponseOK(response)) {
        throw new Error('The returned value should be an HttpResponseOK object.');
      }

      strictEqual(response.body.id, Auth2.id);
      strictEqual(response.body.text, Auth2.text);
    });

    it('should return an HttpResponseNotFound object if the Auth was not found.', async () => {
      const ctx = new Context({
        params: {
          AuthId: -1
        }
      });
      ctx.user = user2;
      const response = await controller.findAuthById(ctx);

      if (!isHttpResponseNotFound(response)) {
        throw new Error('The returned value should be an HttpResponseNotFound object.');
      }
    });

    it('should return an HttpResponseNotFound object if the Auth belongs to another user.', async () => {
      const ctx = new Context({
        params: {
          AuthId: Auth0.id
        }
      });
      ctx.user = user2;
      const response = await controller.findAuthById(ctx);

      if (!isHttpResponseNotFound(response)) {
        throw new Error('The returned value should be an HttpResponseNotFound object.');
      }
    });

  });

  describe('has a "createAuth" method that', () => {

    it('should handle requests at POST /.', () => {
      strictEqual(getHttpMethod(AuthController, 'createAuth'), 'POST');
      strictEqual(getPath(AuthController, 'createAuth'), undefined);
    });

    it('should create the Auth in the database and return it through '
        + 'an HttpResponseCreated object.', async () => {
      const ctx = new Context({
        body: {
          text: 'Auth 3',
        }
      });
      ctx.user = user2;
      const response = await controller.createAuth(ctx);

      if (!isHttpResponseCreated(response)) {
        throw new Error('The returned value should be an HttpResponseCreated object.');
      }

      const Auth = await getRepository(Auth).findOne({
        relations: [ 'owner' ],
        where: { text: 'Auth 3' },
      });

      if (!Auth) {
        throw new Error('No Auth 3 was found in the database.');
      }

      strictEqual(Auth.text, 'Auth 3');
      strictEqual(Auth.owner.id, user2.id);

      strictEqual(response.body.id, Auth.id);
      strictEqual(response.body.text, Auth.text);
    });

  });

  describe('has a "modifyAuth" method that', () => {

    it('should handle requests at PATCH /:AuthId.', () => {
      strictEqual(getHttpMethod(AuthController, 'modifyAuth'), 'PATCH');
      strictEqual(getPath(AuthController, 'modifyAuth'), '/:AuthId');
    });

    it('should update the Auth in the database and return it through an HttpResponseOK object.', async () => {
      const ctx = new Context({
        body: {
          text: 'Auth 2 (version 2)',
        },
        params: {
          AuthId: Auth2.id
        }
      });
      ctx.user = user2;
      const response = await controller.modifyAuth(ctx);

      if (!isHttpResponseOK(response)) {
        throw new Error('The returned value should be an HttpResponseOK object.');
      }

      const Auth = await getRepository(Auth).findOne(Auth2.id);

      if (!Auth) {
        throw new Error();
      }

      strictEqual(Auth.text, 'Auth 2 (version 2)');

      strictEqual(response.body.id, Auth.id);
      strictEqual(response.body.text, Auth.text);
    });

    it('should not update the other Auths.', async () => {
      const ctx = new Context({
        body: {
          text: 'Auth 2 (version 2)',
        },
        params: {
          AuthId: Auth2.id
        }
      });
      ctx.user = user2;
      await controller.modifyAuth(ctx);

      const Auth = await getRepository(Auth).findOne(Auth1.id);

      if (!Auth) {
        throw new Error();
      }

      notStrictEqual(Auth.text, 'Auth 2 (version 2)');
    });

    it('should return an HttpResponseNotFound if the object does not exist.', async () => {
      const ctx = new Context({
        body: {
          text: '',
        },
        params: {
          AuthId: -1
        }
      });
      ctx.user = user2;
      const response = await controller.modifyAuth(ctx);

      if (!isHttpResponseNotFound(response)) {
        throw new Error('The returned value should be an HttpResponseNotFound object.');
      }
    });

    it('should return an HttpResponseNotFound if the object belongs to another user.', async () => {
      const ctx = new Context({
        body: {
          text: '',
        },
        params: {
          AuthId: Auth0.id
        }
      });
      ctx.user = user2;
      const response = await controller.modifyAuth(ctx);

      if (!isHttpResponseNotFound(response)) {
        throw new Error('The returned value should be an HttpResponseNotFound object.');
      }
    });

  });

  describe('has a "replaceAuth" method that', () => {

    it('should handle requests at PUT /:AuthId.', () => {
      strictEqual(getHttpMethod(AuthController, 'replaceAuth'), 'PUT');
      strictEqual(getPath(AuthController, 'replaceAuth'), '/:AuthId');
    });

    it('should update the Auth in the database and return it through an HttpResponseOK object.', async () => {
      const ctx = new Context({
        body: {
          text: 'Auth 2 (version 2)',
        },
        params: {
          AuthId: Auth2.id
        }
      });
      ctx.user = user2;
      const response = await controller.replaceAuth(ctx);

      if (!isHttpResponseOK(response)) {
        throw new Error('The returned value should be an HttpResponseOK object.');
      }

      const Auth = await getRepository(Auth).findOne(Auth2.id);

      if (!Auth) {
        throw new Error();
      }

      strictEqual(Auth.text, 'Auth 2 (version 2)');

      strictEqual(response.body.id, Auth.id);
      strictEqual(response.body.text, Auth.text);
    });

    it('should not update the other Auths.', async () => {
      const ctx = new Context({
        body: {
          text: 'Auth 2 (version 2)',
        },
        params: {
          AuthId: Auth2.id
        }
      });
      ctx.user = user2;
      await controller.replaceAuth(ctx);

      const Auth = await getRepository(Auth).findOne(Auth1.id);

      if (!Auth) {
        throw new Error();
      }

      notStrictEqual(Auth.text, 'Auth 2 (version 2)');
    });

    it('should return an HttpResponseNotFound if the object does not exist.', async () => {
      const ctx = new Context({
        body: {
          text: '',
        },
        params: {
          AuthId: -1
        }
      });
      ctx.user = user2;
      const response = await controller.replaceAuth(ctx);

      if (!isHttpResponseNotFound(response)) {
        throw new Error('The returned value should be an HttpResponseNotFound object.');
      }
    });

    it('should return an HttpResponseNotFound if the object belongs to another user.', async () => {
      const ctx = new Context({
        body: {
          text: '',
        },
        params: {
          AuthId: Auth0.id
        }
      });
      ctx.user = user2;
      const response = await controller.replaceAuth(ctx);

      if (!isHttpResponseNotFound(response)) {
        throw new Error('The returned value should be an HttpResponseNotFound object.');
      }
    });

  });

  describe('has a "deleteAuth" method that', () => {

    it('should handle requests at DELETE /:AuthId.', () => {
      strictEqual(getHttpMethod(AuthController, 'deleteAuth'), 'DELETE');
      strictEqual(getPath(AuthController, 'deleteAuth'), '/:AuthId');
    });

    it('should delete the Auth and return an HttpResponseNoContent object.', async () => {
      const ctx = new Context({
        params: {
          AuthId: Auth2.id
        }
      });
      ctx.user = user2;
      const response = await controller.deleteAuth(ctx);

      if (!isHttpResponseNoContent(response)) {
        throw new Error('The returned value should be an HttpResponseNoContent object.');
      }

      const Auth = await getRepository(Auth).findOne(Auth2.id);

      strictEqual(Auth, undefined);
    });

    it('should not delete the other Auths.', async () => {
      const ctx = new Context({
        params: {
          AuthId: Auth2.id
        }
      });
      ctx.user = user2;
      const response = await controller.deleteAuth(ctx);

      if (!isHttpResponseNoContent(response)) {
        throw new Error('The returned value should be an HttpResponseNoContent object.');
      }

      const Auth = await getRepository(Auth).findOne(Auth1.id);

      notStrictEqual(Auth, undefined);
    });

    it('should return an HttpResponseNotFound if the Auth was not found.', async () => {
      const ctx = new Context({
        params: {
          AuthId: -1
        }
      });
      ctx.user = user2;
      const response = await controller.deleteAuth(ctx);

      if (!isHttpResponseNotFound(response)) {
        throw new Error('The returned value should be an HttpResponseNotFound object.');
      }
    });

    it('should return an HttpResponseNotFound if the Auth belongs to another user.', async () => {
      const ctx = new Context({
        params: {
          AuthId: Auth0.id
        }
      });
      ctx.user = user2;
      const response = await controller.deleteAuth(ctx);

      if (!isHttpResponseNotFound(response)) {
        throw new Error('The returned value should be an HttpResponseNotFound object.');
      }
    });

  });

});
