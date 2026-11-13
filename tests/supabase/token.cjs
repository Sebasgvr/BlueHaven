// JWT anon válido únicamente para el stack efímero de tests.
const crypto=require('node:crypto');
const enc=o=>Buffer.from(JSON.stringify(o)).toString('base64url');
const data=enc({alg:'HS256',typ:'JWT'})+'.'+enc({role:'anon',iss:'supabase',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+86400});
console.log(data+'.'+crypto.createHmac('sha256','bluehaven-local-test-secret-at-least-32-chars').update(data).digest('base64url'));
