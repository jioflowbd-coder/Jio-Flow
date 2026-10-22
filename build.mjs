import {mkdir,rm,copyFile,cp} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});await mkdir('dist');
for(const file of ['online.html','online.js','online.css','online-client.mjs','index.html','styles.css','app.js','auth.js','insights.js','layout.js','workspaces.js','creator.js','refinements.js','bootstrap.js'])await copyFile(file,'dist/'+file);
await cp('assets','dist/assets',{recursive:true});console.log('Built JioFlow in dist/');
