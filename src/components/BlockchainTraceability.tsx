import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface TrackingStage {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'completed' | 'active' | 'pending';
  timestamp?: string;
  details: {
    label: string;
    value: string;
  }[];
}

const BlockchainTraceability = () => {
  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);

  const trackingStages: TrackingStage[] = [
    {
      id: 'seed',
      title: 'Seed Registration',
      description: 'Cannabis seed registered with unique genome sequence',
      icon: '🌱',
      status: 'completed',
      timestamp: '2024-01-15 08:30:00',
      details: [
        { label: 'Genome ID', value: '0x7A3F...B2C9' },
        { label: 'Strain', value: 'Northern Lights' },
        { label: 'Origin', value: 'Cape Town Facility' },
        { label: 'Genetics', value: 'Indica Dominant' }
      ]
    },
    {
      id: 'sequencing',
      title: 'Genome Sequencing',
      description: 'Plant DNA encrypted into blockchain key-pairs',
      icon: '🧬',
      status: 'completed',
      timestamp: '2024-01-15 09:45:00',
      details: [
        { label: 'Public Key', value: '0xA1B2...C3D4' },
        { label: 'Private Key', value: 'Secured on-chain' },
        { label: 'QR Code', value: 'Generated' },
        { label: 'Verification', value: 'Blockchain Verified' }
      ]
    },
    {
      id: 'cultivation',
      title: 'Cultivation Tracking',
      description: 'Growth cycle monitored with blockchain checkpoints',
      icon: '🌿',
      status: 'completed',
      timestamp: '2024-02-20 14:20:00',
      details: [
        { label: 'Duration', value: '90 Days' },
        { label: 'Environment', value: 'Controlled Indoor' },
        { label: 'Checkpoints', value: '24 Verified' },
        { label: 'License', value: 'SAHPRA-2024-001' }
      ]
    },
    {
      id: 'harvest',
      title: 'Harvest & Processing',
      description: 'Product harvested and quality tested',
      icon: '✂️',
      status: 'completed',
      timestamp: '2024-03-15 11:00:00',
      details: [
        { label: 'Batch ID', value: 'NL-2024-Q1-045' },
        { label: 'Weight', value: '2.5 kg' },
        { label: 'THC Content', value: '22.4%' },
        { label: 'CBD Content', value: '1.2%' }
      ]
    },
    {
      id: 'lab',
      title: 'Lab Testing',
      description: 'Independent lab verification and certification',
      icon: '🔬',
      status: 'completed',
      timestamp: '2024-03-18 16:30:00',
      details: [
        { label: 'Lab', value: 'CannaSafe Analytics' },
        { label: 'Microbial', value: 'Pass' },
        { label: 'Heavy Metals', value: 'Pass' },
        { label: 'Certificate', value: 'CS-2024-0318' }
      ]
    },
    {
      id: 'packaging',
      title: 'Packaging & QR',
      description: 'Product sealed with blockchain-verified QR code',
      icon: '📦',
      status: 'active',
      timestamp: '2024-03-20 10:15:00',
      details: [
        { label: 'QR Generated', value: 'Yes' },
        { label: 'Tamper Seal', value: 'Applied' },
        { label: 'Package ID', value: 'PKG-2024-045-01' },
        { label: 'Expiry Date', value: '2025-03-20' }
      ]
    },
    {
      id: 'distribution',
      title: 'Distribution',
      description: 'Licensed partner delivery to medical dispensaries',
      icon: '🚚',
      status: 'pending',
      details: [
        { label: 'Carrier', value: 'Licensed Courier' },
        { label: 'Destination', value: 'Medical Clinic - Lisbon' },
        { label: 'ETA', value: '2024-03-22' },
        { label: 'Temperature', value: 'Monitored' }
      ]
    },
    {
      id: 'consumer',
      title: 'Consumer Verification',
      description: 'End user scans QR to verify authenticity',
      icon: '✅',
      status: 'pending',
      details: [
        { label: 'Verification', value: 'Pending' },
        { label: 'Authenticity', value: 'Blockchain Verified' },
        { label: 'Journey', value: 'Full Transparency' },
        { label: 'Anti-Spoofing', value: 'Protected' }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-primary/20 text-primary border-primary/40';
      case 'active':
        return 'bg-secondary/20 text-secondary border-secondary/40';
      case 'pending':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const stage = selectedStage ? trackingStages.find(s => s.id === selectedStage) : null;

  return (
    <div className="w-full bg-gradient-to-b from-background to-muted/20 py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 text-xs font-bold tracking-wider">
            BLOCKCHAIN TECHNOLOGY
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Seed-to-Sale <span className="text-primary">Traceability</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every product journey is immutably recorded on the blockchain with genome sequencing verification, eliminating counterfeits and ensuring complete transparency.
          </p>
        </div>

        {/* Tracking Timeline */}
        <div className="relative mb-12">
          {/* Progress Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-border transform -translate-x-1/2 hidden md:block" />
          
          <div className="space-y-8">
            {trackingStages.map((stage, index) => (
              <motion.div
                key={stage.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`flex items-center gap-6 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Content Card */}
                <Card
                  className={`flex-1 p-6 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] ${
                    selectedStage === stage.id ? 'ring-2 ring-primary shadow-xl' : ''
                  }`}
                  onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">{stage.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg">{stage.title}</h3>
                        <Badge className={`text-[10px] ${getStatusColor(stage.status)}`}>
                          {stage.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {stage.description}
                      </p>
                      {stage.timestamp && (
                        <p className="text-xs text-muted-foreground font-mono">
                          {stage.timestamp}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Timeline Node */}
                <div className="relative z-10 hidden md:block">
                  <div
                    className={`w-12 h-12 rounded-full border-4 flex items-center justify-center ${
                      stage.status === 'completed'
                        ? 'bg-primary border-primary text-primary-foreground'
                        : stage.status === 'active'
                        ? 'bg-secondary border-secondary text-secondary-foreground animate-pulse'
                        : 'bg-muted border-border text-muted-foreground'
                    }`}
                  >
                    {stage.status === 'completed' && '✓'}
                    {stage.status === 'active' && '●'}
                    {stage.status === 'pending' && '○'}
                  </div>
                </div>

                {/* Spacer for alternating layout */}
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stage Details Panel */}
        <AnimatePresence mode="wait">
          {stage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                      <span className="text-3xl">{stage.icon}</span>
                      {stage.title}
                    </h3>
                    <p className="text-muted-foreground">{stage.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedStage(null)}
                  >
                    ✕
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stage.details.map((detail, idx) => (
                    <div
                      key={idx}
                      className="bg-background/60 backdrop-blur-sm rounded-lg p-4 border border-border/40"
                    >
                      <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">
                        {detail.label}
                      </div>
                      <div className="text-sm font-mono font-bold text-foreground">
                        {detail.value}
                      </div>
                    </div>
                  ))}
                </div>

                {stage.id === 'sequencing' && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <Button
                      onClick={() => setShowQRCode(!showQRCode)}
                      className="w-full"
                    >
                      {showQRCode ? 'Hide' : 'View'} QR Code Verification
                    </Button>
                    
                    <AnimatePresence>
                      {showQRCode && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 bg-background rounded-lg p-6 text-center"
                        >
                          <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center mb-4">
                            {/* QR Code Placeholder */}
                            <div className="grid grid-cols-8 gap-1 p-2">
                              {Array.from({ length: 64 }).map((_, i) => (
                                <div
                                  key={i}
                                  className={`w-4 h-4 ${
                                    Math.random() > 0.5 ? 'bg-black' : 'bg-white'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Scan to verify product authenticity and view complete blockchain journey
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Technology Explanation */}
        <div className="mt-16 grid md:grid-cols-3 gap-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🔐</div>
            <h3 className="font-bold text-lg mb-2">Genome Encryption</h3>
            <p className="text-sm text-muted-foreground">
              Plant DNA is sequenced and encrypted into public/private key-pairs at the seed stage, creating an immutable genetic fingerprint on the blockchain.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="font-bold text-lg mb-2">Anti-Spoofing Protection</h3>
            <p className="text-sm text-muted-foreground">
              QR codes contain encrypted genome data that can be verified against our secure servers, preventing illegal cannabis from entering the legal supply chain.
            </p>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="font-bold text-lg mb-2">Full Transparency</h3>
            <p className="text-sm text-muted-foreground">
              Every step from seed to consumer is recorded on-chain with timestamps, ensuring regulatory compliance and building consumer trust.
            </p>
          </Card>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Card className="p-8 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10">
            <h3 className="text-2xl font-bold mb-3">Experience The Future of Cannabis Traceability</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Our blockchain-verified system ensures every product is authentic, compliant, and traceable from seed to consumer.
            </p>
            <Button size="lg" className="gap-2">
              Learn More About Our Technology
              <span>→</span>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BlockchainTraceability;
