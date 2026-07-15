export type StoredRecord={carId:string;decision:'like'|'dislike'|'maybe'|'watch'|'skip';feedback:Record<string,'positive'|'negative'>;at:number};
const request=async(path:string,init?:RequestInit)=>{const r=await fetch(path,{headers:{'content-type':'application/json'},...init});if(!r.ok)throw new Error('API недоступен');return r.json()};
export const getState=()=>request('/api/state') as Promise<{records:StoredRecord[];index:number}>;
export const saveDecision=(record:StoredRecord,index:number)=>request('/api/decisions',{method:'POST',body:JSON.stringify({...record,index})});
export const undoDecision=(carId:string,index:number)=>request('/api/undo',{method:'POST',body:JSON.stringify({carId,index})});
export const resetFeed=()=>request('/api/reset',{method:'POST'});
