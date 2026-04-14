import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Features from "@/components/Features";
import Versions from "@/components/Versions";
import Values from "@/components/Values";
import Members from "@/components/Members";
import Download from "@/components/Download";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
      <Header />
      <Hero />
      <About />
      <Features />
      <Versions />
      <Values />
      <Members />
      <Download />
      <Footer />
    </main>
  );
}
