export type Sentiment='positive'|'negative'|undefined;
export const nextSentiment=(s:Sentiment):Sentiment=>s===undefined?'positive':s==='positive'?'negative':undefined;
export const saveFeedback=(all:Record<string,Exclude<Sentiment,undefined>>,key:string,next:Sentiment)=>{const copy={...all};if(next)copy[key]=next;else delete copy[key];return copy};
