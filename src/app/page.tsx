"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { analyzeClothingImage, type AnalyzeClothingImageOutput } from "@/ai/flows/analyze-clothing-image";
import { generateAiModel } from "@/ai/flows/generate-ai-model";
import { generateSingleViewComposite } from "@/ai/flows/single-view-composite";
import { toBase64 } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Upload, Sparkles, Shirt, Download, Loader2 } from "lucide-react";

const modelFormSchema = z.object({
  gender: z.string().min(1, "Please select a gender."),
  pose: z.string().min(1, "Please select a pose."),
  bodyType: z.string().min(1, "Please select a body type."),
  skinTone: z.string().min(1, "Please specify a skin tone."),
  viewAngle: z.string().min(1, "Please select a view angle."),
});

type ModelFormValues = z.infer<typeof modelFormSchema>;

export default function TryFitPage() {
  const [clothingImage, setClothingImage] = useState<string | null>(null);
  const [clothingAnalysis, setClothingAnalysis] = useState<AnalyzeClothingImageOutput | null>(null);
  
  const [modelImage, setModelImage] = useState<string | null>(null);
  
  const [compositeImage, setCompositeImage] = useState<string | null>(null);

  const [loadingStates, setLoadingStates] = useState({
    analyzing: false,
    generatingModel: false,
    compositing: false,
  });

  const [isHydrated, setIsHydrated] = useState(false);

  // Ensure hydration is complete before calculating disabled states
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Use useMemo to prevent unnecessary recalculations and ensure consistent values
  const isCreateTryOnDisabled = useMemo(() => {
    if (!isHydrated) return true; // Default to disabled during SSR
    return !clothingImage || !modelImage || loadingStates.compositing;
  }, [isHydrated, clothingImage, modelImage, loadingStates.compositing]);

  const isDownloadDisabled = useMemo(() => {
    if (!isHydrated) return true; // Default to disabled during SSR
    return !compositeImage;
  }, [isHydrated, compositeImage]);

  const isFileInputDisabled = useMemo(() => {
    if (!isHydrated) return false; // Default to enabled during SSR
    return loadingStates.analyzing;
  }, [isHydrated, loadingStates.analyzing]);

  const isGenerateModelDisabled = useMemo(() => {
    if (!isHydrated) return false; // Default to enabled during SSR
    return loadingStates.generatingModel;
  }, [isHydrated, loadingStates.generatingModel]);

  const { toast } = useToast();

  const modelForm = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      gender: "female",
      pose: "standing confidently, hands on hips",
      bodyType: "athletic build",
      skinTone: "light brown skin",
      viewAngle: "front",
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoadingStates(prev => ({ ...prev, analyzing: true }));
    setClothingAnalysis(null);
    setCompositeImage(null);
    try {
      const dataUri = await toBase64(file);
      setClothingImage(dataUri);
      const analysisResult = await analyzeClothingImage({ photoDataUri: dataUri });
      setClothingAnalysis(analysisResult);
      
      // Auto-set gender based on clothing analysis
      if (analysisResult.suggestedGender === "male" || analysisResult.suggestedGender === "female") {
        modelForm.setValue("gender", analysisResult.suggestedGender);
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        variant: "destructive",
        title: "Analysis Failed",
        description: "Could not analyze the uploaded image. Please try another one.",
      });
      setClothingImage(null);
    } finally {
      setLoadingStates(prev => ({ ...prev, analyzing: false }));
    }
  };

  const handleGenerateModel = async (values: ModelFormValues) => {
    setLoadingStates(prev => ({ ...prev, generatingModel: true }));
    setModelImage(null);
    setCompositeImage(null);
    try {
      const description = `A full-body studio portrait of a ${values.gender} model with ${values.skinTone} and an ${values.bodyType}. The model is ${values.pose}. The background is plain white.`;
      const result = await generateAiModel({ description });
      setModelImage(result.modelImage);
    } catch (error) {
      console.error("Error generating model:", error);
      toast({
        variant: "destructive",
        title: "Model Generation Failed",
        description: "Could not generate the AI model. Please try again.",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, generatingModel: false }));
    }
  };

  const handleCreateTryOn = async () => {
    console.log('handleCreateTryOn called with:', {
      clothingImage: clothingImage ? 'available' : 'null',
      modelImage: modelImage ? 'available' : 'null',
      clothingAnalysis: clothingAnalysis ? 'available' : 'null'
    });
    
    if (!clothingImage || !modelImage || !clothingAnalysis) {
      toast({
        variant: "destructive",
        title: "Missing Images",
        description: "Please upload a clothing item and generate a model first.",
      });
      return;
    }

    setLoadingStates(prev => ({ ...prev, compositing: true }));
    setCompositeImage(null);
    try {
      const modelValues = modelForm.getValues();
      console.log('Model form values:', modelValues);
      
      const modelDescription = `A ${modelValues.gender} model with ${modelValues.skinTone} and an ${modelValues.bodyType}. The model is ${modelValues.pose}.`;
      const clothingDescription = `${clothingAnalysis.garmentType} with features: ${clothingAnalysis.clothingFeatures.join(', ')}`;
      
      console.log('Calling generateSingleViewComposite with:', {
        clothingImageUri: clothingImage,
        modelImageUri: modelImage,
        clothingDescription,
        modelDescription,
        viewAngle: modelValues.viewAngle,
      });
      
      const result = await generateSingleViewComposite({
        clothingImageUri: clothingImage,
        modelImageUri: modelImage,
        clothingDescription,
        modelDescription,
        viewAngle: modelValues.viewAngle as 'front' | 'side' | 'back',
      });
      
      console.log('generateSingleViewComposite result:', result);
      
      if (result?.compositeImage) {
        setCompositeImage(result.compositeImage);
        console.log('Composite image set:', result.compositeImage);
      } else {
        console.error('No composite image in result');
        throw new Error('No composite image generated');
      }
    } catch (error) {
      console.error("Error creating try-on:", error);
      toast({
        variant: "destructive",
        title: "Virtual Try-On Failed",
        description: "Could not create the composite image. Please try again.",
      });
    } finally {
      setLoadingStates(prev => ({ ...prev, compositing: false }));
    }
  };
  
  const downloadImage = () => {
    if (!compositeImage) return;
    const modelValues = modelForm.getValues();
    const link = document.createElement('a');
    link.href = compositeImage;
    link.download = `tryfit-${modelValues.viewAngle}-view.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20">
              <Logo className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-headline text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                TryFit
              </h1>
              <p className="text-xs text-muted-foreground hidden sm:block">AI Virtual Fashion</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                AI Powered
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-4 md:p-8 max-w-7xl">
        {/* Hero Section */}
        <div className="text-center mb-8 lg:mb-12">
          <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI-Powered Multi-Angle Virtual Photoshoots
          </h2>
          <p className="text-muted-foreground mt-4 max-w-3xl mx-auto text-base md:text-lg leading-relaxed">
            Upload your apparel, generate the perfect AI model, and create stunning virtual try-on images from multiple angles - front, side, and back views.
          </p>
        </div>
        
        {/* Three-Step Process */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Step 1: Upload Clothing */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                  <Shirt className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="font-headline text-xl lg:text-2xl">Step 1: Upload Apparel</CardTitle>
                  <CardDescription className="text-sm">Select an image of your clothing item.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Image Upload Area */}
              <div className="relative">
                <div className="w-full aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center relative overflow-hidden transition-colors hover:bg-muted/50">
                  {loadingStates.analyzing && (
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">Analyzing clothing...</p>
                    </div>
                  )}
                  {clothingImage ? (
                    <Image 
                      src={clothingImage} 
                      alt="Uploaded clothing" 
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center p-4">
                      <Upload className="w-10 h-10 mb-3" />
                      <p className="text-sm text-center">Click to upload clothing image</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  )}
                </div>
                
                {/* Upload Button */}
                <Label htmlFor="clothing-upload" className="block mt-4">
                  <Button asChild className="w-full cursor-pointer" variant={clothingImage ? "outline" : "default"}>
                    <span>
                      <Upload className="mr-2 h-4 w-4" /> 
                      {clothingImage ? "Change Image" : "Choose File"}
                    </span>
                  </Button>
                  <Input 
                    id="clothing-upload" 
                    type="file" 
                    className="sr-only" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    disabled={isFileInputDisabled} 
                    suppressHydrationWarning 
                  />
                </Label>
              </div>

              {/* Analysis Results */}
              {clothingAnalysis && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Analysis Complete
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Type:</span>
                      <span className="font-medium">{clothingAnalysis.garmentType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Suggested for:</span>
                      <span className="font-medium capitalize">{clothingAnalysis.suggestedGender}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {clothingAnalysis.clothingFeatures.map(feature => (
                      <Badge key={feature} variant="secondary" className="text-xs">{feature}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Generate Model */}
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="font-headline text-xl lg:text-2xl">Step 2: Generate Model</CardTitle>
                  <CardDescription className="text-sm">Customize and create your AI model.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Model Preview Area */}
              <div className="relative">
                <div className="w-full aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center relative overflow-hidden transition-colors hover:bg-muted/50">
                  {loadingStates.generatingModel && (
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">Generating AI model...</p>
                    </div>
                  )}
                  {modelImage ? (
                    <Image 
                      src={modelImage} 
                      alt="AI Generated Model" 
                      fill
                      className="object-contain p-2"
                    />
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center p-4">
                      <Sparkles className="w-10 h-10 mb-3" />
                      <p className="text-sm text-center">AI model will appear here</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">Configure settings below</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Model Configuration Form */}
              <Form {...modelForm}>
                <form onSubmit={modelForm.handleSubmit(handleGenerateModel)} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={modelForm.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="male">Male</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={modelForm.control}
                      name="bodyType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Body Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select body type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="athletic build">Athletic</SelectItem>
                              <SelectItem value="slim build">Slim</SelectItem>
                              <SelectItem value="average build">Average</SelectItem>
                              <SelectItem value="muscular build">Muscular</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={modelForm.control}
                      name="skinTone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Skin Tone</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select skin tone" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="light brown skin">Light Brown</SelectItem>
                              <SelectItem value="dark chocolate skin">Dark Chocolate</SelectItem>
                              <SelectItem value="pale ivory skin">Pale Ivory</SelectItem>
                              <SelectItem value="olive skin">Olive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={modelForm.control}
                      name="pose"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">Pose</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select pose" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="standing confidently, hands on hips">Confident Stance</SelectItem>
                              <SelectItem value="walking forward, smiling">Walking Pose</SelectItem>
                              <SelectItem value="leaning against a wall, casual">Casual Lean</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={modelForm.control}
                      name="viewAngle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">View Angle</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-10">
                                <SelectValue placeholder="Select view angle" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="front">🎯 Front View</SelectItem>
                              <SelectItem value="side">👤 Side View</SelectItem>
                              <SelectItem value="back">🔄 Back View</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11" 
                    disabled={isGenerateModelDisabled} 
                    suppressHydrationWarning
                  >
                    {loadingStates.generatingModel ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Model...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate AI Model
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Step 3: Virtual Try-On */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="font-headline text-xl lg:text-2xl">Step 3: Virtual Try-On</CardTitle>
                  <CardDescription className="text-sm">Your virtual try-on result</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Result Preview Area */}
              <div className="relative">
                <div className="w-full aspect-square rounded-lg border-2 border-dashed border-primary/30 bg-background/50 flex items-center justify-center relative overflow-hidden transition-all hover:border-primary/50">
                  {loadingStates.compositing && (
                    <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                      <Loader2 className="w-8 h-8 animate-spin text-primary" />
                      <p className="mt-2 text-sm text-muted-foreground">Creating virtual try-on...</p>
                      <div className="w-32 h-1 bg-muted rounded-full mt-3 overflow-hidden">
                        <div className="w-full h-full bg-primary animate-pulse"></div>
                      </div>
                    </div>
                  )}
                  {compositeImage ? (
                    <>
                      <Image 
                        src={compositeImage} 
                        alt="Virtual Try-On Result" 
                        fill
                        className="object-contain p-2"
                      />
                      <div className="absolute top-2 right-2 bg-green-500/90 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                        Complete
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground flex flex-col items-center p-4">
                      <div className="relative">
                        <Download className="w-10 h-10 mb-3" />
                        {modelImage && clothingImage && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <p className="text-sm text-center font-medium">Virtual try-on result</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {modelImage && clothingImage ? "Ready to generate" : "Complete steps 1 & 2 first"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleCreateTryOn} 
                  className="w-full h-11 bg-primary hover:bg-primary/90" 
                  disabled={isCreateTryOnDisabled} 
                  suppressHydrationWarning
                >
                  {loadingStates.compositing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Try-On...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Create Virtual Try-On
                    </>
                  )}
                </Button>

                <Button 
                  onClick={downloadImage} 
                  variant="outline" 
                  className="w-full h-11 border-primary/30 hover:bg-primary/5" 
                  disabled={isDownloadDisabled} 
                  suppressHydrationWarning
                >
                  <Download className="mr-2 h-4 w-4" /> 
                  Download Result
                </Button>
              </div>

              {/* Status Info */}
              {compositeImage && (
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Try-on completed successfully!</span>
                  </div>
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    View angle: {modelForm.getValues().viewAngle || 'front'} • Ready to download
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Indicator */}
        <div className="mt-8 lg:mt-12">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-muted-foreground">Progress</span>
              <span className="text-sm text-muted-foreground">
                {clothingAnalysis && modelImage && compositeImage ? '3' : 
                 clothingAnalysis && modelImage ? '2' : 
                 clothingAnalysis ? '1' : '0'}/3
              </span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                style={{
                  width: `${clothingAnalysis && modelImage && compositeImage ? '100' : 
                          clothingAnalysis && modelImage ? '66.67' : 
                          clothingAnalysis ? '33.33' : '0'}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl py-6 px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Logo className="h-5 w-5" />
              <span className="text-sm">
                &copy; {new Date().getFullYear()} TryFit. All Rights Reserved.
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Powered by Google Gemini 2.0
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
