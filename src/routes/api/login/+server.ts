import { json, type RequestHandler } from '@sveltejs/kit';
import { compare } from 'bcrypt-ts';
import { SignJWT } from 'jose';

import { connectDataBase, getJwtSecretKey } from '../../../lib/utils/index.server';
import UserConnected from '../../../models/user-list';

export const POST: RequestHandler = async ({ request }) => {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return json({ message: 'REQUEST_BODY_MUST_BE_VALID_JSON' }, { status: 400 });
  }

  if (
    typeof body !== 'object' ||
    body === null ||
    !('phone' in body) ||
    !('password' in body) ||
    typeof body.phone !== 'string' ||
    typeof body.password !== 'string' ||
    !body.phone.trim() ||
    !body.password
  ) {
    return json({ message: 'PHONE_AND_PASSWORD_REQUIRED' }, { status: 400 });
  }

  try {
    await connectDataBase();

    const user = await UserConnected.findOne({
      userId: body.phone.trim()
    });

    if (!user || !(await compare(body.password, user.password))) {
      console.log('USER', user);

      return json({ message: 'INVALID_CREDENTIALS' }, { status: 401 });
    }

    const secretKey = getJwtSecretKey();
    const token = await new SignJWT({ userId: user.userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .sign(secretKey);

    return json({
      message: 'LOGIN_SUCCESS',
      token,
      user: {
        userId: user.userId
      }
    });
  } catch (error: unknown) {
    return json({ message: 'SERVER_ERROR' }, { status: 500 });
  }
};
