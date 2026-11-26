export interface RecurringItem {
  amount:number; currency:string; interval:string; intervalCount:number; quantity:number;
}
export function calculateRecurringRevenue(items: RecurringItem[]) {
  const mrrByCurrency: Record<string,number> = {};
  for (const i of items) {
    const factors: Record<string,number> = {day:365/12,week:52/12,month:1,year:1/12};
    const factor = factors[i.interval];
    if (!factor || !Number.isFinite(i.amount) || i.amount<0 || !Number.isInteger(i.intervalCount) || i.intervalCount<1 || !Number.isInteger(i.quantity) || i.quantity<1 || !/^[a-z]{3}$/.test(i.currency)) throw new Error("Invalid recurring price");
    mrrByCurrency[i.currency]=(mrrByCurrency[i.currency]||0)+i.amount*i.quantity*factor/i.intervalCount;
  }
  for(const c of Object.keys(mrrByCurrency)) mrrByCurrency[c]=Math.round(mrrByCurrency[c]);
  return {mrrByCurrency,arrByCurrency:Object.fromEntries(Object.entries(mrrByCurrency).map(([c,v])=>[c,v*12]))};
}
export function percent(n:number,d:number): number | null { return d>0 ? Math.round(n/d*1000)/10 : null; }
