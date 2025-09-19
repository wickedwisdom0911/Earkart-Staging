"use client";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, AlertCircle, Phone, Mail, Shield } from "lucide-react";
import CircularText from "@/components/ui/circular-text";
import useLoginUser from "@/hooks/auth/use-login-user";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const [showForgotPasswordDialog, setShowForgotPasswordDialog] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const formSchema = z.object({
    email: z.string().email(),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long" }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Security check and safe URL parameter handling
  useEffect(() => {
    const email = searchParams.get('email');
    const password = searchParams.get('password');
    
    // Security warning if password is found in URL
    if (password) {
      setShowSecurityWarning(true);
      toast.error("Security Warning", {
        description: "Passwords should never be passed in URLs. Please enter your password manually.",
        duration: 8000,
      });
      
      // Clear the URL of sensitive parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('password');
      newUrl.searchParams.delete('email'); // Remove email too for security
      window.history.replaceState({}, '', newUrl.toString());
    }
    
    // Only pre-fill email if no password was detected in URL (safer approach)
    else if (email && !password) {
      form.setValue('email', decodeURIComponent(email));
    }
  }, [searchParams, form]);

  const { mutate: loginUser, isPending } = useLoginUser();

  const handleSubmit = async (data: z.infer<typeof formSchema>) => {
    const formData = new FormData();
    formData.append("email", data.email);
    formData.append("password", data.password);
    loginUser(formData, {
      onSuccess: (data) => {
        if (data.success) {
          toast.success("Login successful", {
            description: "You have been logged in successfully",
          });
          router.replace("/dashboard");
        } else {
          toast.error("Login failed", {
            description: data.message,
          });
        }
      },
      onError: (error) => {
        toast.error("Login failed", {
          description: error.message,
        });
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative  px-2 overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/login-bg.webp"
          alt="Background"
          fill
          className="object-cover w-full h-full"
          style={{ filter: "blur(12px)", opacity: 0.55 }}
          priority
        />
        <div className="absolute inset-0 bg-primary-200/40 dark:bg-black/40" />
      </div>
      <CircularText
        text="EARKART*OMNI*"
        onHover="speedUp"
        spinDuration={20}
        className="absolute bottom-5 right-5"
      />
      <div className="w-full max-w-md bg-white/90 dark:bg-background/70 border border-primary-400 shadow-2xl p-6 sm:p-8 flex flex-col items-center backdrop-blur-md">
        <div className="flex flex-col items-center w-full mb-6">
          <Image src="/logo.webp" alt="Logo" width={180} height={60} priority />
          <div className="flex flex-col items-center bg-primary-100 w-full p-2 rounded-md">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-primary-700 tracking-tight leading-tight">
              OMNI
            </h1>
            <span className="text-xs sm:text-sm text-muted-foreground text-center">
              by earKart Limited
            </span>
          </div>
        </div>
        <div className="w-full">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-5"
              autoComplete="off"
            >
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
                        placeholder="you@example.com"
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
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Security Alert
              </DialogTitle>
            </div>
            <DialogDescription className="text-gray-600 text-left">
              A password was detected in the URL. This is a serious security risk.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
              <h4 className="font-medium text-red-900 mb-2">Why this is dangerous:</h4>
              <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                <li>URLs can be logged by servers, proxies, and browsers</li>
                <li>URLs may be visible in browser history</li>
                <li>URLs can be accidentally shared or leaked</li>
                <li>Credentials in URLs violate security best practices</li>
              </ul>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Action taken:</strong> The URL has been automatically cleaned and sensitive parameters removed. Please enter your credentials using the secure form below.
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

    </div>

  );

}




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

    </div>

  );

}


