"use client";
import { Check, Gift } from "lucide-react";
import { useDashboardLanguage } from "@/hooks/use-dashboard-language";
import { loyaltyProgress } from "@/lib/loyalty-progress";
export function MemberLoyaltyCard({attendance,rewards}:{attendance:{status:string;payment_status:string}[];rewards:{status:string}[]}) {
  const {language}=useDashboardLanguage();const ru=language==="ru";
  const {progress,availableRewards}=loyaltyProgress(attendance,rewards);
  return <section id="rewards" className="dashboard-card member-loyalty" lang={language} aria-labelledby="loyalty-heading">
    <div className="member-card-heading"><span className="dashboard-kicker">GSC member rewards</span><Gift aria-hidden="true"/></div>
    <h2 id="loyalty-heading">{ru?"Карта лояльности":"Your Loyalty Card"}</h2><p>{ru?"Посети 6 платных встреч и получи 7-ю бесплатно!":"Attend 6 paid meetups and get your 7th FREE!"}</p>
    <ol className="member-loyalty-visits" aria-label={ru?`Твой прогресс: ${progress} из 6 встреч`:`Your progress: ${progress} of 6 visits`}>{[1,2,3,4,5,6].map(visit=><li key={visit} className={visit<=progress?"complete":"upcoming"}><span>{visit<=progress?<Check aria-hidden="true"/>:visit}</span><small>{ru?`Встреча ${visit}`:`Visit ${visit}`}</small><span className="sr-only">{visit<=progress?(ru?"Завершено":"Completed"):(ru?"Впереди":"Upcoming")}</span></li>)}<li className={availableRewards?"reward unlocked":"reward"}><span><Gift aria-hidden="true"/></span><small>{ru?"Бесплатно":"FREE"}</small></li></ol>
    <p className="member-loyalty-counter">{ru?`Твой прогресс: ${progress} из 6 встреч`:`Your progress: ${progress} of 6 visits`}</p><p className="member-loyalty-note">{availableRewards?(ru?`Доступно бесплатных встреч: ${availableRewards}`:`Available free meetups: ${availableRewards}`):(ru?"Учитываются только оплаченные посещённые встречи. Пропуски, неоплаченные и бонусные встречи не учитываются.":"Only paid, attended meetups count. No-shows, unpaid visits, and reward visits do not advance this card.")}</p>
  </section>;
}
