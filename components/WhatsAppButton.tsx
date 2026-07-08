import Link from "next/link";

export default function WhatsAppButton() {
  const phoneNumber = "918247731436";
  const message = encodeURIComponent("Hi Sridatri Physio Care! I would like to book an appointment or get more information.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      {/* Pulse ring animation behind the button */}
      <div className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping delay-300 duration-1000"></div>
      
      <Link 
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg group-hover:shadow-2xl group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300"
        aria-label="Chat with us on WhatsApp"
      >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="32"
        height="32"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c-.003 1.396.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c.003-3.625 2.952-6.575 6.577-6.575a6.59 6.59 0 0 1 4.646 1.929 6.58 6.58 0 0 1 1.926 4.643c-.004 3.627-2.95 6.574-6.575 6.574zm3.606-4.922c-.198-.099-1.17-.578-1.352-.644-.182-.066-.315-.099-.448.099-.133.198-.511.644-.627.776-.116.133-.233.149-.431.05-.198-.099-.834-.308-1.591-.983-.585-.522-.979-1.167-1.096-1.365-.116-.198-.012-.305.087-.403.089-.089.198-.232.297-.348.099-.116.132-.198.198-.33.066-.132.033-.248-.017-.347-.05-.099-.448-1.082-.613-1.481-.161-.389-.324-.336-.448-.342-.116-.005-.249-.005-.382-.005s-.35.05-.532.248c-.182.198-.696.678-.696 1.652s.713 1.916.812 2.048c.099.133 1.396 2.133 3.383 2.993.472.204.84.326 1.129.418.475.152.904.13 1.246.079.38-.057 1.17-.478 1.334-.94.165-.463.165-.857.116-.94-.05-.083-.183-.133-.381-.233z" />
      </svg>
    </Link>
    </div>
  );
}
