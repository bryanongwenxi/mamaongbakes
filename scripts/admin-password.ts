import { randomBytes,scryptSync } from 'node:crypto';
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
let muted=false;
const output=new Writable({write(chunk,_encoding,callback){if(!muted)process.stdout.write(chunk);callback();}});
const rl=createInterface({input:process.stdin,output,terminal:true});
process.stdout.write('Choose a kitchen password (at least 12 characters; input is hidden): ');muted=true;
rl.question('',(password)=>{muted=false;rl.close();if(password.length<12){console.error('\nUse at least 12 characters.');process.exitCode=1;return;}const salt=randomBytes(16).toString('hex');console.log(`\nADMIN_PASSWORD_HASH=${salt}:${scryptSync(password,salt,64).toString('hex')}`);console.log(`SESSION_SECRET=${randomBytes(48).toString('hex')}`);console.log('Save these as server-only environment variables in Vercel.');});
