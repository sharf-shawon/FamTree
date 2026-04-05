import { Mail } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm text-center">
        <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="text-2xl font-bold">Check your email</h1>
        <p className="mt-2 text-muted-foreground">
          A sign-in link has been sent to your email address. Click the link in
          the email to sign in.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          The link will expire in 24 hours. If you don&apos;t see the email, check
          your spam folder.
        </p>
      </div>
    </div>
  );
}
