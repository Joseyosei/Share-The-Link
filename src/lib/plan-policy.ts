export const PLAN_POLICY = {
 free:{name:"Free",monthly:0,yearly:0,feeBps:800,products:3,ai:3,discounts:false},
 pro:{name:"Creator Pro",monthly:7,yearly:56,feeBps:200,products:30,ai:30,discounts:true},
 business:{name:"Business",monthly:17,yearly:136,feeBps:0,products:100,ai:100,discounts:true},
 enterprise:{name:"Enterprise",monthly:50,yearly:400,feeBps:0,products:100,ai:100,discounts:true}
} as const;
export type PlanTier=keyof typeof PLAN_POLICY;
export function isTier(value:unknown):value is PlanTier{return typeof value==="string"&&Object.prototype.hasOwnProperty.call(PLAN_POLICY,value);}
export function platformFee(amount:number,tier:PlanTier){if(!Number.isSafeInteger(amount)||amount<0)throw Error("Invalid amount");return Math.round(amount*PLAN_POLICY[tier].feeBps/10000);}
export function subscriptionAmount(tier:PlanTier,interval:"monthly"|"yearly"){return PLAN_POLICY[tier][interval]*100;}
export const LEGACY_PRICE_TIERS:Record<string,PlanTier>={"price_1SwbcFE2FuZ01nXUSQxTa1zF":"pro","price_1SwbdIE2FuZ01nXUnGw4a2Yn":"business","price_1SwbfRE2FuZ01nXU1UJvDqrO":"enterprise","price_1T7lpzE2FuZ01nXU2dHWg9mn":"business","price_1T7IcHE2FuZ01nXUub7JKnN3":"enterprise"};
export function identifyPaidTier(priceId:string,metadataTier:unknown):PlanTier|null{const tier=LEGACY_PRICE_TIERS[priceId]||(isTier(metadataTier)?metadataTier:null);return tier&&tier!=="free"?tier:null;}
