"use client";
import { useState } from "react";
const requests = {
  access: "Прошу предоставить сведения об обработке моих персональных данных и порядке исправления неточностей.",
  deactivate: "Прошу приостановить использование моего аккаунта. Это запрос на деактивацию, а не автоматическое удаление записей.",
  withdraw: "Отзываю ранее предоставленное согласие на обработку персональных данных в той части, где обработка основана на согласии. Прошу сообщить, какие данные продолжают обрабатываться на другом законном основании.",
  erase: "Прошу рассмотреть прекращение обработки и удаление моих персональных данных, для которых отсутствует иное законное основание хранения. Прошу сообщить о результате и об основаниях сохранения остальных данных."
};
export function PrivacyRequestTool() {
  const [kind,setKind] = useState<keyof typeof requests>("access");
  const [copied,setCopied] = useState(false);
  return <section className="privacy-request-tool"><label htmlFor="privacy-kind">Тип запроса / Request type</label><select id="privacy-kind" value={kind} onChange={e=>{setKind(e.target.value as keyof typeof requests);setCopied(false);}}><option value="access">Доступ и исправление / Access and correction</option><option value="deactivate">Деактивация / Deactivation</option><option value="withdraw">Отзыв согласия / Withdraw consent</option><option value="erase">Удаление / Erasure</option></select><p lang="ru">{requests[kind]}</p><button type="button" onClick={async()=>{try {await navigator.clipboard.writeText(requests[kind]);setCopied(true);}catch{setCopied(false);}}}>Копировать / Copy</button><p role="status">{copied ? "Текст скопирован. Запрос ещё не отправлен. / Copied. Your request has not been sent." : "Текст создаётся на устройстве. Эта страница ничего не отправляет. / Generated locally. This page sends nothing."}</p></section>;
}
