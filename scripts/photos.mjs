import fs from 'node:fs/promises';
const photos={sesame:'vfUezkxDRDqmUT5WReyEa3zOU.jpeg',sweetpotato:'asL1zscn4YnRbl20vd13vawkScg.jpeg',cheesesticks:'wItB5iObgsxGMbgVitK8SL8cpn8.jpeg',chives:'xZ37Q1gI8ghMt5N2MZPok1MTro.jpg',cabbage:'kuG9bfijJ9i6JQV1faYfv4czj3g.jpg'};
for(const [name,source] of Object.entries(photos)){const response=await fetch('https://framerusercontent.com/images/'+source);if(!response.ok)throw Error(source);await fs.writeFile('public/images/'+name+'.jpg',Buffer.from(await response.arrayBuffer()));}
