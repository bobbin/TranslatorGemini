import DashboardLayout from "@/components/layout/dashboard-layout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Mail, MessageSquare, Search } from "lucide-react";

export default function HelpPage() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContactForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Search initiated",
      description: `Searching for: ${searchQuery}`,
    });
    // Aquí implementaríamos la búsqueda real
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simular envío
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Message sent",
        description: "We'll get back to you as soon as possible",
      });
      setContactForm({
        name: "",
        email: "",
        message: "",
      });
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-2">Help Center</h1>
        <p className="text-muted-foreground mb-6">Find answers to common questions and learn how to use TraduLibro</p>
        
        <div className="mb-8">
          <form onSubmit={handleSearch} className="flex w-full max-w-lg gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search help articles..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </div>
        
        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="guides">User Guides</TabsTrigger>
            <TabsTrigger value="contact">Contact Support</TabsTrigger>
          </TabsList>
          
          <TabsContent value="faq">
            <div className="grid grid-cols-1 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                  <CardDescription>
                    Find answers to the most common questions about TraduLibro
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>What file formats does TraduLibro support?</AccordionTrigger>
                      <AccordionContent>
                        Currently, TraduLibro supports EPUB and PDF formats. We preserve the original 
                        formatting while translating the text content. We plan to add support for more 
                        formats in future updates.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-2">
                      <AccordionTrigger>How accurate are the translations?</AccordionTrigger>
                      <AccordionContent>
                        TraduLibro uses Google's Gemini 2.0 Flash AI technology, which provides 
                        high-quality translations for most language pairs. The accuracy can vary 
                        depending on the complexity of the text and the language pair, but it generally 
                        produces fluent and contextually appropriate translations.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-3">
                      <AccordionTrigger>How long does it take to translate a book?</AccordionTrigger>
                      <AccordionContent>
                        Translation time depends on the size of the book, the server load, and your 
                        subscription plan. A typical novel (80,000-100,000 words) takes approximately 
                        5-15 minutes to translate on the Premium plan. Larger books or Free plan users 
                        may experience longer processing times.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-4">
                      <AccordionTrigger>What languages are supported?</AccordionTrigger>
                      <AccordionContent>
                        TraduLibro supports a wide range of languages including English, Spanish, French, 
                        German, Italian, Portuguese, Russian, Chinese, Japanese, Korean, Arabic, Hindi, 
                        and many more. Check the language selector in the translation form for the complete list.
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="item-5">
                      <AccordionTrigger>How do I cancel my subscription?</AccordionTrigger>
                      <AccordionContent>
                        You can cancel your subscription anytime by going to your Profile page, clicking 
                        on the Subscription card, and selecting "Manage Subscription". Follow the prompts 
                        to cancel. Your subscription will remain active until the end of the current billing period.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="guides">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                  <CardDescription>
                    Learn the basics of using TraduLibro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">1</span>
                      <span>Create an account or log in</span>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">2</span>
                      <span>Upload your EPUB or PDF file</span>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">3</span>
                      <span>Select source and target languages</span>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">4</span>
                      <span>Start translation and wait for completion</span>
                    </li>
                    <li className="flex items-center">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center mr-2 text-xs">5</span>
                      <span>Download your translated document</span>
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full mt-4">Read Full Guide</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Custom Translation Options</CardTitle>
                  <CardDescription>
                    Learn how to use advanced translation features
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    TraduLibro allows you to customize your translations with special prompts 
                    and settings. This guide covers advanced options like:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Using custom translation prompts</li>
                    <li>Adjusting translation style (formal, casual, technical)</li>
                    <li>Preserving specific terminology</li>
                    <li>Managing large files efficiently</li>
                    <li>Batch processing multiple documents</li>
                  </ul>
                  <Button variant="outline" className="w-full mt-4">Read Full Guide</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Troubleshooting</CardTitle>
                  <CardDescription>
                    Solutions to common problems
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    This guide helps you solve common issues you might encounter:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>File upload errors</li>
                    <li>Translation processing stuck</li>
                    <li>Download problems</li>
                    <li>Account and billing issues</li>
                    <li>Performance optimization</li>
                  </ul>
                  <Button variant="outline" className="w-full mt-4">Read Full Guide</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Subscription Plans</CardTitle>
                  <CardDescription>
                    Understanding our pricing tiers
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Learn about the different subscription plans available:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Free plan limitations</li>
                    <li>Premium plan benefits</li>
                    <li>Enterprise solutions</li>
                    <li>Billing cycles and payment methods</li>
                    <li>Upgrading or downgrading your plan</li>
                  </ul>
                  <Button variant="outline" className="w-full mt-4">Read Full Guide</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="contact">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Support</CardTitle>
                    <CardDescription>
                      Get help from our support team
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-sm font-medium">
                          Name
                        </label>
                        <Input
                          id="name"
                          name="name"
                          value={contactForm.name}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium">
                          Email
                        </label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={contactForm.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label htmlFor="message" className="text-sm font-medium">
                          Message
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          rows={5}
                          className="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={contactForm.message}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                      
                      <Button type="submit" className="w-full" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                      Other ways to reach us
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <h3 className="font-medium">Email Support</h3>
                        <p className="text-sm text-muted-foreground">
                          support@tradulibro.com
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Response within 24 hours
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-2">
                      <h3 className="font-medium mb-2">Business Hours</h3>
                      <p className="text-sm text-muted-foreground">
                        Monday - Friday: 9AM - 6PM EST
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Weekend: Limited support
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}