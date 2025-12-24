import { Link } from "react-router-dom";
import { ChevronRight, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "@/layout/Header";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";
import ScrollAnimation from "@/components/ScrollAnimation";
import PageTransition from "@/components/PageTransition";

interface ConditionPageTemplateProps {
  conditionKey: string;
}

const ConditionPageTemplate = ({ conditionKey }: ConditionPageTemplateProps) => {
  const { t } = useTranslation("conditionPages");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const tableOfContents = [
    { id: "causes", title: t("common.causes") },
    { id: "symptoms", title: t("common.symptoms") },
    { id: "treatment", title: t("common.treatment") },
    { id: "cannabis", title: t("common.medicalCannabis") },
    { id: "faq", title: t("common.faq") },
  ];

  const causes = t(`${conditionKey}.causes`, { returnObjects: true }) as any;
  const symptoms = t(`${conditionKey}.symptoms`, { returnObjects: true }) as any;
  const treatment = t(`${conditionKey}.treatment`, { returnObjects: true }) as any;
  const medicalCannabis = t(`${conditionKey}.medicalCannabis`, { returnObjects: true }) as any;
  const faq = t(`${conditionKey}.faq`, { returnObjects: true }) as any;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <ScrollAnimation>
              <h1 className="text-5xl md:text-6xl font-geist font-bold mb-6 text-foreground">
                {t(`${conditionKey}.title`)}
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl font-geist">
                {t(`${conditionKey}.subtitle`)}
              </p>
            </ScrollAnimation>
          </div>
        </section>

        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground font-geist">
            <Link to="/" className="hover:text-primary transition-colors">{t("breadcrumbs.home")}</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/conditions" className="hover:text-primary transition-colors">{t("breadcrumbs.conditions")}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{t(`${conditionKey}.breadcrumb`)}</span>
          </div>
        </div>

        {/* Main Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-[300px,1fr] gap-12">
              {/* Table of Contents */}
              <div className="hidden lg:block">
                <div className="sticky top-32 space-y-2">
                  <h3 className="text-sm font-geist font-semibold text-foreground mb-4">{t("toc.onThisPage")}</h3>
                  {tableOfContents.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg transition-all font-geist"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="space-y-16">
                {/* Causes */}
                <ScrollAnimation>
                  <div id="causes" className="scroll-mt-32">
                    <h2 className="text-3xl font-geist font-bold mb-6 text-foreground">{causes.title}</h2>
                    <div className="prose prose-lg max-w-none">
                      {causes.content1 && <p className="text-muted-foreground font-geist leading-relaxed mb-4">{causes.content1}</p>}
                      {causes.content2 && <p className="text-muted-foreground font-geist leading-relaxed mb-4">{causes.content2}</p>}
                      {causes.content3 && <p className="text-muted-foreground font-geist leading-relaxed">{causes.content3}</p>}
                      {causes.intro && <p className="text-muted-foreground font-geist leading-relaxed mb-6">{causes.intro}</p>}
                      {causes.items && (
                        <div className="grid md:grid-cols-2 gap-6 mt-6">
                          {causes.items.map((item: any, index: number) => (
                            <div key={index} className="p-6 rounded-xl bg-card border border-border">
                              <h3 className="text-xl font-geist font-semibold mb-2 text-foreground">{item.title}</h3>
                              <p className="text-muted-foreground font-geist">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollAnimation>

                {/* Symptoms */}
                <ScrollAnimation>
                  <div id="symptoms" className="scroll-mt-32">
                    <h2 className="text-3xl font-geist font-bold mb-6 text-foreground">{symptoms.title}</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      {Object.entries(symptoms).filter(([key]) => key !== 'title' && key !== 'intro').map(([key, value]: [string, any]) => (
                        <div key={key} className="p-6 rounded-xl bg-card border border-border">
                          <h3 className="text-xl font-geist font-semibold mb-4 text-foreground">{value.title}</h3>
                          <ul className="space-y-3">
                            {value.items?.map((item: string, index: number) => (
                              <li key={index} className="flex items-start gap-3">
                                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                                <span className="text-muted-foreground font-geist">{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollAnimation>

                {/* Treatment */}
                <ScrollAnimation>
                  <div id="treatment" className="scroll-mt-32">
                    <h2 className="text-3xl font-geist font-bold mb-6 text-foreground">{treatment.title}</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                      {treatment.items?.map((item: any, index: number) => (
                        <div key={index} className="p-6 rounded-xl bg-card border border-border">
                          <h3 className="text-xl font-geist font-semibold mb-2 text-foreground">{item.title}</h3>
                          <p className="text-muted-foreground font-geist">{item.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollAnimation>

                {/* Medical Cannabis */}
                <ScrollAnimation>
                  <div id="cannabis" className="scroll-mt-32">
                    <div className="p-8 rounded-2xl bg-primary/5 border border-primary/20">
                      <h2 className="text-3xl font-geist font-bold mb-6 text-foreground">{medicalCannabis.title}</h2>
                      <p className="text-muted-foreground font-geist leading-relaxed mb-4">{medicalCannabis.content1}</p>
                      <p className="text-muted-foreground font-geist leading-relaxed mb-6">{medicalCannabis.content2}</p>
                      <Link to="/contact">
                        <button className="btn-primary px-8 py-3">{t("consultation")}</button>
                      </Link>
                    </div>
                  </div>
                </ScrollAnimation>

                {/* FAQ */}
                <ScrollAnimation>
                  <div id="faq" className="scroll-mt-32">
                    <h2 className="text-3xl font-geist font-bold mb-8 text-foreground">{faq.title}</h2>
                    <div className="space-y-4">
                      {faq.items?.map((item: any, index: number) => (
                        <div key={index} className="rounded-xl border border-border overflow-hidden">
                          <button
                            onClick={() => setExpandedFaq(expandedFaq === `q${index}` ? null : `q${index}`)}
                            className="w-full flex items-center justify-between p-6 text-left hover:bg-muted/30 transition-colors"
                          >
                            <h3 className="text-lg font-geist font-semibold text-foreground pr-4">{item.question}</h3>
                            <motion.div animate={{ rotate: expandedFaq === `q${index}` ? 180 : 0 }} transition={{ duration: 0.3 }}>
                              <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                            </motion.div>
                          </button>
                          <motion.div initial={false} animate={{ height: expandedFaq === `q${index}` ? 'auto' : 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                            <div className="px-6 pb-6">
                              <p className="text-muted-foreground font-geist leading-relaxed">{item.answer}</p>
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

        {/* CTA */}
        <section className="py-20" style={{ backgroundColor: 'hsl(var(--section-color))' }}>
          <div className="container mx-auto px-4">
            <ScrollAnimation>
              <div className="max-w-4xl mx-auto text-center">
                <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">{t("cta.title")}</h2>
                <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto">{t("cta.subtitle")}</p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/contact">
                    <button className="btn-linear text-white border border-white/30 hover:bg-white/10 px-8 py-3 text-lg">{t("cta.contact")}</button>
                  </Link>
                  <Link to="/conditions">
                    <button className="btn-linear text-white border border-white/30 hover:bg-white/10 px-8 py-3 text-lg">{t("cta.viewConditions")}</button>
                  </Link>
                </div>
              </div>
            </ScrollAnimation>
          </div>
        </section>

        <Footer />
        <BackToTop />
      </div>
    </PageTransition>
  );
};

export default ConditionPageTemplate;
