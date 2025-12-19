import {
  Header,
  Hero,
  HowItWorks,
  WhatWeCheck,
  FAQ,
  FooterCTA,
  Footer,
} from "@/components/landing";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <WhatWeCheck />
        <FAQ />
        <FooterCTA />
      </main>
      <Footer />
    </>
  );
}
