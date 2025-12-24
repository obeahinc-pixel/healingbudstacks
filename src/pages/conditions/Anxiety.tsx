import { useTranslation } from "react-i18next";
import Header from "@/layout/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import ScrollAnimation from "@/components/ScrollAnimation";
import BackToTop from "@/components/BackToTop";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

const Anxiety = () => {
  const { t } = useTranslation("conditionPages");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const tableOfContents = [
    { id: "causes", title: t("anxiety.toc.causes") },
    { id: "symptoms", title: t("anxiety.toc.symptoms") },
    { id: "types", title: t("anxiety.toc.types") },
    { id: "treatment", title: t("anxiety.toc.treatment") },
    { id: "medical-cannabis", title: t("anxiety.toc.medicalCannabis") },
    { id: "faq", title: t("anxiety.toc.faq") },
  ];

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const causes = t("anxiety.causes.items", { returnObjects: true }) as Array<{ title: string; desc: string }>;
  const physicalSymptoms = t("anxiety.symptoms.physical.items", { returnObjects: true }) as string[];
  const psychologicalSymptoms = t("anxiety.symptoms.psychological.items", { returnObjects: true }) as string[];
  const types = t("anxiety.types.items", { returnObjects: true }) as Array<{ type: string; desc: string }>;
  const treatments = t("anxiety.treatment.items", { returnObjects: true }) as Array<{ title: string; desc: string }>;
  const faqs = t("anxiety.faq.items", { returnObjects: true }) as Array<{ question: string; answer: string }>;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24">
          {/* Hero Section */}
          <section 
            className="relative py-32 overflow-hidden" 
            style={{ backgroundColor: 'hsl(var(--section-color))' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
              <ScrollAnimation>
                <div className="max-w-4xl">
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
                    {t("anxiety.title")}
                  </h1>
                  <p className="text-lg md:text-xl text-white/90 max-w-3xl font-light">
                    {t("anxiety.subtitle")}
                  </p>
                </div>
              </ScrollAnimation>
            </div>
          </section>

          {/* Breadcrumbs */}
          <section className="py-6 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Link to="/" className="hover:text-primary transition-colors">{t("breadcrumbs.home")}</Link>
                <ChevronRight className="w-4 h-4" />
                <Link to="/conditions" className="hover:text-primary transition-colors">{t("breadcrumbs.conditions")}</Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-foreground">{t("anxiety.title").split(" ")[0]}</span>
              </div>
            </div>
          </section>

          {/* Main Content with Sidebar */}
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="grid lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
                {/* Sidebar */}
                <aside className="lg:col-span-1">
                  <div className="sticky top-32">
                    <ScrollAnimation variant="fadeLeft">
                      <div className="bg-muted/30 rounded-xl p-6 border border-border/30">
                        <h3 className="text-lg font-semibold text-foreground mb-4">{t("toc.title")}</h3>
                        <nav className="space-y-2">
                          {tableOfContents.map((item) => (
                            <button
                              key={item.id}
                              onClick={() => scrollToSection(item.id)}
                              className="block w-full text-left text-sm text-muted-foreground hover:text-primary transition-colors py-2 px-3 rounded-lg hover:bg-background"
                            >
                              {item.title}
                            </button>
                          ))}
                        </nav>
                      </div>
                    </ScrollAnimation>
                  </div>
                </aside>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-16">
                  {/* What Causes */}
                  <ScrollAnimation>
                    <div id="causes">
                      <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6 tracking-tight">
                        {t("anxiety.causes.title")}
                      </h2>
                      <p className="text-lg text-muted-foreground/80 leading-relaxed mb-6">
                        {t("anxiety.causes.intro")}
                      </p>
                      <div className="grid md:grid-cols-2 gap-6">
                        {causes.map((cause, index) => (
                          <div key={index} className="bg-muted/30 rounded-xl p-6 border border-border/30">
                            <h3 className="text-xl font-semibold text-foreground mb-2">{cause.title}</h3>
                            <p className="text-muted-foreground/80">{cause.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollAnimation>

                  {/* Symptoms */}
                  <ScrollAnimation>
                    <div id="symptoms">
                      <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6 tracking-tight">
                        {t("anxiety.symptoms.title")}
                      </h2>
                      <p className="text-lg text-muted-foreground/80 leading-relaxed mb-6">
                        {t("anxiety.symptoms.intro")}
                      </p>
                      <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-4">{t("anxiety.symptoms.physical.title")}</h3>
                          <ul className="space-y-3">
                            {physicalSymptoms.map((symptom, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <span className="text-muted-foreground/80">{symptom}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-foreground mb-4">{t("anxiety.symptoms.psychological.title")}</h3>
                          <ul className="space-y-3">
                            {psychologicalSymptoms.map((symptom, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                <span className="text-muted-foreground/80">{symptom}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </ScrollAnimation>

                  {/* Types */}
                  <ScrollAnimation>
                    <div id="types">
                      <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6 tracking-tight">
                        {t("anxiety.types.title")}
                      </h2>
                      <div className="space-y-4">
                        {types.map((type, index) => (
                          <div key={index} className="bg-background rounded-xl p-6 border border-border/30">
                            <h3 className="text-xl font-semibold text-foreground mb-2">{type.type}</h3>
                            <p className="text-muted-foreground/80">{type.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollAnimation>

                  {/* Treatment */}
                  <ScrollAnimation>
                    <div id="treatment">
                      <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6 tracking-tight">
                        {t("anxiety.treatment.title")}
                      </h2>
                      <p className="text-lg text-muted-foreground/80 leading-relaxed mb-6">
                        {t("anxiety.treatment.intro")}
                      </p>
                      <div className="grid sm:grid-cols-2 gap-6">
                        {treatments.map((treatment, index) => (
                          <div key={index} className="bg-muted/30 rounded-xl p-6 border border-border/30">
                            <h3 className="text-xl font-semibold text-foreground mb-2">{treatment.title}</h3>
                            <p className="text-muted-foreground/80">{treatment.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollAnimation>

                  {/* Medical Cannabis */}
                  <ScrollAnimation>
                    <div id="medical-cannabis" className="bg-muted/20 rounded-2xl p-8 border border-border/30">
                      <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-6 tracking-tight">
                        {t("anxiety.medicalCannabis.title")}
                      </h2>
                      <p className="text-lg text-muted-foreground/80 leading-relaxed mb-6">
                        {t("anxiety.medicalCannabis.content1")}
                      </p>
                      <p className="text-lg text-muted-foreground/80 leading-relaxed mb-6">
                        {t("anxiety.medicalCannabis.content2")}
                      </p>
                      <Link to="/contact">
                        <button className="btn-primary px-8 py-3">
                          {t("consultation")}
                        </button>
                      </Link>
                    </div>
                  </ScrollAnimation>

                  {/* FAQ */}
                  <ScrollAnimation>
                    <div id="faq">
                      <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-8 tracking-tight">
                        {t("anxiety.faq.title")}
                      </h2>
                      <div className="space-y-4">
                        {faqs.map((faq, index) => (
                          <div key={index} className="bg-background rounded-xl border border-border/30 overflow-hidden">
                            <button
                              onClick={() => setExpandedFaq(expandedFaq === `q${index}` ? null : `q${index}`)}
                              className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
                            >
                              <h3 className="text-lg font-semibold text-foreground pr-4">{faq.question}</h3>
                              <motion.div
                                animate={{ rotate: expandedFaq === `q${index}` ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                              </motion.div>
                            </button>
                            <motion.div
                              initial={false}
                              animate={{ height: expandedFaq === `q${index}` ? 'auto' : 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 pb-6">
                                <p className="text-muted-foreground/80 leading-relaxed">{faq.answer}</p>
                              </div>
                            </motion.div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollAnimation>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-20 md:py-32" style={{ backgroundColor: 'hsl(var(--section-color))' }}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <ScrollAnimation>
                <div className="max-w-4xl mx-auto text-center">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mb-6 tracking-tight">
                    {t("cta.title")}
                  </h2>
                  <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto">
                    {t("cta.subtitle")}
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Link to="/contact">
                      <button className="btn-linear text-white border border-white/30 hover:bg-white/10 px-8 py-3 text-lg">
                        {t("cta.contact")}
                      </button>
                    </Link>
                    <Link to="/conditions">
                      <button className="btn-linear text-white border border-white/30 hover:bg-white/10 px-8 py-3 text-lg">
                        {t("cta.viewConditions")}
                      </button>
                    </Link>
                  </div>
                </div>
              </ScrollAnimation>
            </div>
          </section>
        </main>
        <Footer />
        <BackToTop />
      </div>
    </PageTransition>
  );
};

export default Anxiety;
