// Dominios exactos: no se admiten subdominios ni direcciones que solo los contengan.
(() => {
  const dominios=['gmail.com','googlemail.com','hotmail.com','hotmail.es','hotmail.com.ar','outlook.com','outlook.es','outlook.com.ar','live.com','live.com.ar','live.com.mx','msn.com','yahoo.com','yahoo.es','yahoo.com.ar','yahoo.com.mx','ymail.com','rocketmail.com','icloud.com','me.com','mac.com','proton.me','protonmail.com','pm.me','aol.com','gmx.com','gmx.net','mail.com','zoho.com'];
  const ofensivas=['puto','puta','putos','putas','mierda','mierdas','carajo','carajos','cabron','cabrona','cabrones','boludo','boluda','boludos','boludas','pelotudo','pelotuda','pelotudos','pelotudas','pendejo','pendeja','pendejos','pendejas','gilipollas','maricon','maricones','hdp','hijodeputa','hijadeputa','conchadetumadre','forro','forra','forros','forras','imbecil','imbeciles','idiota','idiotas','estupido','estupida','estupidos','estupidas','fuck','fucker','fucking','shit','bitch','asshole'];
  const prohibidas=new Set(ofensivas);
  const normalizar=t=>t.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g,'').replace(/[013457@$!]/g,c=>({'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s','!':'i'}[c]));
  function contieneOfensas(texto){
    const palabras=String(texto||'').split(/[^\p{L}\p{N}@$!]+/u);
    const candidatos=palabras.flatMap(p=>[normalizar(p),normalizar(p.replace(/^\d+|\d+$/g,''))]);
    candidatos.push(normalizar(String(texto||'')).replace(/[^a-z]/g,''));
    return candidatos.some(t=>prohibidas.has(t));
  }
  function validarEmail(valor){
    const email=String(valor||'').trim().toLowerCase();
    if(email.length>254||!/^[a-z0-9!#$%&'*+\-/=?^_`{|}~]+(?:\.[a-z0-9!#$%&'*+\-/=?^_`{|}~]+)*@[a-z0-9.-]+$/.test(email)||email.split('@')[0].length>64)throw new Error('Ingresá un email válido.');
    const [nombre,dominio]=email.split('@');
    if(!dominios.includes(dominio))throw new Error('Ese proveedor no está permitido. Usá Gmail, Hotmail, Outlook u otro de la lista.');
    if(contieneOfensas(nombre))throw new Error('El correo contiene palabras no permitidas. Usá otra dirección.');
    return email;
  }
  function validarNombre(valor){
    const nombre=String(valor||'').trim();
    if(!nombre||nombre.length>50)throw new Error('El nombre debe tener entre 1 y 50 caracteres.');
    if(contieneOfensas(nombre))throw new Error('Elegí un nombre sin palabras ofensivas.');
    return nombre;
  }
  window.FiltrosCuentas=Object.freeze({dominios:Object.freeze(dominios),ofensivas:Object.freeze(ofensivas),contieneOfensas,validarEmail,validarNombre});
})();
