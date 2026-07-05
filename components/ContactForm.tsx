"use client";

import { useState } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
        <div className="text-5xl">✅</div>
        <h3 className="text-xl font-bold text-slate-800">Thank you, {form.name}!</h3>
        <p className="text-gray-600">
          We have received your message and will contact you within 24 hours to confirm your appointment.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-slate-800">Book an Appointment</h2>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700" htmlFor="name">Full Name *</label>
        <input
          id="name" name="name" type="text" required value={form.name} onChange={handleChange}
          placeholder="Your full name"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700" htmlFor="email">Email Address *</label>
        <input
          id="email" name="email" type="email" required value={form.email} onChange={handleChange}
          placeholder="you@example.com"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700" htmlFor="phone">Phone Number</label>
        <input
          id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange}
          placeholder="+91 00000 00000"
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700" htmlFor="message">Message / Condition Details *</label>
        <textarea
          id="message" name="message" required rows={4} value={form.message} onChange={handleChange}
          placeholder="Briefly describe your condition or what you need help with..."
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
        />
      </div>

      <button type="submit" className="w-full py-3 bg-cyan-700 text-white font-semibold rounded-lg hover:bg-cyan-800 transition-colors">
        Send Message
      </button>
    </form>
  );
}
