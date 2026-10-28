// Synthetic read-only observation-window probe. No model, storage or private input.
const {runtime,hud}=require('./test_panel_tracking.cjs');const c=runtime(process.env.COMPANION_3_BASELINE).ctx,content=hud();
function message(id,data){return {id,role:'assistant',content,metadata:{rpg_companion:{swipes:{0:data},sources:{0:c.readingSource(content)}}}};}
const first=message('origin',{family:[{name:'Ancestor Vale',relation:'father',status:'alive'}],survival:{spells:['Waterball']},holdings:[{key:'workshop',name:'Workshop',kind:'business',state:'gained'}]});
function counts(chat){return {family:c.famRead(chat,{}).members.length,holdings:c.holdRead(chat,{}).items.length,spells:c.spellKnown(chat,{}).size};}
console.log(JSON.stringify({afterOne:counts([first]),after301:counts([first,...Array.from({length:300},(_,i)=>message('empty'+i,{}))]),note:'Inherited bounded report-reader window; raw observations are not deleted. Not an indefinite continuity guarantee.'}));
