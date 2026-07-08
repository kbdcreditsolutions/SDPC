import type { Metadata } from "next";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Book an appointment at Sridatri Physio Care. Reach our team for personalized physiotherapy consultations.",
};

const contactItems = [
  {
    Icon: MapPin,
    label: "Location",
    value: "Flat 101, Narasimha Nilayam, 3-4-529/2, Narayanguda, Hyderabad, Telangana 500027",
  },
  {
    Icon: Phone,
    label: "Phone",
    value: "+91 81432 38246 / +91 82477 31436",
  },
  {
    Icon: Mail,
    label: "Email",
    value: "care@sridatriwellness.com",
  },
  {
    Icon: Clock,
    label: "Hours",
    value: "All Days: 8am – 9pm",
  },
];

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-transparent pt-36 pb-24 px-4 relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center flex flex-col gap-6 relative z-10">
          <span className="inline-block mx-auto px-4 py-1.5 bg-teal-50 border border-teal-100 rounded-full text-xs font-bold uppercase tracking-widest text-teal-700 shadow-sm">
            Reach Out
          </span>
          <h1 className="text-5xl lg:text-6xl font-display font-bold text-teal-950 tracking-tight">Contact Us</h1>
          <p className="text-slate-600 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Ready to start your recovery? Reach out and our team will get back to
            you within 24 hours.
          </p>
        </div>
      </section>

      <section className="py-32 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="flex flex-col gap-6">
            <h2 className="text-3xl font-display font-bold text-teal-950">Get in Touch</h2>
            <div className="flex flex-col gap-4 mt-2">
              {contactItems.map((item) => (
                <div key={item.label} className="flex items-start gap-4 p-4 rounded-2xl bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                    <item.Icon className="w-5 h-5 text-teal-600" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      {item.label}
                    </p>
                    <p className="text-slate-700 font-medium">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Map Embed */}
            <div className="w-full h-64 rounded-3xl overflow-hidden border border-slate-100 shadow-sm mt-4">
              <iframe
                src="https://maps.google.com/maps?q=Flat%20101,%20Narasimha%20Nilayam,%203-4-529/2,%20Narayanguda,%20Hyderabad,%20Telangana%20500027&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* Client form */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] p-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
