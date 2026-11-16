import { handle } from '../_lib/handler.js';

export function onRequest({ request, env }) {
  return handle(request, env);
}
