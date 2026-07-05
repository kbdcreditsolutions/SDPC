import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Book an appointment at Sridatri Physio Care. Reach our team for personalized physiotherapy consultations.",
};

export default function ContactPage() {
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
                { icon: "📍", label: "Location", value: "Flat 101, Narasimha Nilayam, 3-4-529/2, Narayanguda, Hyderabad, Telangana 500027" },
                { icon: "📞", label: "Phone", value: "+91 81432 38246 / +91 82477 31436" },
                { icon: "✉️", label: "Email", value: "care@sridatriwellness.com" },
                { icon: "🕐", label: "Hours", value: "All Days: 8am – 9pm" },
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

          {/* Client form */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
