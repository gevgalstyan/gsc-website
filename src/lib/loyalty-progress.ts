/** Mirrors the existing display rule; rewards and qualification remain database-authoritative. */
export function isAvailableReward(reward: {status: string; expires_at?: string | null}, now = Date.now()) {
  return reward.status === "available" && (!reward.expires_at || new Date(reward.expires_at).getTime() > now);
}
export function loyaltyProgress(attendance: { status:string; payment_status:string }[], rewards:{status:string;expires_at?:string|null}[]) {
  const paidVisits=attendance.filter(row=>row.status==="attended"&&row.payment_status==="paid").length;
  const availableRewards=rewards.filter(row=>isAvailableReward(row)).length;
  return { paidVisits,availableRewards,progress:availableRewards?6:paidVisits%6 };
}
