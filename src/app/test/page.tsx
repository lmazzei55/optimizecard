"use client";
import { useState, useRef } from "react";
import { CreditCard, Wifi, User } from "lucide-react";

const cardData = [
  {
    name: "Platinum Rewards",
    number: "**** **** **** 1234",
    holder: "ALEXANDRA DOE",
    expiry: "12/27",
    network: "Mastercard",
    color: "from-blue-500 to-indigo-700",
    cashback: "$412/year cashback",
    benefits: [
      "5% cashback on groceries",
      "2% on gas & dining",
      "No foreign transaction fees",
      "Cell phone protection",
    ],
  },
  {
    name: "Travel Elite",
    number: "**** **** **** 5678",
    holder: "JORDAN SMITH",
    expiry: "09/26",
    network: "Visa",
    color: "from-purple-500 to-pink-500",
    cashback: "$1,120/year travel value",
    benefits: [
      "3x points on travel & dining",
      "$300 annual travel credit",
      "Airport lounge access",
      "Trip cancellation insurance",
    ],
  },
  {
    name: "Cashback Plus",
    number: "**** **** **** 9012",
    holder: "MORGAN LEE",
    expiry: "03/29",
    network: "Mastercard",
    color: "from-green-500 to-emerald-700",
    cashback: "$320/year cashback",
    benefits: [
      "2% cashback everywhere",
      "No annual fee",
      "Extended warranty protection",
      "Purchase protection",
    ],
  },
  {
    name: "Signature Gold",
    number: "**** **** **** 3456",
    holder: "TAYLOR BROWN",
    expiry: "07/28",
    network: "Visa",
    color: "from-yellow-400 to-amber-600",
    cashback: "$650/year value",
    benefits: [
      "4% cashback on dining",
      "2% on groceries",
      "Concierge service",
      "Travel accident insurance",
    ],
  },
];

const CARD_WIDTH = 340;
const CARD_HEIGHT = 210;

function GlassHeader() {
  return (
    <header className="fixed top-0 left-0 w-full z-30 flex items-center justify-between px-10 py-4 glass-header border-b border-white/10 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <span className="text-2xl font-bold tracking-tight text-white drop-shadow">CardAdvisor</span>
        <span className="ml-3 px-3 py-1 rounded-full bg-white/10 text-xs text-white/80 font-semibold tracking-wider border border-white/10">Demo</span>
      </div>
      <div className="flex items-center gap-4">
        <a href="/" className="text-white/80 hover:text-white font-medium transition">Home</a>
        <a href="/dashboard" className="text-white/80 hover:text-white font-medium transition">Dashboard</a>
        <button className="ml-4 p-2 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition">
          <User className="w-6 h-6 text-white" />
        </button>
      </div>
      <style jsx>{`
        .glass-header {
          background: rgba(30, 41, 59, 0.65);
        }
      `}</style>
    </header>
  );
}

function GlassFooter() {
  return (
    <footer className="w-full py-6 mt-16 glass-footer border-t border-white/10 backdrop-blur-lg flex flex-col items-center text-center">
      <div className="text-white/70 text-sm mb-2">&copy; {new Date().getFullYear()} CardAdvisor. All rights reserved.</div>
      <div className="flex gap-4 text-white/60 text-xs">
        <a href="/privacy" className="hover:text-white/90 transition">Privacy Policy</a>
        <a href="/terms" className="hover:text-white/90 transition">Terms of Service</a>
      </div>
      <style jsx>{`
        .glass-footer {
          background: rgba(30, 41, 59, 0.65);
        }
      `}</style>
    </footer>
  );
}

export default function TestPage() {
  const [active, setActive] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const dragging = useRef(false);

  // Card stack order/transform logic
  const getCardStyle = (idx: number) => {
    const order = ((idx - active + cardData.length) % cardData.length) + 1;
    const offset = -40 * (order - 1);
    const scale = 1 - 0.08 * (order - 1);
    const opacity = 1 - 0.18 * (order - 1);
    return {
      zIndex: 5 - order,
      transform: `translateX(${offset}px) scale(${scale})`,
      opacity,
      order: 5 - order,
      boxShadow: order === 1 ? "0 8px 32px 0 rgba(31, 38, 135, 0.37)" : undefined,
      cursor: order === 1 ? "grab" : "pointer",
    };
  };

  // Drag logic
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    dragging.current = true;
    dragStartX.current = "touches" in e ? e.touches[0].clientX : e.clientX;
  };
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging.current || dragStartX.current === null) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const diff = clientX - dragStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) {
        setActive((prev) => (prev + 1) % cardData.length);
      } else {
        setActive((prev) => (prev - 1 + cardData.length) % cardData.length);
      }
      dragging.current = false;
      dragStartX.current = null;
    }
  };
  const handleDragEnd = () => {
    dragging.current = false;
    dragStartX.current = null;
  };

  const card = cardData[active];

  return (
    <div className="min-h-screen antialiased text-white bg-gray-950 flex flex-col">
      <GlassHeader />
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-12">
        <div className="max-w-5xl w-full bg-white/5 border-white/5 border rounded-3xl mt-8 mx-auto pt-24 px-8 pb-24 relative">
          <div className="flex items-center justify-between gap-8 flex-wrap">
            {/* Dynamic left panel */}
            <div className="flex-1 max-w-lg pr-8">
              <div className="flex items-center gap-2 text-gray-400 mb-6">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="uppercase text-xs font-medium tracking-wide">Credit Card Demo</span>
              </div>
              <h1 className="text-4xl font-medium tracking-tighter mb-6">{card.name}</h1>
              <p className="text-base text-gray-400 mb-4">{card.cashback} — {card.network}</p>
              <ul className="mb-6 space-y-2 text-gray-300 text-base">
                {card.benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-gray-300 rounded-full inline-block"></span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <button className="mt-2 px-5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors">Customize</button>
              <div className="flex gap-3 mt-8">
                {cardData.map((_, i) => (
                  <button
                    key={i}
                    className={`w-3 h-3 rounded-full transition-all border-2 border-gray-600 ${active === i ? "bg-white border-white scale-125" : "bg-gray-700 hover:bg-gray-400"}`}
                    onClick={() => setActive(i)}
                    aria-label={`Show card ${i + 1}`}
                  />
                ))}
              </div>
            </div>
            {/* Card stack */}
            <section className="relative flex-1 flex flex-col items-center justify-center min-w-[26rem]" style={{ minWidth: 350 }}>
              {/* Dynamic badge above card */}
              <div className="mb-4">
                <span className="inline-block px-4 py-1 rounded-full bg-gradient-to-r from-blue-600/80 to-indigo-500/80 text-white font-semibold text-sm shadow-lg border border-white/10 tracking-wide">
                  #{active + 1} Recommendation
                </span>
              </div>
              <div
                className="relative w-full flex items-center justify-center"
                style={{ width: CARD_WIDTH + 40, height: CARD_HEIGHT + 40 }}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
              >
                {cardData.map((card, i) => (
                  <article
                    key={i}
                    className="glass credit-card transition-transform duration-500"
                    style={{
                      ...getCardStyle(i),
                      position: "absolute",
                      top: 20,
                      left: 20,
                      width: CARD_WIDTH,
                      height: CARD_HEIGHT,
                      borderRadius: 24,
                    }}
                    tabIndex={0}
                    aria-label={card.name}
                    onClick={() => setActive(i)}
                  >
                    <div className={`h-full w-full flex flex-col justify-between p-6 bg-gradient-to-br ${card.color} rounded-2xl relative overflow-hidden`}>
                      {/* Card chip and contactless */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-8 h-8 text-yellow-200/80 drop-shadow" />
                          <Wifi className="w-5 h-5 text-white/60" />
                        </div>
                        <span className="text-xs uppercase tracking-widest text-white/70 font-semibold">{card.network}</span>
                      </div>
                      {/* Card name */}
                      <div className="mb-2">
                        <h3 className="text-xl font-bold tracking-wide text-white drop-shadow-lg">{card.name}</h3>
                      </div>
                      {/* Card number */}
                      <div className="mb-2">
                        <span className="text-lg font-mono tracking-widest text-white/90 drop-shadow">{card.number}</span>
                      </div>
                      {/* Cardholder and expiry */}
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <div className="text-xs text-white/60">Cardholder</div>
                          <div className="text-sm font-semibold tracking-wider text-white/90">{card.holder}</div>
                        </div>
                        <div>
                          <div className="text-xs text-white/60">Expires</div>
                          <div className="text-sm font-semibold tracking-wider text-white/90">{card.expiry}</div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <style jsx>{`
                .glass {
                  background: rgba(255, 255, 255, 0.10);
                  backdrop-filter: blur(18px);
                  border: 1.5px solid rgba(255, 255, 255, 0.13);
                  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.17);
                  transition: box-shadow 0.3s, transform 0.3s;
                }
                .credit-card {
                  aspect-ratio: 16/10;
                  min-width: 320px;
                  max-width: 380px;
                  min-height: 180px;
                  max-height: 240px;
                  border-radius: 24px;
                }
              `}</style>
            </section>
          </div>
        </div>
      </main>
      <GlassFooter />
    </div>
  );
} 