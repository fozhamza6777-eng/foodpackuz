"use client";

import { useEffect } from "react";

/** Admin panelda ("CRM" bo'limi) kiritilgan amoCRM chat vidjeti skriptini
 *  butun saytga qo'shadi. Skript kiritilmagan bo'lsa hech narsa qilmaydi. */
export default function AmocrmChatWidget() {
  useEffect(() => {
    fetch("/api/crm/amocrm/widget-script")
      .then((res) => res.json())
      .then((data: { script: string | null }) => {
        if (!data?.script) return;
        const container = document.createElement("div");
        container.innerHTML = data.script;

        // innerHTML orqali kiritilgan <script> teglari avtomatik ishga
        // tushmaydi — shuning uchun ularni qo'lda qayta yaratamiz.
        container.querySelectorAll("script").forEach((oldScript) => {
          const newScript = document.createElement("script");
          Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value));
          newScript.text = oldScript.textContent ?? "";
          document.body.appendChild(newScript);
        });

        Array.from(container.childNodes).forEach((node) => {
          if (node.nodeName !== "SCRIPT") document.body.appendChild(node);
        });
      })
      .catch(() => {});
  }, []);

  return null;
}
