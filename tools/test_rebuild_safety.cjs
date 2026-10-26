const {spawnSync}=require('node:child_process');
const path=require('node:path');
const result=spawnSync('python3',[path.join(__dirname,'test_rebuild_safety.py')],{stdio:'inherit',env:{...process.env,PYTHONDONTWRITEBYTECODE:'1'}});
if(result.error)throw result.error;
process.exitCode=result.status || 0;
