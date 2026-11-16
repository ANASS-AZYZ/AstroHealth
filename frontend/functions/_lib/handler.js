import { ApiError } from './workflows.js';
import { resolve, routes, execute, validate } from './routes.js';
import { database, cookieId, cookieHeader, createSession, load, transact, rateLimit } from './storage.js';
export async function handle(request,env) {
  const url=new URL(request.url);let setCookie;
  const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
  try {
    const route=resolve(request.method,url.pathname);
    if(!route) {
      const allowed=[...routes.keys()].filter(k=>k.endsWith(' '+url.pathname)||(/^\/api\/alerts\/[^/]+\/acknowledge$/.test(url.pathname)&&k.endsWith(' /api/alerts/{alert_id}/acknowledge'))).map(k=>k.split(' ')[0]);
      throw new ApiError(allowed.length?405:404,allowed.length?'Method Not Allowed':'Not Found',allowed.length?{Allow:allowed.join(', ')}:{});
    }
    if(request.method==='POST') {
      const origin=request.headers.get('Origin');
      if(origin&&origin!==url.origin)throw new ApiError(403,'Request origin is not allowed.');
      if(request.headers.get('Sec-Fetch-Site')==='cross-site')throw new ApiError(403,'Request origin is not allowed.');
    }
    let input;
    if(route.schema) {
      if(Number(request.headers.get('Content-Length')||0)>16384)throw new ApiError(413,'Request body too large.');
      // Read a bounded stream, rather than allocating an unbounded JSON body.
      const reader=request.body?.getReader();let size=0;const chunks=[];
      if(reader)for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>16384){await reader.cancel();throw new ApiError(413,'Request body too large.');}chunks.push(value);}
      const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
      try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{throw new ApiError(422,[{type:'json_invalid',loc:['body'],msg:'JSON decode error',input:null}]);}
    }
    const body=validate(route.schema,input);
    let result;
    if(route.public) result=execute(route,null,body,url);
    else {
      const db=database(env);
      if(request.method==='POST'||route.bucket)await rateLimit(db,request,route.bucket||'mutation');
      let id=cookieId(request);
      if(route.bootstrap) {
        if(!['true','false','1','0','yes','no','on','off',''].includes((url.searchParams.get('renew')||'').toLowerCase()))throw new ApiError(422,[{type:'bool_parsing',loc:['query','renew'],msg:'Input should be a valid boolean',input:url.searchParams.get('renew')}]);
        const row=await load(db,id), renew=['true','1','yes','on'].includes((url.searchParams.get('renew')||'').toLowerCase());
        if(renew||!row||row.expires_at<Math.floor(Date.now()/1000)){id=await createSession(db,request);setCookie=cookieHeader(id,request);}
      }else if(!id){id=await createSession(db,request);setCookie=cookieHeader(id,request);}
      result=await transact(db,id,s=>execute(route,s,body,url));
    }
    if(setCookie)headers['Set-Cookie']=setCookie;
    headers['Content-Type']=result.type||'application/json';
    if(result.filename)headers['Content-Disposition']=`attachment; filename="${result.filename}"`;
    return new Response(result.value instanceof Uint8Array?result.value:headers['Content-Type']==='application/json'?JSON.stringify(result.value):result.value,{headers});
  } catch(error) {
    const known=error instanceof ApiError;
    return new Response(JSON.stringify({detail:known?error.detail:'Durable backend temporarily unavailable.'}),{status:known?error.status:503,headers:{...headers,'Content-Type':'application/json',...(known?error.headers:{}),...(setCookie?{'Set-Cookie':setCookie}:{})}});
  }
}
