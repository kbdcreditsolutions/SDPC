"use client";

import type { Metadata } from "next";
import { useState } from "react";

// Note: metadata export won't work in client components — moved to a separate layout or use generateMetadata pattern.
// For this page we use client component for form state.

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-cyan-700 to-cyan-900 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-4">
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="text-cyan-100 text-lg">
            Ready to start your recovery? Reach out and our team will get back to
            you within 24 hours.
          </p>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="flex flex-col gap-6">
            <h2 className="text-2xl font-bold text-slate-800">Get in Touch</h2>
            <div className="flex flex-col gap-4">
              {[
                { icon: "📍", label: "Location", value: "Hyderabad, Telangana, India" },
                { icon: "📞", label: "Phone", value: "+91 98765 43210" },
                { icon: "✉️", label: "Email", value: "care@sridatriphysio.com" },
                { icon: "🕐", label: "Hours", value: "Mon–Sat: 9am – 7pm" },
              ].map((item) => (
                <div key={item.label} className="flex items-start gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                      {item.label}
                    </p>
                    <p className="text-slate-700">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Map placeholder */}
            <div className="w-full h-48 bg-cyan-50 rounded-2xl border border-cyan-100 flex items-center justify-center text-cyan-400 text-sm">
              📍 Map placeholder — embed Google Maps here
            </div>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            {submitted ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
                <div className="text-5xl">✅</div>
                <h3 className="text-xl font-bold text-slate-800">
                  Thank you, {form.name}!
                </h3>
                <p className="text-gray-600">
                  We have received your message and will contact you within 24
                  hours to confirm your appointment.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <h2 className="text-xl font-bold text-slate-800">Book an Appointment</h2>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="name">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="email">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="phone">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 00000 00000"
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700" htmlFor="message">
                    Message / Condition Details *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Briefly describe your condition or what you need help with..."
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-cyan-700 text-white font-semibold rounded-lg hover:bg-cyan-800 transition-colors"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
