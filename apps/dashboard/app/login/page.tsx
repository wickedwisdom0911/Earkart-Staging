"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff, AlertTriangle, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import loginUser from "@/actions/auth/login-user";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";

const formSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPass, setShowPass] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Check for URL parameters and handle them securely
  useEffect(() => {
    const email = searchParams?.get('email');
    const password = searchParams?.get('password');
    
    // Pre-fill email safely (no security risk)
    if (email) {
      form.setValue('email', email);
    }
    
    // Security warning if password is in URL
    if (password) {
      setShowSecurityWarning(true);
      
      // Clean URL by removing parameters
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsPending(true);
    try {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);

      const result = await loginUser(formData);
      
      if (result.success) {
        router.push("/dashboard");
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Please sign in to your account</p>
        </div>

        <div className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="your@email.com"
                        autoComplete="email"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPass ? "text" : "password"}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          disabled={isPending}
                        />
                        <button
                          type="button"
                          tabIndex={-1}
                          className="absolute cursor-pointer right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                          onClick={() => setShowPass((v) => !v)}
                          aria-label={
                            showPass ? "Hide password" : "Show password"
                          }
                        >
                          {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <Button
                  type="button"
                  variant="link"
                  className="text-sm p-0 h-auto cursor-pointer"
                  onClick={() => setShowForgotPasswordDialog(true)}
                  tabIndex={0}
                >
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full mt-2 bg-primary-600 hover:bg-primary-700 hover:scale-[1.04] transition-all duration-200 cursor-pointer"
                disabled={isPending}
              >
                {isPending ? "Logging in..." : "Login"}
              </Button>
            </form>
          </Form>
        </div>
      </div>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotPasswordDialog} onOpenChange={setShowForgotPasswordDialog}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Password Reset Required
              </DialogTitle>
            </div>
            <DialogDescription className="text-gray-600 text-left">
              To reset your password, please contact the support team or Super Admin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-gray-900 mb-3">Contact Information:</h4>
              
              <div className="flex items-center gap-3 text-sm">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Email Support</p>
                  <p className="text-gray-600">support@earkart.com</p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 p-3 rounded-lg border-l-4 border-amber-400">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Only Super Admin or technical support can reset your password for security purposes.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setShowForgotPasswordDialog(false)}
              className="px-6"
            >
              Close
            </Button>
            <Button
              onClick={() => {
                window.open('mailto:support@earkart.com?subject=Password Reset Request', '_blank');
                setShowForgotPasswordDialog(false);
              }}
              className="px-6 bg-primary-600 hover:bg-primary-700"
            >
              Email Support
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Security Warning Dialog */}
      <Dialog open={showSecurityWarning} onOpenChange={setShowSecurityWarning}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Security Warning
              </DialogTitle>
            </div>
            <DialogDescription className="text-gray-600 text-left">
              We detected that your password was visible in the URL. This is a security risk.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
              <h4 className="font-medium text-red-900 mb-2">What happened?</h4>
              <p className="text-sm text-red-800">
                Your login credentials were passed through the URL, which can be:
              </p>
              <ul className="text-sm text-red-800 mt-2 ml-4 list-disc">
                <li>Stored in browser history</li>
                <li>Visible in server logs</li>
                <li>Shared accidentally when copying the URL</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
              <h4 className="font-medium text-blue-900 mb-2">What we did:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Cleaned the URL immediately</li>
                <li>✓ Your email was safely pre-filled</li>
                <li>✓ Password was not stored</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 p-3 rounded-lg border-l-4 border-amber-400">
              <p className="text-sm text-amber-800">
                <strong>Recommendation:</strong> Please clear your browser history and ensure you log in securely.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button
              onClick={() => setShowSecurityWarning(false)}
              className="px-6 bg-red-600 hover:bg-red-700"
            >
              I Understand
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}