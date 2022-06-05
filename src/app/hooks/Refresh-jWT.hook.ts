import { Hook, HookDecorator, HttpResponse, isHttpResponseServerError } from '@foal/core';
import { getSecretOrPrivateKey } from '@foal/jwt';
import { sign } from 'jsonwebtoken';

export function RefreshJWT(): HookDecorator {
  return Hook(ctx => {
    if (!ctx.user) {
      return;
    }

    return (response: HttpResponse) => {
      if (isHttpResponseServerError(response)) {
        return;
      }

      const newToken = sign(
        // The below object assumes that ctx.user is
        // the decoded payload (default behavior).
        {
          email: ctx.user.email,
          // id: ctx.user.id,
          // sub: ctx.user.subject,
        },
        getSecretOrPrivateKey(),
        { expiresIn: '15m' }
      );
      response.setHeader('Authorization', newToken);
    };

  });
}