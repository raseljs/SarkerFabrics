"use client";

import { Banknote, CreditCard } from "lucide-react";
import type { PaymentMethod } from "@/lib/payment-gateways";
import styles from "./checkout-payment-options.module.css";

export function CheckoutPaymentOptions({ methods, selected, onSelect, email, onEmailChange, disabled }: {
  methods: PaymentMethod[]; selected: string; onSelect: (value: string) => void;
  email: string; onEmailChange: (value: string) => void; disabled?: boolean;
}) {
  const gateway = methods.find(method => method.id === selected);
  return <fieldset className={styles.options} disabled={disabled}>
    <legend>Payment Method</legend>
    <label className={`${styles.choice} ${selected === "cash_on_delivery" ? styles.selected : ""}`}>
      <input type="radio" name="payment-choice" value="cash_on_delivery" checked={selected === "cash_on_delivery"} onChange={() => onSelect("cash_on_delivery")} />
      <Banknote size={21} aria-hidden="true" />
      <span><strong>Cash on Delivery</strong><small>Pay when your order arrives</small></span>
    </label>
    {methods.map(method => <label key={method.id} className={`${styles.choice} ${selected === method.id ? styles.selected : ""}`}>
      <input type="radio" name="payment-choice" value={method.id} checked={selected === method.id} onChange={() => onSelect(method.id)} />
      <CreditCard size={21} aria-hidden="true" />
      <span><strong>{method.name}</strong><small>Secure online payment</small></span>
    </label>)}
    {gateway?.requiresEmail && <label className={styles.email}>
      Payment receipt email *
      <input type="email" name="payment-receipt-email" required autoComplete="email" maxLength={254} value={email} onChange={event => onEmailChange(event.target.value)} placeholder="you@email.com" />
      <small>{gateway.name} requires an email for the payment receipt.</small>
    </label>}
  </fieldset>;
}
