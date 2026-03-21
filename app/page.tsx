// "use client"

// import { useEffect } from "react"
// import { useRouter } from "next/navigation"
// import { createClient } from "@/lib/supabase/client"

// import { Navbar } from "@/components/navbar"
// import { Footer } from "@/components/footer"
// import { Button } from "@/components/ui/button"
// import Link from "next/link"
// import {
//   ArrowRight,
//   Mic,
//   MessageSquare,
//   Target,
//   TrendingUp,
//   Users,
//   Zap,
// } from "lucide-react"

// const features = [
//   {
//     icon: MessageSquare,
//     title: "AI Sales Coach",
//     description:
//       "Practice real sales conversations with our intelligent AI that adapts to your responses.",
//   },
//   {
//     icon: Mic,
//     title: "Voice Training",
//     description:
//       "Improve your pitch delivery with voice-enabled practice sessions and real-time feedback.",
//   },
//   {
//     icon: Target,
//     title: "Objection Handling",
//     description:
//       "Master common objections with scenario-based training and expert responses.",
//   },
//   {
//     icon: TrendingUp,
//     title: "Progress Tracking",
//     description:
//       "Monitor your improvement with detailed analytics and performance metrics.",
//   },
// ]

// const stats = [
//   { value: "10x", label: "Faster Learning" },
//   { value: "500+", label: "Sales Scenarios" },
//   { value: "98%", label: "Satisfaction Rate" },
//   { value: "24/7", label: "AI Availability" },
// ]

// export default function HomePage() {
//   const router = useRouter()
//   const supabase = createClient()

//   // 🔥 ONLY FIX: remove ?code=xxxx from URL
//   useEffect(() => {
//     const cleanOAuthCode = async () => {
//       const { data } = await supabase.auth.getSession()
//       if (data.session) {
//         router.replace("/")
//       }
//     }
//     cleanOAuthCode()
//   }, [router, supabase])

//   return (
//     <div className="min-h-screen">
//       <Navbar />

//       {/* Hero Section */}
//       <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
//         <div className="absolute inset-0 -z-10">
//           <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-primary/5 blur-3xl" />
//         </div>

//         <div className="mx-auto max-w-7xl px-4 lg:px-8">
//           <div className="mx-auto max-w-3xl text-center">
//             <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
//               <Zap className="h-4 w-4" />
//               AI-Powered Sales Training
//             </div>
//             <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl">
//               AI Sales Learning <span className="text-gradient">Made Simple</span>
//             </h1>
//             <p className="mt-6 text-lg text-muted-foreground text-pretty leading-relaxed">
//               Transform your sales skills with personalized AI coaching. Practice pitches, handle objections, and get
//               instant feedback—all in one powerful platform.
//             </p>
//             <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
//               <Button size="lg" asChild className="glow-cyan group">
//                 <Link href="/auth/signup">
//                   Start Learning
//                   <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
//                 </Link>
//               </Button>
//               <Button size="lg" variant="outline" asChild>
//                 <Link href="/contact">Give Feedback</Link>
//               </Button>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Stats */}
//       <section className="border-y border-border/50 bg-card/30 py-12">
//         <div className="mx-auto max-w-7xl px-4 lg:px-8">
//           <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
//             {stats.map((stat) => (
//               <div key={stat.label} className="text-center">
//                 <div className="text-3xl font-bold text-primary lg:text-4xl">
//                   {stat.value}
//                 </div>
//                 <div className="mt-1 text-sm text-muted-foreground">
//                   {stat.label}
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* Features */}
//       <section className="py-20 lg:py-32">
//         <div className="mx-auto max-w-7xl px-4 lg:px-8">
//           <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
//             {features.map((feature) => (
//               <div
//                 key={feature.title}
//                 className="group rounded-xl border border-border/50 bg-card/50 p-6 transition-all hover:border-primary/50 hover:bg-card"
//               >
//                 <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
//                   <feature.icon className="h-6 w-6 text-primary" />
//                 </div>
//                 <h3 className="mb-2 font-semibold">{feature.title}</h3>
//                 <p className="text-sm text-muted-foreground">
//                   {feature.description}
//                 </p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </section>

//       <Footer />
//     </div>
//   )
// }




// "use client";

// import { Navbar } from "@/components/navbar";
// import { Footer } from "@/components/footer";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import { motion } from "framer-motion";
// import { ArrowRight, Mic, MessageSquare, Target, TrendingUp } from "lucide-react";
// import type { LucideIcon } from "lucide-react";

// /* ---------------- TYPES ---------------- */

// type Feature = {
//   icon: LucideIcon;
//   title: string;
//   description: string;
// };

// type Stat = {
//   value: string;
//   label: string;
// };

// type Pricing = {
//   name: string;
//   price: string;
//   highlight?: boolean;
//   features: string[];
// };

// /* ---------------- DATA ---------------- */

// const features: Feature[] = [
//   {
//     icon: MessageSquare,
//     title: "AI Sales Coach",
//     description: "Practice real sales conversations with intelligent AI customers.",
//   },
//   {
//     icon: Mic,
//     title: "Voice Pitch Training",
//     description: "Improve your pitch delivery with voice-enabled AI practice.",
//   },
//   {
//     icon: Target,
//     title: "Objection Handling",
//     description: "Master difficult objections with scenario-based training.",
//   },
//   {
//     icon: TrendingUp,
//     title: "Sales Analytics",
//     description: "Track improvement with detailed performance insights.",
//   },
// ];

// const stats: Stat[] = [
//   { value: "10x", label: "Faster Learning" },
//   { value: "500+", label: "Sales Scenarios" },
//   { value: "98%", label: "Success Rate" },
//   { value: "24/7", label: "AI Coach" },
// ];

// const pricing: Pricing[] = [
//   {
//     name: "Starter",
//     price: "$19",
//     highlight: false,
//     features: ["AI Sales Coach", "Basic Analytics", "100 simulations"],
//   },
//   {
//     name: "Pro",
//     price: "$49",
//     highlight: true,
//     features: ["Voice AI Training", "Advanced Analytics", "Unlimited simulations"],
//   },
//   {
//     name: "Team",
//     price: "$99",
//     highlight: false,
//     features: ["Team Dashboard", "Performance Reports", "Priority AI"],
//   },
// ];

// /* ---------------- PAGE ---------------- */

// export default function HomePage() {
//   return (
//     <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
//       <Navbar />

//       {/* HERO */}
//       <section className="pt-32 pb-24">
//         <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">

//           <motion.div
//             initial={{ opacity: 0, y: 40 }}
//             animate={{ opacity: 1, y: 0 }}
//           >
//             <h1 className="text-6xl font-bold leading-tight">
//               The AI Sales Trainer
//               <span className="block bg-gradient-to-r from-cyan-400 to-purple-500 text-transparent bg-clip-text">
//                 Every Team Needs
//               </span>
//             </h1>

//             <p className="mt-6 text-lg text-muted-foreground">
//               Practice real sales conversations, handle objections, and improve
//               your pitch using AI-powered simulations.
//             </p>

//             <div className="mt-8 flex gap-4">
//               <Button size="lg" asChild>
//                 <Link href="/auth/signup">
//                   Try AI Demo
//                   <ArrowRight className="ml-2 h-4 w-4" />
//                 </Link>
//               </Button>

//               <Button size="lg" variant="outline" asChild>
//                 <Link href="/contact">Book Demo</Link>
//               </Button>
//             </div>
//           </motion.div>

//           {/* AI DEMO */}

//           <motion.div
//             initial={{ opacity: 0, scale: 0.9 }}
//             animate={{ opacity: 1, scale: 1 }}
//             className="rounded-xl border bg-white/5 backdrop-blur-xl p-6 shadow-2xl"
//           >
//             <div className="text-sm text-muted-foreground mb-4">
//               AI Sales Simulation
//             </div>

//             <div className="space-y-3 text-sm">

//               <div className="bg-muted p-3 rounded-lg">
//                 <b>Customer:</b> Your product seems expensive.
//               </div>

//               <div className="bg-primary/10 p-3 rounded-lg">
//                 <b>You:</b> Actually it helps companies increase revenue by 40%.
//               </div>

//               <div className="bg-green-500/10 p-3 rounded-lg">
//                 <b>AI Coach:</b> Great response! Mention ROI earlier.
//               </div>

//             </div>

//             <Button className="mt-5 w-full">
//               Analyze with AI
//             </Button>
//           </motion.div>

//         </div>
//       </section>

//       {/* FEATURES */}

//       <section className="py-24 border-y border-border/50">
//         <div className="max-w-7xl mx-auto px-4">

//           <div className="text-center mb-16">
//             <h2 className="text-3xl font-bold">
//               Powerful AI Tools for Sales
//             </h2>
//           </div>

//           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">

//             {features.map((feature: Feature) => {
//               const Icon = feature.icon;

//               return (
//                 <motion.div
//                   key={feature.title}
//                   whileHover={{ scale: 1.08 }}
//                   className="p-6 rounded-xl bg-white/5 backdrop-blur-lg border shadow-xl"
//                 >
//                   <Icon className="h-8 w-8 text-primary mb-4" />

//                   <h3 className="font-semibold text-lg">
//                     {feature.title}
//                   </h3>

//                   <p className="text-sm text-muted-foreground mt-2">
//                     {feature.description}
//                   </p>
//                 </motion.div>
//               );
//             })}

//           </div>
//         </div>
//       </section>

//       {/* STATS */}

//       <section className="py-20">
//         <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">

//           {stats.map((stat: Stat) => (
//             <motion.div
//               key={stat.label}
//               initial={{ opacity: 0, y: 20 }}
//               whileInView={{ opacity: 1, y: 0 }}
//             >
//               <div className="text-5xl font-bold text-primary">
//                 {stat.value}
//               </div>

//               <div className="text-sm text-muted-foreground mt-2">
//                 {stat.label}
//               </div>
//             </motion.div>
//           ))}

//         </div>
//       </section>

//       {/* PRICING */}

//       <section className="py-24">
//         <div className="max-w-6xl mx-auto px-4">

//           <h2 className="text-3xl font-bold text-center mb-16">
//             Simple Pricing
//           </h2>

//           <div className="grid md:grid-cols-3 gap-8">

//             {pricing.map((p: Pricing) => (
//               <div
//                 key={p.name}
//                 className={`border rounded-xl p-8 text-center shadow ${
//                   p.highlight
//                     ? "bg-gradient-to-b from-purple-500/10 to-cyan-500/10 border-purple-400"
//                     : ""
//                 }`}
//               >

//                 <h3 className="text-xl font-semibold mb-4">
//                   {p.name}
//                 </h3>

//                 <div className="text-5xl font-bold mb-6">
//                   {p.price}
//                 </div>

//                 <ul className="space-y-3 text-sm text-muted-foreground mb-6">

//                   {p.features.map((f) => (
//                     <li key={f}>{f}</li>
//                   ))}

//                 </ul>

//                 <Button className="w-full">
//                   Get Started
//                 </Button>

//               </div>
//             ))}

//           </div>

//         </div>
//       </section>

//       <Footer />
//     </div>
//   );
// }




"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, MessageSquare, Mic, Target, TrendingUp, Check } from "lucide-react"

export default function Page() {
  return (
    <div className="bg-[#f7f8fc] text-gray-900 overflow-hidden">

      <Navbar />

      {/* HERO */}
      <section className="pt-36 pb-32 bg-gradient-to-b from-gray-50 to-white relative">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">

          <motion.div initial={{opacity:0,y:60}} animate={{opacity:1,y:0}}>
            <h1 className="text-6xl font-bold leading-tight">
              Are You Executing Like A Top 
            </h1>

            <h2 className="text-7xl font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              Sales Rep?
            </h2>

            <p className="mt-6 text-lg text-gray-600 max-w-xl">
              Some reps consistently book meetings. Others don’t. It is not a work ethic issue. It is an execution gap. Execution gaps are the small mistakes that stop convection from turning into meetings.


            </p>
            <p className="mt-4 font-semibold text-lg text-gray-600 max-w-xl">
              Close the gap. Start executing like a top Sales Representative.
            </p>

            <div className="flex gap-4 mt-10">
              <Button className="shadow-lg hover:scale-105 transition">
                <Link href="/auth/signup" className="flex items-center gap-2">
                  Find Your Execution Gaps <ArrowRight className="w-4"/>
                </Link>
              </Button>

              <Button variant="outline">
                <Link href="/auth/login">See How It Works</Link>
              </Button>
            </div>
          </motion.div>

          {/* ⭐ HERO AI CARD FINAL */}
          <motion.div
            initial={{opacity:0,scale:.9}}
            animate={{opacity:1,scale:1,y:[0,-12,0]}}
            transition={{duration:6,repeat:Infinity}}
            className="relative bg-white rounded-2xl shadow-xl p-6 border border-gray-200"
          >

            {/* gradient border glow */}
            <div className="absolute inset-0 rounded-2xl border border-transparent 
            bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 opacity-20 blur-xl"/>

            <div className="relative">

              {/* header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <MessageSquare className="text-white w-5"/>
                  </div>

                  <div>
                    <h4 className="font-semibold">AI Sales Simulation</h4>
                    <p className="text-xs text-gray-400">Live Practice Session</p>
                  </div>
                </div>

                <div className="text-xs bg-gray-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"/>
                  AI Active
                </div>
              </div>

              <div className="border-b mb-4"/>

              {/* chat */}
              <div className="space-y-4 text-sm">

                <div>
                  <div className="bg-blue-50 border rounded-xl p-4 max-w-md">
                    "Your pricing seems high compared to competitors..."
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Customer</p>
                </div>

                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white rounded-xl p-4 max-w-md">
                    "I understand. Let me show you our ROI calculator..."
                  </div>
                </div>
                <p className="text-xs text-gray-400 text-right">You</p>

                <div className="bg-green-50 border rounded-xl p-4">
                  <p className="text-green-600 font-semibold mb-1">
                    AI Coach Feedback
                  </p>
                  Great! You acknowledged the concern. Try adding a specific success story next.
                </div>

              </div>

              <Button className="w-full mt-5 shadow hover:shadow-lg transition">
                Analyze with AI
              </Button>

            </div>
          </motion.div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="py-28">
        <h2 className="text-center text-4xl font-bold mb-16 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">
          Fix How You Execute In Real Conversations.
        </h2>

        <div className="max-w-6xl mx-auto grid md:grid-cols-4 gap-8 px-6">
          {[MessageSquare,Mic,Target,TrendingUp].map((Icon,i)=>(
            <motion.div
              key={i}
              whileHover={{y:-8}}
              className="bg-white border p-6 rounded-xl shadow hover:shadow-2xl"
            >
              <Icon className="text-blue-600 mb-4"/>
              <h3 className="font-semibold">
                {["AI Sales Coach","Voice Pitch Training","Objection Handling","Sales Analytics"][i]}
              </h3>
              <p className="text-gray-500 text-sm mt-2">
                Train with intelligent AI simulations and real-time feedback.
              </p>
            </motion.div>
          ))}
        </div>
      </section>

{/* EXECUTION CTA */}
<section className="py-28 bg-white">
  <div className="max-w-3xl mx-auto text-center px-6">

    <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 bg-clip-text text-transparent">
      Close The Gap. Start Executing.
    </h2>
    <p className="text-7x1 font-semibold text-gray-600 mt-4">
      Execution gaps are the small mistakes that stop conversations turning into meetings. You’re active. But are you converting?
    </p>
    <p className="text-7x1 font-semibold text-black-600 mt-4">
      Fix the gap. Build consistent pipeline.
    </p>

    <div className="flex justify-center items-center gap-4 mt-10 flex-wrap">

      <Button variant="outline">
        <Link href="/auth/login">
          See How It Works
        </Link>
      </Button>

      <Button className="shadow-lg hover:scale-105 transition">
        <Link href="/auth/signup" className="flex items-center gap-2">
          Find Your Execution Gaps 
          <ArrowRight className="w-4"/>
        </Link>
      </Button>

    </div>

  </div>
</section>

      {/* PRICING */}
      <section className="py-28">
        <h2 className="text-center text-4xl font-bold mb-16">
          Pricing
        </h2>

        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-10 px-6">
          {[
            {
              name:"Starter",
              price:"$19",
              features:[
                "50 AI simulations/month",
                "Basic sales scenarios",
                "Email support",
                "Performance analytics",
                
              ]
            },
            {
              name:"Pro",
              price:"$49",
              highlight:true,
              features:[
                "Unlimited AI simulations",
                "Advanced scenarios + custom",
                "Priority support",
                "Advanced analytics",
                "Voice pitch training",
                "Team collaboration"
              ]
            },
            {
              name:"Upcoming Team Plan",
              price:"$99",
              features:[
                "Everything in Pro",
                "Unlimited team members",
                "Dedicated manager",
                "Custom integrations",
                "White-label options",
                "API access"
              ]
            }
          ].map((plan,i)=>(
            <motion.div
              key={plan.name}
              whileHover={{y:-8}}
              className={`relative bg-white border rounded-2xl p-8 shadow transition
              ${plan.highlight ? "border-purple-400 shadow-purple-200 scale-105" : ""}`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-600 text-white text-xs px-4 py-1 rounded-full">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-2xl font-bold">{plan.name}</h3>

              <div className="flex items-baseline gap-1 my-6">
                <span className="text-5xl font-bold">{plan.price}</span>
                <span className="text-gray-500 text-sm">/month</span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map(f=>(
                  <li key={f} className="flex gap-2 text-sm text-gray-600">
                    <Check className="w-4 text-blue-600 mt-[2px]"/>
                    {f}
                  </li>
                ))}
              </ul>

              <Button className={`w-full ${plan.highlight?"bg-blue-600 text-white":""}`}>
                Get Started
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      <Footer />

    </div>
  )
}