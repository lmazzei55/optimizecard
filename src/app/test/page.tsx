"use client";
import { useState } from "react";
import { BarChart, Zap, Workflow, PieChart } from "lucide-react";

const cards = [
  {
    icon: <BarChart className="w-5 h-5 text-white" />, label: "Analytics", title: "Data Intelligence", desc: "Advanced analytics platform that processes complex data streams and provides actionable insights through machine learning algorithms.", stats: ["98% accuracy", "Real-time processing"], button: "Improve insights by 40%" },
  {
    icon: <Zap className="w-5 h-5 text-white" />, label: "Performance", title: "System Optimization", desc: "Intelligent performance monitoring that automatically optimizes system resources based on usage patterns and demand forecasting.", stats: ["24/7 monitoring", "Auto-scaling"], button: "Boost efficiency by 35%" },
  {
    icon: <Workflow className="w-5 h-5 text-white" />, label: "Automation", title: "Process Automation", desc: "Streamline workflows with intelligent automation. Connect systems, automate tasks, and create efficient operational processes.", stats: ["Zero downtime", "Smart workflows"], button: "Automate 90% of tasks" },
  {
    icon: <PieChart className="w-5 h-5 text-white" />, label: "Reporting", title: "Business Intelligence", desc: "Comprehensive reporting suite that transforms raw data into meaningful visualizations and actionable business insights.", stats: ["Custom dashboards", "Real-time updates"], button: "Enhanced reporting suite" },
];

const cardClass =
  "relative h-96 glass rounded-2xl shadow-2xl rotate-x-10 -rotate-y-20 transition-transform duration-500";

export default function TestPage() {
  const [active, setActive] = useState(3);

  // Card stack order/transform logic
  const getCardStyle = (idx: number) => {
    const order = ((idx - active + cards.length) % cards.length) + 1;
    const offset = -64 * (order - 1);
    const scale = 1 - 0.07 * (order - 1);
    const opacity = 1 - 0.15 * (order - 1);
    return {
      zIndex: 5 - order,
      transform: `translateX(${offset}px) scale(${scale})`,
      opacity,
      order: 5 - order,
    };
  };

  return (
    <div className="min-h-screen antialiased text-white bg-gray-950 pt-8 px-8 pb-8">
      <div className="max-w-5xl bg-white/5 border-white/5 border rounded-3xl mt-8 mx-auto pt-24 px-8 pb-24">
        <div className="flex items-center justify-between gap-8 flex-wrap">
          <div className="flex-1 max-w-lg pr-8">
            <div className="flex items-center gap-2 text-gray-400 mb-6">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="uppercase text-xs font-medium tracking-wide">EcoFlow Solutions</span>
            </div>
            <h1 className="text-4xl font-medium tracking-tighter mb-6">Technology Stack</h1>
            <p className="text-base text-gray-400 mb-8">Drag cards to explore our technology solutions and discover how we're building innovative platforms.</p>
            <div className="flex gap-3 mb-8">
              {cards.map((_, i) => (
                <button
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${active === i ? "bg-white scale-125" : "bg-gray-600 hover:bg-gray-300"}`}
                  onClick={() => setActive(i)}
                  aria-label={`Show card ${i + 1}`}
                />
              ))}
            </div>
            <div className="space-y-4 text-sm text-gray-400">
              <div className="flex items-center gap-3"><div className="w-2 h-2 bg-gray-300 rounded-full"></div><span>AI-powered analytics platform</span></div>
              <div className="flex items-center gap-3"><div className="w-2 h-2 bg-gray-300 rounded-full"></div><span>Real-time optimization engine</span></div>
              <div className="flex items-center gap-3"><div className="w-2 h-2 bg-gray-300 rounded-full"></div><span>Intelligent automation tools</span></div>
              <div className="flex items-center gap-3"><div className="w-2 h-2 bg-gray-300 rounded-full"></div><span>Comprehensive reporting suite</span></div>
            </div>
          </div>
          <section className="relative flex-1 flex justify-center items-center min-w-[26rem]" style={{ minWidth: 350 }}>
            <div className="relative w-full" style={{ width: 420, height: 400 }}>
              {cards.map((card, i) => (
                <article
                  key={i}
                  className={cardClass}
                  style={{ ...getCardStyle(i), position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
                  onClick={() => setActive(i)}
                  tabIndex={0}
                  aria-label={card.title}
                >
                  <div className="h-full flex flex-col p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-full bg-white/10 border border-white/20">{card.icon}</div>
                      <span className="text-xs uppercase tracking-wide text-gray-300 font-medium">{card.label}</span>
                    </div>
                    <h3 className="text-2xl font-semibold mb-4">{card.title}</h3>
                    <p className="text-gray-300 mb-6 flex-1">{card.desc}</p>
                    <div className="flex items-center gap-4 text-sm mb-6">
                      {card.stats.map((stat, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                          <span className="text-gray-400">{stat}</span>
                        </div>
                      ))}
                    </div>
                    <button className="w-full py-3 px-4 glass rounded-lg text-white hover:bg-white/10 transition-colors">
                      {card.button}
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <style jsx>{`
              .glass {
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
              }
              .rotate-x-10 {
                transform: rotateX(10deg);
              }
              .-rotate-y-20 {
                transform: rotateY(-20deg);
              }
            `}</style>
          </section>
        </div>
      </div>
    </div>
  );
} 