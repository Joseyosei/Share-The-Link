export function discountedAmount(amount:number,percent:number){
 if(!Number.isInteger(amount)||amount<50||amount>1000000||!Number.isInteger(percent)||percent<0||percent>80)throw Error("Invalid price or discount");
 return Math.max(50,Math.round(amount*(100-percent)/100));
}
export function parseGBP(value:string){
 if(!/^\d{1,5}(\.\d{1,2})?$/.test(value.trim()))throw Error("Enter a valid GBP price");
 const [whole,fraction=""]=value.trim().split(".");
 const amount=Number(whole)*100+Number(fraction.padEnd(2,"0"));
 if(amount<50||amount>1000000)throw Error("Price must be £0.50–£10,000");
 return amount;
}
export function normalizeCode(value:unknown){return typeof value==="string"?value.trim().toUpperCase():"";}
export function validCode(code:string){return /^[A-Z0-9_-]{3,24}$/.test(code);}
export function gbp(amount:number){return new Intl.NumberFormat("en-GB",{style:"currency",currency:"GBP"}).format(amount/100);}
