import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  UserPlus, 
  Send, 
  Loader2, 
  CheckCircle, 
  AlertTriangle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useDrGreenApi } from '@/hooks/useDrGreenApi';

// Predefined clients to re-register
const PREDEFINED_CLIENTS = [
  {
    id: 'scott',
    firstName: 'Scott',
    lastName: 'Cunningham',
    email: 'scott@healingbuds.co.uk',
    countryCode: 'GBR',
    phoneCode: '+44',
    phoneCountryCode: 'GB',
    contactNumber: '7700900000',
    shipping: {
      address1: '123 Test Street',
      city: 'London',
      state: 'Greater London',
      country: 'United Kingdom',
      countryCode: 'GBR',
      postalCode: 'SW1A 1AA',
    },
  },
  {
    id: 'kayleigh',
    firstName: 'Kayleigh',
    lastName: 'Cunningham',
    email: 'kayleigh@healingbuds.co.uk',
    countryCode: 'GBR',
    phoneCode: '+44',
    phoneCountryCode: 'GB',
    contactNumber: '7700900001',
    shipping: {
      address1: '123 Test Street',
      city: 'London',
      state: 'Greater London',
      country: 'United Kingdom',
      countryCode: 'GBR',
      postalCode: 'SW1A 1AA',
    },
  },
];

interface CreationResult {
  clientId: string;
  firstName: string;
  lastName: string;
  email: string;
  kycLink?: string;
  success: boolean;
  error?: string;
}

export function AdminClientCreator() {
  const { toast } = useToast();
  const { reregisterClient } = useDrGreenApi();
  const [creating, setCreating] = useState<string | null>(null);
  const [results, setResults] = useState<CreationResult[]>([]);
  
  // Custom client form
  const [customEmail, setCustomEmail] = useState('');
  const [customFirstName, setCustomFirstName] = useState('');
  const [customLastName, setCustomLastName] = useState('');
  const [customCountry, setCustomCountry] = useState('GBR');

  const createClient = async (client: typeof PREDEFINED_CLIENTS[0]) => {
    setCreating(client.id);
    
    try {
      const result = await reregisterClient({
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        countryCode: client.countryCode,
        phoneCode: client.phoneCode,
        phoneCountryCode: client.phoneCountryCode,
        contactNumber: client.contactNumber,
        shipping: client.shipping,
      });

      if (result.error) {
        const errorResult: CreationResult = {
          clientId: '',
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          success: false,
          error: result.error,
        };
        setResults(prev => [...prev, errorResult]);
        
        toast({
          title: 'Creation Failed',
          description: `Failed to create ${client.firstName}: ${result.error}`,
          variant: 'destructive',
        });
      } else if (result.data?.success) {
        const successResult: CreationResult = {
          clientId: result.data.clientId || '',
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          kycLink: result.data.kycLink,
          success: true,
        };
        setResults(prev => [...prev, successResult]);
        
        toast({
          title: 'Client Created!',
          description: `${client.firstName} ${client.lastName} registered successfully.`,
        });
        
        // Copy KYC link if available
        if (result.data.kycLink) {
          navigator.clipboard.writeText(result.data.kycLink);
        }
      }
    } catch (err) {
      console.error('Creation error:', err);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setCreating(null);
    }
  };

  const createCustomClient = async () => {
    if (!customEmail || !customFirstName || !customLastName) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    const customClient = {
      id: 'custom',
      firstName: customFirstName,
      lastName: customLastName,
      email: customEmail,
      countryCode: customCountry,
      phoneCode: customCountry === 'GBR' ? '+44' : '+27',
      phoneCountryCode: customCountry === 'GBR' ? 'GB' : 'ZA',
      contactNumber: '0000000000',
      shipping: {
        address1: 'Address Pending',
        city: 'City',
        state: 'State',
        country: customCountry === 'GBR' ? 'United Kingdom' : 'South Africa',
        countryCode: customCountry,
        postalCode: '0000',
      },
    };

    await createClient(customClient);
    
    // Clear form on success
    setCustomEmail('');
    setCustomFirstName('');
    setCustomLastName('');
  };

  const createAllPredefined = async () => {
    for (const client of PREDEFINED_CLIENTS) {
      await createClient(client);
    }
  };

  const copyKycLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast({
      title: 'Copied!',
      description: 'KYC link copied to clipboard.',
    });
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-500/10">
            <UserPlus className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Create Dr. Green Clients</CardTitle>
            <CardDescription>
              Register new clients under the current API key pair
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Predefined Clients */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm flex items-center gap-2">
            Quick Actions — Predefined Clients
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PREDEFINED_CLIENTS.map((client) => {
              const existingResult = results.find(r => r.email === client.email);
              
              return (
                <motion.div
                  key={client.id}
                  className="p-4 rounded-lg border bg-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{client.firstName} {client.lastName}</p>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    </div>
                    {existingResult?.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : existingResult?.error ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => createClient(client)}
                        disabled={creating === client.id}
                      >
                        {creating === client.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-1" />
                            Create
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  {existingResult?.kycLink && (
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyKycLink(existingResult.kycLink!)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy KYC Link
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(existingResult.kycLink, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  {existingResult?.error && (
                    <p className="mt-2 text-xs text-red-500">{existingResult.error}</p>
                  )}
                </motion.div>
              );
            })}
          </div>
          <Button
            variant="secondary"
            onClick={createAllPredefined}
            disabled={!!creating}
            className="w-full"
          >
            Create All Predefined Clients
          </Button>
        </div>

        {/* Custom Client Form */}
        <div className="border-t pt-6 space-y-4">
          <h4 className="font-medium text-sm">Create Custom Client</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={customFirstName}
                onChange={(e) => setCustomFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={customLastName}
                onChange={(e) => setCustomLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Select value={customCountry} onValueChange={setCustomCountry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBR">United Kingdom</SelectItem>
                  <SelectItem value="ZAF">South Africa</SelectItem>
                  <SelectItem value="PRT">Portugal</SelectItem>
                  <SelectItem value="THA">Thailand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={createCustomClient}
            disabled={creating === 'custom'}
            className="w-full"
          >
            {creating === 'custom' ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <UserPlus className="w-4 h-4 mr-2" />
            )}
            Create Custom Client
          </Button>
        </div>

        {/* Results Summary */}
        {results.length > 0 && (
          <div className="border-t pt-6 space-y-3">
            <h4 className="font-medium text-sm">Creation Results</h4>
            <div className="space-y-2">
              {results.map((result, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg text-sm ${
                    result.success 
                      ? 'bg-green-500/10 border border-green-500/20' 
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {result.firstName} {result.lastName}
                    </span>
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  {result.success && result.clientId && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ID: {result.clientId.slice(0, 16)}...
                    </p>
                  )}
                  {result.error && (
                    <p className="text-xs text-red-600 mt-1">{result.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
          <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">
            How this works:
          </p>
          <ul className="text-muted-foreground space-y-1 text-xs">
            <li>• Creates clients under the current Dr. Green API key pair</li>
            <li>• New clients will need to complete KYC verification</li>
            <li>• KYC links are automatically copied to clipboard</li>
            <li>• Admin approval required after KYC in Dr. Green DApp portal</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
