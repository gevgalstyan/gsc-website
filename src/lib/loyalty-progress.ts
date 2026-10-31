/** Mirrors the existing display rule; rewards and qualification remain database-authoritative. */
export function loyaltyProgress(attendance: { status:string; payment_status:string }[], rewards:{status:string}[]) {
  const paidVisits=attendance.filter(row=>row.status==="attended"&&row.payment_status==="paid").length;
  const availableRewards=rewards.filter(row=>row.status==="available").length;
  return { paidVisits,availableRewards,progress:availableRewards?6:paidVisits%6 };
}
