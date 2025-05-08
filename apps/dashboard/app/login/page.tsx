"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import CircularText from "@/components/ui/circular-text";
import useLoginUser from "@/hooks/auth/use-login-user";
import { toast } from "sonner";
export default function LoginPage() {
  const [showPass, setShowPass] = useState(false);

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
        } else {
          toast.error("Login failed", {
            description: data.message,
          });
        }
      },
      onError: (error) => {
        console.log(error);
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
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" className="cursor-pointer" />
                  <Label htmlFor="remember" className="text-sm">
                    Remember me
                  </Label>
                </div>
                <Button
                  type="button"
                  variant="link"
                  className="text-sm p-0 h-auto cursor-pointer"
                  onClick={() => alert("Forgot password clicked!")}
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
    </div>
  );
}
