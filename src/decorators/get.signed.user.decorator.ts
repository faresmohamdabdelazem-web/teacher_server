import { createParamDecorator } from '@nestjs/common';

export const GetSignedUser = createParamDecorator((data, req) => {
  return {
    id: req.args[0]['id'],
    role: req.args[0]['role'],
    email: req.args[0]['email'],
  };
});
